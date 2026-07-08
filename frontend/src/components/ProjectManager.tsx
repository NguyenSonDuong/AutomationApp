import React, { useState } from 'react';
import { Folder, Plus, Trash2, Pencil, CheckCircle2, Play } from 'lucide-react';
import CustomDialog from './CustomDialog';
import UnifiedTable, { type Column } from './UnifiedTable';

interface ProjectManagerProps {
  projects: any[];
  activeProject: any;
  onSelectProject: (id: number) => void;
  onCreateProject: (name: string, desc: string) => void;
  onUpdateProject: (id: number, name: string, desc: string) => void;
  onDeleteProject: (id: number) => void;
  loading?: boolean;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  loading = false
}) => {
  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Project for Edit/Delete
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setIsAddOpen(true);
  };

  const handleCreateSubmit = () => {
    if (!name.trim()) return;
    onCreateProject(name, description);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (project: any) => {
    setSelectedProject(project);
    setEditName(project.name || '');
    setEditDescription(project.description || '');
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = () => {
    if (!selectedProject || !editName.trim()) return;
    onUpdateProject(selectedProject.id, editName, editDescription);
    setIsEditOpen(false);
  };

  const handleOpenDelete = (project: any) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!selectedProject) return;
    onDeleteProject(selectedProject.id);
    setIsDeleteOpen(false);
  };

  const columns: Column[] = [
    { key: 'status', label: 'Trạng thái', initialWidth: 110, minWidth: 80 },
    { key: 'name', label: 'Tên Dự Án', initialWidth: 200, minWidth: 100 },
    { key: 'description', label: 'Mô Tả', initialWidth: 350, minWidth: 150 },
    { key: 'createdAt', label: 'Ngày Tạo', initialWidth: 180, minWidth: 120 },
    { key: 'actions', label: 'Thao tác', initialWidth: 200, minWidth: 150 }
  ];

  const renderRow = (p: any, _idx: number, _widths: number[]) => {
    const isActive = activeProject && activeProject.id === p.id;
    return (
      <tr key={p.id} className={isActive ? 'row-selected' : ''}>
        <td>
          {isActive ? (
            <span style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              borderRadius: '4px',
              backgroundColor: 'var(--color-success)',
              color: '#fff',
              fontWeight: 'bold'
            }}>ACTIVE</span>
          ) : (
            <span style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)'
            }}>Chờ</span>
          )}
        </td>
        <td className="bold-cell" style={{ fontWeight: 700 }}>{p.name}</td>
        <td>{p.description || <span className="muted" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Không có mô tả</span>}</td>
        <td>{p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '-'}</td>
        <td>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              title="Kích hoạt chọn dự án thiết kế kịch bản" 
              onClick={() => onSelectProject(p.id)}
              style={{
                width: 'auto',
                padding: '6px 12px',
                fontSize: '0.8rem',
                backgroundColor: isActive ? 'var(--color-accent-hover)' : 'var(--color-accent)'
              }}
            >
              <Play size={12} />
              <span style={{ marginLeft: '4px' }}>{isActive ? 'Đang chọn' : 'Chọn làm việc'}</span>
            </button>
            <button 
              className="btn-action" 
              title="Sửa dự án" 
              onClick={() => handleOpenEdit(p)}
              style={{ color: 'var(--color-accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
            >
              <Pencil size={16} />
            </button>
            <button 
              className="btn-action" 
              title="Xóa dự án" 
              onClick={() => handleOpenDelete(p)}
              style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="proxy-manager-container" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '24px',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={24} style={{ color: 'var(--color-accent)' }} />
            <span>Quản lý dự án (Projects)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Xem danh sách các dự án tự động hóa, chỉnh sửa thông tin hoặc chọn dự án hoạt động để vào màn hình thiết kế Canvas
          </p>
        </div>

        <div>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAdd}
            style={{ width: 'auto', padding: '10px 16px' }}
          >
            <Plus size={14} />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </div>

      {/* 2. Active Project Notice */}
      {activeProject && (
        <div style={{
          backgroundColor: 'var(--color-accent-light)',
          border: '1px solid var(--color-accent)',
          color: 'var(--color-accent-hover)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>Dự án đang kích hoạt: <strong>{activeProject.name}</strong> ({activeProject.description || 'Không có mô tả'})</span>
          </div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent-hover)', background: '#fff', padding: '2px 8px', borderRadius: '12px' }}>ACTIVE</span>
        </div>
      )}

      {/* 3. Resizable scrollable Table */}
      <UnifiedTable
        columns={columns}
        data={projects}
        renderRow={renderRow}
        loading={loading}
        emptyText='Chưa có dự án nào được tạo. Hãy nhấn "Tạo dự án mới"!'
        maxHeight='calc(100vh - 220px)'
      />

      {/* 4. Add Project Dialog */}
      <CustomDialog
        isOpen={isAddOpen}
        title="Tạo dự án tự động hóa mới"
        type="form"
        onClose={() => setIsAddOpen(false)}
        onConfirm={handleCreateSubmit}
        confirmText="Xác nhận tạo"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Tên dự án *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Auto Facebook Reg" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mô tả dự án</label>
            <textarea 
              className="form-control" 
              placeholder="Nhập mô tả kịch bản của dự án..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CustomDialog>

      {/* 5. Edit Project Dialog */}
      <CustomDialog
        isOpen={isEditOpen}
        title="Chỉnh sửa thông tin dự án"
        type="form"
        onClose={() => setIsEditOpen(false)}
        onConfirm={handleUpdateSubmit}
        confirmText="Lưu thay đổi"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Tên dự án *</label>
            <input 
              type="text" 
              className="form-control" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mô tả dự án</label>
            <textarea 
              className="form-control" 
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CustomDialog>

      {/* 6. Delete Project Dialog */}
      {selectedProject && (
        <CustomDialog
          isOpen={isDeleteOpen}
          title={`Xác nhận xóa dự án`}
          type="danger"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteSubmit}
          confirmText="Xác nhận xóa"
          cancelText="Hủy bỏ"
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            Bạn có chắc chắn muốn xóa dự án <strong>{selectedProject.name}</strong> cùng toàn bộ các bước kịch bản liên quan?
            <div style={{ color: 'var(--color-error)', fontWeight: 700, marginTop: '8px' }}>
              ⚠️ Hành động này không thể hoàn tác và sẽ xóa sạch cấu hình khỏi cơ sở dữ liệu!
            </div>
          </div>
        </CustomDialog>
      )}
    </div>
  );
};

export default ProjectManager;
