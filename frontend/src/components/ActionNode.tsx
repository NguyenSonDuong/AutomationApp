import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MousePointer, 
  Type, 
  Compass, 
  Plus, 
  X, 
  Sliders, 
  ArrowRightLeft, 
  Upload, 
  List,
  Power,
  Database,
  Milestone
} from 'lucide-react';

interface ActionNodeProps {
  data: {
    action_type: string;
    is_start?: boolean;
    target_tab?: string;
    selector?: string;
    target_selector?: string;
    is_random?: boolean;
    random_type?: string;
    min_val?: number;
    max_val?: number;
    value?: string;
    scroll_x?: number;
    scroll_y?: number;
    extra_params?: {
      attribute?: string;
      custom_attribute?: string;
    };
  };
  selected: boolean;
}

const getActionMeta = (type: string) => {
  switch (type) {
    case 'new_tab':
      return { label: 'Mở tab mới', icon: Plus, class: 'new_tab' };
    case 'open_tab':
      return { label: 'Truy cập URL', icon: Compass, class: 'open_tab' };
    case 'switch_tab':
      return { label: 'Chuyển tab', icon: ArrowRightLeft, class: 'switch_tab' };
    case 'close_tab':
      return { label: 'Đóng tab', icon: X, class: 'close_tab' };
    case 'click':
      return { label: 'Click chuột', icon: MousePointer, class: 'click' };
    case 'click_checkbox':
      return { label: 'Click checkbox', icon: MousePointer, class: 'click_checkbox' };
    case 'select_option':
      return { label: 'Chọn option', icon: List, class: 'select_option' };
    case 'fill_text':
      return { label: 'Điền chữ', icon: Type, class: 'fill_text' };
    case 'scroll':
      return { label: 'Cuộn trang', icon: Sliders, class: 'scroll' };
    case 'drag_drop':
      return { label: 'Kéo thả', icon: Sliders, class: 'drag_drop' };
    case 'upload_file':
      return { label: 'Tải file lên', icon: Upload, class: 'upload_file' };
    case 'close_browser':
      return { label: 'Đóng trình duyệt', icon: Power, class: 'close_browser' };
    case 'extract_data':
      return { label: 'Lấy dữ liệu', icon: Database, class: 'extract_data' };
    case 'waypoint':
      return { label: 'Chuyển hướng', icon: Milestone, class: 'waypoint' };
    default:
      return { label: 'Hành động', icon: Sliders, class: 'default' };
  }
};

const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  const meta = getActionMeta(data.action_type);
  const IconComponent = meta.icon;

  if (data.action_type === 'waypoint') {
    return (
      <div 
        className={`waypoint-node-wrapper ${selected ? 'selected' : ''}`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#fffbeb',
          border: '2px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(139, 92, 26, 0.06)',
          position: 'relative'
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{ borderRadius: '50%', background: 'var(--color-accent)' }}
        />
        
        <IconComponent size={18} style={{ color: 'var(--color-accent-hover)' }} />
        
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{ borderRadius: '50%', background: 'var(--color-accent)' }}
        />
      </div>
    );
  }

  return (
    <div className={`react-flow__node-actionNode ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        style={{ borderRadius: '50%' }}
      />
      
      <div className={`node-header ${meta.class}`}>
        <div className="node-header-title">
          <IconComponent size={14} />
          <span>{meta.label}</span>
        </div>
        {data.is_start && (
          <span className="node-start-badge" style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>START</span>
        )}
      </div>

      <div className="node-body">
        <div className="node-preview">
          {data.action_type === 'extract_data' ? (
            <>
              {data.selector && (
                <div className="node-preview-item">
                  <span className="node-preview-label">Selector:</span> {data.selector}
                </div>
              )}
              <div className="node-preview-item">
                <span className="node-preview-label">Thuộc tính:</span> {data.extra_params?.attribute || 'text'}
              </div>
              {data.value && (
                <div className="node-preview-item" style={{ color: '#d97706', fontWeight: 700 }}>
                  <span className="node-preview-label" style={{ color: '#d97706' }}>Biến lưu:</span> {data.value}
                </div>
              )}
            </>
          ) : (
            <>
              {data.target_tab && data.target_tab !== 'current' && (
                <div className="node-preview-item">
                  <span className="node-preview-label">Tab:</span> {data.target_tab}
                </div>
              )}
              {data.selector && (
                <div className="node-preview-item">
                  <span className="node-preview-label">Selector:</span> {data.selector}
                </div>
              )}
              {data.target_selector && (
                <div className="node-preview-item">
                  <span className="node-preview-label">Target:</span> {data.target_selector}
                </div>
              )}
              {data.is_random ? (
                <div className="node-preview-item" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  <span className="node-preview-label">
                    Ngẫu nhiên {
                      data.random_type === 'number' ? 'Số' : 
                      data.random_type === 'date' ? 'Ngày' : 
                      data.random_type === 'name' ? 'Họ Tên' :
                      data.random_type === 'firstname' ? 'Tên' :
                      data.random_type === 'lastname' ? 'Họ' :
                      data.random_type === 'email' ? 'Email' : 'Chữ'
                    }:
                  </span> {['name', 'firstname', 'lastname', 'email'].includes(data.random_type || '') ? '' : `[${data.min_val || 0}, ${data.max_val || 0}]`}
                </div>
              ) : (
                data.value && (
                  <div className="node-preview-item">
                    <span className="node-preview-label">Value:</span> {data.value}
                  </div>
                )
              )}
              {((data.scroll_x !== undefined && data.scroll_x !== null) || 
                (data.scroll_y !== undefined && data.scroll_y !== null)) && (
                <div className="node-preview-item">
                  <span className="node-preview-label">Scroll:</span> X:{data.scroll_x || 0}, Y:{data.scroll_y || 0}
                </div>
              )}
              
              {!data.selector && !data.value && !data.target_selector && 
               data.scroll_x === null && data.scroll_y === null && (
                <span style={{ fontStyle: 'italic', color: '#a08e7f' }}>Cấu hình trống</span>
              )}
            </>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="source"
        style={{ borderRadius: '50%' }}
      />
    </div>
  );
};

export default ActionNode;
