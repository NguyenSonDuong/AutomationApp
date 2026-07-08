import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  MarkerType,
  type Connection,
  type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, AlertCircle, Play } from 'lucide-react';
import { io } from 'socket.io-client';

import ProjectSidebar from './components/ProjectSidebar';
import Toolbox from './components/Toolbox';
import NodeDetailsSidebar from './components/NodeDetailsSidebar';
import ActionNode from './components/ActionNode';
import RunModal from './components/RunModal';
import ProxyManager from './components/ProxyManager';
import ProfileManager from './components/ProfileManager';

const nodeTypes = {
  actionNode: ActionNode
};

const BASE_URL = 'http://localhost:3000/api';

const formatEdgeLabel = (condition: any): string => {
  if (!condition) return '';
  let condObj: any = null;
  if (typeof condition === 'object') {
    condObj = condition;
  } else {
    try {
      condObj = JSON.parse(condition);
    } catch (e) {}
  }
  if (!condObj || !condObj.rules || condObj.rules.length === 0) {
    return typeof condition === 'string' ? condition : '';
  }
  const op = condObj.logical_operator === 'OR' ? ' OR ' : ' AND ';
  return condObj.rules.map((r: any) => {
    const attrLabel = r.attribute === 'custom' ? (r.custom_attribute || 'attr') : r.attribute;
    const compLabel = {
      eq: '=',
      neq: '!=',
      contains: 'contains',
      not_contains: 'not_contains',
      gt: '>',
      lt: '<'
    }[r.comparison as string] || '=';
    return `${attrLabel}${compLabel}"${r.value || ''}"`;
  }).join(op);
};

function App() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [isRunModalOpen, setIsRunModalOpen] = useState<boolean>(false);
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [watchedLogId, setWatchedLogId] = useState<number | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const watchedLogIdRef = useRef<number | null>(null);
  useEffect(() => {
    watchedLogIdRef.current = watchedLogId;
  }, [watchedLogId]);

  // Connect to Port 3000 SocketIO to receive execution progress status mapping (Active glow effects)
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Node.js proxy server (Port 3000)');
    });

    socket.on('flow_execution_status', (data: any) => {
      const { id, is_node, status, log_id } = data;
      
      if (watchedLogIdRef.current && log_id && log_id !== watchedLogIdRef.current) {
        return;
      }

      const targetId = id.toString();

      if (is_node) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === targetId) {
              return {
                ...node,
                className: `glow-node-${status}`
              };
            }
            return node;
          })
        );
      } else {
        setEdges((eds) =>
          eds.map((edge) => {
            const match = edge.id === targetId || edge.id.replace('edge_', '') === targetId || edge.id === `edge_${targetId}`;
            if (match) {
              const isLoop = edge.data?.is_loop || false;
              return {
                ...edge,
                className: status === 'active' ? 'glow-edge-active' : (isLoop ? 'loop-edge' : ''),
                style: {
                  ...edge.style,
                  stroke: status === 'active' 
                    ? 'var(--color-accent)' 
                    : (isLoop ? 'var(--color-loop)' : 'var(--text-secondary)'),
                  strokeWidth: status === 'active' ? 4 : 2.5
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed
                }
              };
            }
            return edge;
          })
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [setNodes, setEdges]);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      showNotice('Không thể kết nối đến API Server!', 'error');
    }
  };

  const loadProjectDetail = async (projectId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/projects/${projectId}`);
      if (res.status === 404) {
        setActiveProject(null);
        return;
      }
      const data = await res.json();
      setActiveProject(data);
      setSelectedElement(null);

      // Map steps to React Flow nodes
      const flowNodes = (data.steps || []).map((step: any) => ({
        id: step.id.toString(),
        type: 'actionNode',
        position: { x: step.positionX || 100, y: step.positionY || 100 },
        data: {
          action_type: step.actionType,
          target_tab: step.targetTab,
          selector: step.selector,
          target_selector: step.targetSelector,
          value: step.value,
          scroll_x: step.scrollX,
          scroll_y: step.scrollY,
          is_start: step.isStart,
          extra_params: step.extraParams ? (typeof step.extraParams === 'string' ? JSON.parse(step.extraParams) : step.extraParams) : null,
          is_random: step.isRandom,
          min_val: step.minVal,
          max_val: step.maxVal,
          random_type: step.randomType
        },
        className: step.actionType === 'waypoint' ? 'waypoint-node-container' : ''
      }));

      // Map edges to React Flow edges
      const flowEdges = (data.edges || []).map((edge: any) => {
        const delayLabel = edge.timeDelay > 0 ? ` (Chờ ${edge.timeDelay}s)` : '';
        const displayLabel = `${formatEdgeLabel(edge.condition)}${delayLabel}`;
        
        return {
          id: `edge_${edge.id}`,
          source: edge.sourceStepId.toString(),
          target: edge.targetStepId.toString(),
          label: displayLabel,
          type: 'smoothstep',
          className: edge.isLoop ? 'loop-edge' : '',
          style: { stroke: edge.isLoop ? 'var(--color-loop)' : 'var(--text-secondary)' },
          markerEnd: {
            type: MarkerType.ArrowClosed
          },
          data: {
            condition: edge.condition ? (typeof edge.condition === 'string' ? JSON.parse(edge.condition) : edge.condition) : '',
            is_loop: edge.isLoop,
            time_delay: edge.timeDelay,
            timeout: edge.extraParams ? (typeof edge.extraParams === 'string' ? JSON.parse(edge.extraParams).timeout : edge.extraParams.timeout) : 3
          }
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (e) {
      showNotice('Không thể tải thông tin dự án!', 'error');
    }
  };

  const handleSelectProject = (projectId: number) => {
    loadProjectDetail(projectId);
    setActiveTab('canvas');
  };

  const handleCreateProject = async (name: string, desc: string) => {
    try {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc })
      });
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      loadProjectDetail(newProj.id);
      showNotice('Tạo dự án thành công!');
    } catch (e) {
      showNotice('Không thể tạo dự án!', 'error');
    }
  };

  const handleUpdateProject = async (id: number, name: string, desc: string) => {
    try {
      const res = await fetch(`${BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc })
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(projects.map(p => p.id === id ? updated : p));
        if (activeProject && activeProject.id === id) {
          setActiveProject({ ...activeProject, name, description: desc });
        }
        showNotice('Cập nhật dự án thành công!');
      }
    } catch (e) {
      showNotice('Cập nhật dự án thất bại!', 'error');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await fetch(`${BASE_URL}/projects/${projectId}`, { method: 'DELETE' });
      setProjects(projects.filter((p) => p.id !== projectId));
      if (activeProject && activeProject.id === projectId) {
        setActiveProject(null);
        setNodes([]);
        setEdges([]);
        setSelectedElement(null);
      }
      showNotice('Đã xóa dự án thành công!');
    } catch (e) {
      showNotice('Xóa dự án thất bại!', 'error');
    }
  };

  // React Flow connection handler
  const onConnect = useCallback((params: Edge | Connection) => {
    const newEdge = {
      ...params,
      id: `edge_temp_${Date.now()}`,
      label: '',
      type: 'smoothstep',
      style: { stroke: 'var(--text-secondary)' },
      markerEnd: {
        type: MarkerType.ArrowClosed
      },
      data: { condition: '', is_loop: false, time_delay: 0, timeout: 3 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Drag & drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!activeProject) return;

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const tempId = `temp_${Date.now()}`;
      const newNode = {
        id: tempId,
        type: 'actionNode',
        position,
        className: type === 'waypoint' ? 'waypoint-node-container' : '',
        data: {
          action_type: type,
          target_tab: 'current',
          selector: '',
          target_selector: '',
          value: '',
          scroll_x: 0,
          scroll_y: 0,
          is_start: nodes.length === 0
        }
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedElement(newNode);
    },
    [reactFlowInstance, nodes, activeProject]
  );

  const onElementClick = useCallback((_event: React.MouseEvent, element: any) => {
    setSelectedElement(element);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const onUpdateNode = (nodeId: string, updatedData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: updatedData };
          if (selectedElement && selectedElement.id === nodeId) {
            setSelectedElement(updatedNode);
          }
          return updatedNode;
        } else if (updatedData.is_start) {
          return {
            ...node,
            data: {
              ...node.data,
              is_start: false
            }
          };
        }
        return node;
      })
    );
  };

  const onUpdateEdge = (edgeId: string, condition: any, isLoop: boolean, timeDelay: number, timeout = 3) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          const delayLabel = timeDelay > 0 ? ` (Chờ ${timeDelay}s)` : '';
          const displayLabel = `${formatEdgeLabel(condition)}${delayLabel}`;

          const updatedEdge = {
            ...edge,
            label: displayLabel,
            type: 'smoothstep',
            className: isLoop ? 'loop-edge' : '',
            style: { stroke: isLoop ? 'var(--color-loop)' : 'var(--text-secondary)' },
            markerEnd: {
              type: MarkerType.ArrowClosed
            },
            data: { condition, is_loop: isLoop, time_delay: timeDelay, timeout }
          };
          if (selectedElement && selectedElement.id === edgeId) {
            setSelectedElement(updatedEdge);
          }
          return updatedEdge;
        }
        return edge;
      })
    );
  };

  const onDeleteElement = (elementId: string, isNode: boolean) => {
    if (isNode) {
      setNodes((nds) => nds.filter((n) => n.id !== elementId));
      setEdges((eds) => eds.filter((e) => e.source !== elementId && e.target !== elementId));
    } else {
      setEdges((eds) => eds.filter((e) => e.id !== elementId));
    }
    setSelectedElement(null);
  };

  // Sync / Save diagram details
  const handleSaveFlow = async () => {
    if (!activeProject) return;

    const nodesPayload = nodes.map((node) => ({
      id: node.id,
      action_type: node.data.action_type,
      target_tab: node.data.target_tab || 'current',
      selector: node.data.selector || null,
      target_selector: node.data.target_selector || null,
      value: node.data.value || null,
      scroll_x: node.data.scroll_x !== undefined ? node.data.scroll_x : null,
      scroll_y: node.data.scroll_y !== undefined ? node.data.scroll_y : null,
      position_x: node.position.x,
      position_y: node.position.y,
      is_start: node.data.is_start || false,
      extra_params: node.data.extra_params || null,
      is_random: node.data.is_random || false,
      min_val: node.data.min_val !== undefined && node.data.min_val !== null ? node.data.min_val : null,
      max_val: node.data.max_val !== undefined && node.data.max_val !== null ? node.data.max_val : null,
      random_type: node.data.random_type || null
    }));

    const edgesPayload = edges.map((edge) => ({
      source_step_id: edge.source,
      target_step_id: edge.target,
      condition: edge.data?.condition || null,
      is_loop: edge.data?.is_loop || false,
      time_delay: edge.data?.time_delay || 0.0,
      extra_params: edge.data?.timeout !== undefined ? { timeout: edge.data.timeout } : { timeout: 3 }
    }));

    try {
      const res = await fetch(`${BASE_URL}/projects/${activeProject.id}/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodesPayload,
          edges: edgesPayload
        })
      });

      if (res.ok) {
        showNotice('Lưu sơ đồ kịch bản thành công!');
        loadProjectDetail(activeProject.id);
      } else {
        showNotice('Lưu sơ đồ thất bại!', 'error');
      }
    } catch (e) {
      showNotice('Lỗi kết nối khi lưu sơ đồ!', 'error');
    }
  };

  // Trigger automation run
  const handleRunAutomation = async (threads = 1, profileIds: number[] = [], profileProxyMap: any = {}) => {
    if (!activeProject) return;
    setIsRunModalOpen(false);
    
    await handleSaveFlow();

    setNodes((nds) => nds.map((n) => ({ ...n, className: '' })));

    try {
      showNotice('Đang bắt đầu chạy thử nghiệm kịch bản...');
      const res = await fetch(`${BASE_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProject.id,
          threads,
          profile_ids: profileIds,
          profile_proxy_map: profileProxyMap
        })
      });
      if (res.ok) {
        const data = await res.json();
        const tasks = data.task || [];
        if (tasks.length > 0) {
          setActiveRuns(tasks);
          setWatchedLogId(tasks[0].id);
          showNotice(`Đã kích hoạt ${tasks.length} luồng chạy song song!`);
        }
      } else {
        showNotice('Chạy thử nghiệm kịch bản thất bại!', 'error');
      }
    } catch (e) {
      showNotice('Lỗi kết nối khi chạy kịch bản!', 'error');
    }
  };

  const showNotice = (msg: string, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="app-container">
      <ProjectSidebar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {activeTab === 'canvas' ? (
        <div className="canvas-area">
          <div className="canvas-header">
            <div className="canvas-title-area">
              <h3>{activeProject ? activeProject.name : 'Vui lòng chọn một Dự án'}</h3>
              {activeProject && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeProject.description || 'Không có mô tả'}
                </span>
              )}
            </div>
            {activeProject && (
              <div className="canvas-actions">
                {activeRuns.length > 0 && (
                  <div className="watch-thread-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Xem luồng:</span>
                    <select
                      className="form-control"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', height: 'auto', cursor: 'pointer' }}
                      value={watchedLogId || ''}
                      onChange={(e) => setWatchedLogId(parseInt(e.target.value) || null)}
                    >
                      {activeRuns.map((run, idx) => {
                        const titleText = run.title || run.target_url || '';
                        const displayName = titleText.includes("Profile:") 
                          ? titleText.split("Profile:")[1].replace(")", "").trim() 
                          : `Log ${run.id}`;
                        return (
                          <option key={run.id} value={run.id}>
                            Luồng {idx + 1} ({displayName})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <button className="btn-primary" onClick={() => setIsRunModalOpen(true)} style={{ backgroundColor: 'var(--color-success)', width: 'auto' }}>
                  <Play size={16} />
                  <span>Chạy thử nghiệm</span>
                </button>
                <button className="btn-primary" onClick={handleSaveFlow} style={{ width: 'auto' }}>
                  <Save size={16} />
                  <span>Lưu sơ đồ</span>
                </button>
              </div>
            )}
          </div>

          {activeProject ? (
            <>
              <Toolbox />

              <div className="react-flow-wrapper" style={{ flex: 1, width: '100%', height: '100%' }} ref={reactFlowWrapper}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={setReactFlowInstance}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onNodeClick={onElementClick}
                  onEdgeClick={onElementClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Controls />
                  <Background color="#e5d5c5" gap={16} size={1} />
                  <MiniMap 
                    nodeStrokeColor={() => 'var(--border-color)'}
                    nodeColor={() => 'var(--bg-secondary)'}
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  />
                </ReactFlow>
              </div>
            </>
          ) : (
            <div className="empty-placeholder">
              <AlertCircle size={48} style={{ color: 'var(--color-accent)' }} />
              <h4>Chọn hoặc tạo một Dự án</h4>
              <p>Vui lòng lựa chọn một dự án có sẵn ở thanh bên trái hoặc điền thông tin để tạo dự án mới, sau đó bạn sẽ có thể kéo thả thiết kế kịch bản tự động hóa trực quan.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'proxy' ? (
        <ProxyManager />
      ) : (
        <ProfileManager />
      )}

      <NodeDetailsSidebar
        selectedElement={selectedElement}
        onUpdateNode={onUpdateNode}
        onUpdateEdge={onUpdateEdge}
        onDeleteElement={onDeleteElement}
        onClose={() => setSelectedElement(null)}
      />

      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onConfirm={handleRunAutomation}
      />

      {notification && (
        <div 
          className="notification" 
          style={{ 
            backgroundColor: notification.type === 'error' ? 'var(--color-error)' : 'var(--color-success)',
            boxShadow: notification.type === 'error' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : '0 4px 12px rgba(22, 163, 74, 0.25)'
          }}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
