import React from 'react';
import { Folder, Users, Globe, Play, Activity } from 'lucide-react';

interface ProjectSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeProject: any;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  activeTab, 
  onSelectTab,
  activeProject
}) => {
  const MENU_ITEMS = [
    { id: 'projects', label: 'Quản lý Project', icon: Folder },
    { id: 'profile', label: 'Quản lý Profile', icon: Users },
    { id: 'proxy', label: 'Quản lý Proxy', icon: Globe },
    { id: 'canvas', label: 'Automation Canvas', icon: Activity }
  ];

  return (
    <div className="project-sidebar" style={{ width: '260px' }}>
      {/* Sidebar Header */}
      <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-hover)', fontWeight: 800, fontSize: '1.2rem' }}>
          <Play size={20} className="spin-icon" style={{ color: 'var(--color-accent)' }} />
          <span>Automation App</span>
        </h2>
      </div>

      {/* Main vertical navigator menu */}
      <div style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MENU_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: '1px solid transparent',
                borderRadius: '8px',
                backgroundColor: isActive ? 'var(--color-accent-light)' : 'transparent',
                color: isActive ? 'var(--color-accent-hover)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <IconComponent size={18} style={{ color: isActive ? 'var(--color-accent)' : 'inherit' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Project Footer Widget */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dự án đang làm việc
        </div>
        {activeProject ? (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {activeProject.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '2px' }}>
              {activeProject.description || 'Không có mô tả'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#a08e7f', fontStyle: 'italic' }}>
            Chưa chọn dự án nào
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSidebar;
