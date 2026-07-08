import React, { useState } from 'react';
import { Folder, Plus, Trash2, Pencil } from 'lucide-react';

interface ProjectSidebarProps {
  projects: any[];
  activeProject: any;
  onSelectProject: (id: number) => void;
  onCreateProject: (name: string, desc: string) => void;
  onUpdateProject: (id: number, name: string, desc: string) => void;
  onDeleteProject: (id: number) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  projects, 
  activeProject, 
  onSelectProject, 
  onCreateProject, 
  onUpdateProject,
  onDeleteProject, 
  activeTab, 
  onSelectTab 
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    onCreateProject(newProjectName, newProjectDesc);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  return (
    <div className="project-sidebar">
      {/* Tab Switcher - Now features 3 tabs: Canvas, Proxies and Chrome Profiles */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <button
          type="button"
          onClick={() => onSelectTab('canvas')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            backgroundColor: activeTab === 'canvas' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'canvas' ? 'var(--color-accent-hover)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'canvas' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'canvas' ? '3px solid var(--color-accent)' : 'none',
            fontSize: '0.8rem',
            fontFamily: 'inherit'
          }}
        >
          Thiết kế kịch bản
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('proxy')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            backgroundColor: activeTab === 'proxy' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'proxy' ? 'var(--color-accent-hover)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'proxy' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'proxy' ? '3px solid var(--color-accent)' : 'none',
            fontSize: '0.8rem',
            fontFamily: 'inherit'
          }}
        >
          Quản lý Proxy
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            backgroundColor: activeTab === 'profile' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--color-accent-hover)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'profile' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'profile' ? '3px solid var(--color-accent)' : 'none',
            fontSize: '0.8rem',
            fontFamily: 'inherit'
          }}
        >
          Quản lý Profile
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h2>
          <Folder size={20} />
          <span>Dự án Automation</span>
        </h2>
      </div>

      {/* Project list container */}
      <div className="project-list">
        {projects.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.85rem', color: '#8a796b', fontStyle: 'italic' }}>
            Chưa có dự án nào. Hãy tạo một dự án mới ở dưới!
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${activeProject && activeProject.id === project.id ? 'active' : ''}`}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="project-info">
                <span className="project-name">{project.name}</span>
                <span className="project-desc">{project.description || 'Không có mô tả'}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button
                  className="project-delete-btn"
                  title="Sửa dự án"
                  onClick={() => {
                    const newName = window.prompt("Nhập tên mới cho dự án:", project.name);
                    const newDesc = window.prompt("Nhập mô tả mới cho dự án:", project.description || "");
                    if (newName !== null && newName.trim() !== '') {
                      onUpdateProject(project.id, newName, newDesc || "");
                    }
                  }}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="project-delete-btn"
                  title="Xóa dự án"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa dự án "${project.name}" và toàn bộ kịch bản liên quan?`)) {
                      onDeleteProject(project.id);
                    }
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Project section */}
      <div className="new-project-section">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="new-project-input"
            placeholder="Tên dự án mới..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
          />
          <input
            type="text"
            className="new-project-input"
            placeholder="Mô tả dự án..."
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} />
            <span>Tạo dự án mới</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectSidebar;
