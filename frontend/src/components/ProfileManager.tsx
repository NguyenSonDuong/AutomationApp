import React, { useState, useEffect } from 'react';
import { 
  Folder, Trash2, Plus, Search, Pencil, Shield, Globe
} from 'lucide-react';

const BASE_URL = 'http://localhost:3000/api';

const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  // Single Profile Create Form Inputs
  const [name, setName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [proxyId, setProxyId] = useState<number | -1>(-1);

  // Edit Form Inputs
  const [editName, setEditName] = useState('');
  const [editUserAgent, setEditUserAgent] = useState('');
  const [editProxyId, setEditProxyId] = useState<number | -1>(-1);

  useEffect(() => {
    fetchProfiles();
    fetchProxies();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error("Không thể tải danh sách profiles", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProxies = async () => {
    try {
      const res = await fetch(`${BASE_URL}/proxies`);
      if (res.ok) {
        const data = await res.json();
        setProxies(data);
      }
    } catch (e) {
      console.error("Không thể tải danh sách proxies", e);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          folderName: folderName.trim() || null,
          userAgent: userAgent.trim() || null,
          proxyId: proxyId === -1 ? null : proxyId
        })
      });

      if (res.ok) {
        const newProf = await res.json();
        setProfiles([newProf, ...profiles]);
        // Reset form
        setName('');
        setFolderName('');
        setUserAgent('');
        setProxyId(-1);
        setShowAddForm(false);
      } else {
        const err = await res.json();
        alert(err.error || "Tạo profile thất bại");
      }
    } catch (e) {
      alert("Lỗi kết nối khi tạo profile");
    }
  };

  const handleOpenEditModal = (profile: any) => {
    setEditingProfile(profile);
    setEditName(profile.name || '');
    setEditUserAgent(profile.userAgent || '');
    setEditProxyId(profile.proxyId || -1);
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editName.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          userAgent: editUserAgent.trim() || null,
          proxyId: editProxyId === -1 ? null : editProxyId
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfiles((prev) => 
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setEditingProfile(null);
      } else {
        const err = await res.json();
        alert(err.error || "Cập nhật profile thất bại");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối khi cập nhật profile");
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Chrome Profile này?")) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProfiles(profiles.filter(p => p.id !== id));
        setSelectedProfileIds(selectedProfileIds.filter(x => x !== id));
      }
    } catch (e) {
      console.error("Xóa profile thất bại", e);
    }
  };

  const handleSelectProfile = (id: number) => {
    if (selectedProfileIds.includes(id)) {
      setSelectedProfileIds(selectedProfileIds.filter(x => x !== id));
    } else {
      setSelectedProfileIds([...selectedProfileIds, id]);
    }
  };

  const handleSelectAll = () => {
    const filteredIds = filteredProfiles.map(p => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProfileIds.includes(id));
    if (allSelected) {
      setSelectedProfileIds(selectedProfileIds.filter(id => !filteredIds.includes(id)));
    } else {
      const uniqueIds = Array.from(new Set([...selectedProfileIds, ...filteredIds]));
      setSelectedProfileIds(uniqueIds);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedProfileIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProfileIds.length} profiles đã chọn?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProfileIds })
      });
      if (res.ok) {
        setProfiles(profiles.filter(p => !selectedProfileIds.includes(p.id)));
        setSelectedProfileIds([]);
      } else {
        alert("Xóa hàng loạt profiles thất bại!");
      }
    } catch (e) {
      console.error("Lỗi khi xóa hàng loạt profiles", e);
      alert("Lỗi kết nối khi xóa hàng loạt profiles");
    }
  };

  // Filter & Search
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = searchQuery === '' || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.folderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Stats computation
  const totalCount = profiles.length;
  const withProxyCount = profiles.filter(p => p.proxyId !== null && p.proxyId !== undefined).length;
  const customUACount = profiles.filter(p => p.userAgent !== null && p.userAgent !== undefined && p.userAgent !== '').length;

  return (
    <div className="proxy-manager-container" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '24px',
      backgroundColor: 'var(--bg-primary)',
      overflowY: 'auto'
    }}>
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={24} style={{ color: 'var(--color-accent)' }} />
            <span>Quản lý Chrome Profiles</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tạo lập hồ sơ Chrome riêng biệt, gán địa chỉ IP và tùy biến User-Agent hỗ trợ chạy đa luồng
          </p>
        </div>

        <div>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ width: 'auto', padding: '10px 16px' }}
          >
            <Plus size={14} />
            <span>Thêm Profile mới</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', color: '#d97706' }}>
            <Folder size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG CHROME PROFILES</div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '6px', color: '#0369a1' }}>
            <Globe size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>{withProxyCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PROFILE CÓ PROXY LINK</div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '6px', color: '#6b21a8' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6b21a8' }}>{customUACount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TÙY BIẾN USER-AGENT</div>
          </div>
        </div>
      </div>

      {/* 3. Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateProfile} className="add-profile-form" style={{ marginBottom: '24px' }}>
          <h4>Thêm Mới Chrome Profile</h4>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Tên Profile *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ví dụ: Account Facebook 01" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tên thư mục (Folder Name)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Để trống để tự tạo..." 
                value={folderName} 
                onChange={(e) => setFolderName(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>User Agent (Tùy chọn)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Mozilla/5.0..." 
                value={userAgent} 
                onChange={(e) => setUserAgent(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Liên kết Proxy</label>
              <select 
                className="form-control" 
                value={proxyId} 
                onChange={(e) => setProxyId(parseInt(e.target.value))}
              >
                <option value={-1}>-- Không dùng Proxy --</option>
                {proxies.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.type || 'HTTP'}] {p.host}:{p.port} ({p.country || '?'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: 'auto', padding: '10px 24px' }}>
            Xác nhận tạo Profile
          </button>
        </form>
      )}

      {/* 4. Edit Modal */}
      {editingProfile && (
        <div className="run-modal-backdrop">
          <div className="run-modal-container" style={{ maxWidth: '500px' }}>
            <div className="run-modal-header">
              <h3>
                <Pencil size={18} />
                <span>Chỉnh sửa Chrome Profile</span>
              </h3>
              <button className="run-modal-close-btn" onClick={() => setEditingProfile(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProfileSubmit}>
              <div className="run-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Tên Profile *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>User Agent</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editUserAgent} 
                    onChange={(e) => setEditUserAgent(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Proxy liên kết</label>
                  <select 
                    className="form-control" 
                    value={editProxyId} 
                    onChange={(e) => setEditProxyId(parseInt(e.target.value))}
                  >
                    <option value={-1}>-- Không dùng Proxy --</option>
                    {proxies.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.type || 'HTTP'}] {p.host}:{p.port} ({p.country || '?'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="run-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingProfile(null)}>Hủy bỏ</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Toolbar Filters */}
      <div className="filter-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <Search size={16} style={{ color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên, thư mục..." 
          className="form-control" 
          style={{ width: '280px', padding: '6px 12px', fontSize: '0.85rem' }} 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {selectedProfileIds.length > 0 && (
          <button type="button" className="btn-danger" onClick={handleDeleteMultiple} style={{ width: 'auto', padding: '6px 14px', margin: 0, fontSize: '0.8rem', marginLeft: 'auto' }}>
            <Trash2 size={12} />
            <span>Xóa {selectedProfileIds.length} mục đã chọn</span>
          </button>
        )}
      </div>

      {/* 6. Profiles Table Grid */}
      <div className="flat-table-wrapper" style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="flat-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={filteredProfiles.length > 0 && filteredProfiles.every(p => selectedProfileIds.includes(p.id))}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                />
              </th>
              <th>Tên Chrome Profile</th>
              <th>Thư mục (Folder Name)</th>
              <th>User Agent</th>
              <th>Proxy Liên Kết</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Đang tải danh sách Chrome Profiles...
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Không tìm thấy Chrome Profile nào.
                </td>
              </tr>
            ) : (
              filteredProfiles.map(p => {
                const isChecked = selectedProfileIds.includes(p.id);
                return (
                  <tr key={p.id} className={isChecked ? 'row-selected' : ''} style={{ backgroundColor: isChecked ? 'var(--color-accent-light)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleSelectProfile(p.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                      />
                    </td>
                    <td className="bold-cell">{p.name}</td>
                    <td><code className="flat-code">{p.folderName}</code></td>
                    <td className="truncate-cell" title={p.userAgent || 'Mặc định'}>{p.userAgent || 'Trình duyệt hệ thống'}</td>
                    <td>
                      {p.proxyDetail ? (
                        <span className="profile-badge badge-proxy">
                          [{p.proxyDetail.type}] {p.proxyDetail.host}:{p.proxyDetail.port}
                        </span>
                      ) : (
                        <span className="muted" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>Không liên kết</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          className="btn-action" 
                          title="Sửa thông tin" 
                          onClick={() => handleOpenEditModal(p)}
                          style={{ color: 'var(--color-accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="btn-action" 
                          title="Xóa profile" 
                          onClick={() => handleDeleteProfile(p.id)}
                          style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileManager;
