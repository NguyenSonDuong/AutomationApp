import React, { useState, useEffect } from 'react';
import { Settings, Play, X, Trash2, Plus, Shield } from 'lucide-react';
import CustomSelect from './CustomSelect';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (threads: number, selectedProfileIds: number[], profileProxyMap: any) => void;
}

const BASE_URL = 'http://localhost:3000/api';

const RunModal: React.FC<RunModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [threads, setThreads] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [profileProxyMap, setProfileProxyMap] = useState<any>({});
  
  // Form tạo mới profile
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newUA, setNewUA] = useState('');
  const [newProxy, setNewProxy] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      fetchProxies();
      setErrorMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    const initialMap: any = {};
    profiles.forEach((p) => {
      initialMap[p.id] = p.proxyId || -1;
    });
    setProfileProxyMap(initialMap);
  }, [profiles]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error("Không thể tải danh sách profiles", e);
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

  const handleUpdateProfileProxy = async (profileId: number, proxyId: number) => {
    const dbProxyId = proxyId === -1 ? null : proxyId;
    try {
      await fetch(`${BASE_URL}/chrome-profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxyId: dbProxyId
        })
      });
      fetchProfiles();
    } catch (e) {
      console.error("Lỗi khi cập nhật proxy cho profile", e);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProfileName,
          userAgent: newUA || null,
          proxyId: newProxy ? parseInt(newProxy) : null
        })
      });
      if (res.ok) {
        const newProf = await res.json();
        setProfiles([newProf, ...profiles]);
        setSelectedProfileIds([...selectedProfileIds, newProf.id]);
        
        setNewProfileName('');
        setNewUA('');
        setNewProxy('');
        setShowAddForm(false);
        setErrorMsg('');
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Tạo profile thất bại");
      }
    } catch (e) {
      setErrorMsg("Lỗi kết nối khi tạo profile");
    }
  };

  const handleDeleteProfile = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa profile này khỏi cơ sở dữ liệu?")) return;

    try {
      const res = await fetch(`${BASE_URL}/chrome-profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProfiles(profiles.filter(p => p.id !== id));
        setSelectedProfileIds(selectedProfileIds.filter(pid => pid !== id));
      }
    } catch (e) {
      console.error("Xóa profile thất bại", e);
    }
  };

  const handleToggleProfile = (id: number) => {
    if (selectedProfileIds.includes(id)) {
      setSelectedProfileIds(selectedProfileIds.filter(pid => pid !== id));
    } else {
      setSelectedProfileIds([...selectedProfileIds, id]);
    }
  };

  const handleSubmit = () => {
    onConfirm(threads, selectedProfileIds, profileProxyMap);
  };

  if (!isOpen) return null;

  return (
    <div className="run-modal-backdrop">
      <div className="run-modal-container">
        <div className="run-modal-header">
          <h3>
            <Settings className="spin-icon" size={20} />
            <span>Cấu hình Luồng & Chrome Profiles</span>
          </h3>
          <button className="run-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="run-modal-body">
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Số luồng chạy song song (Parallel Threads)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input
                type="number"
                min="1"
                max="10"
                className="form-control"
                style={{ width: '120px', fontSize: '1rem', padding: '10px' }}
                value={threads}
                onChange={(e) => setThreads(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                (Sẽ mở song song {threads} trình duyệt Chrome độc lập)
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Chọn Profiles sử dụng ({selectedProfileIds.length} đã chọn)
              </label>
              <button
                type="button"
                className="btn-text-action"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={14} />
                <span>{showAddForm ? 'Hủy tạo mới' : 'Thêm Profile mới'}</span>
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleCreateProfile} className="add-profile-form">
                <h4>Tạo Chrome Profile Mới</h4>
                {errorMsg && <div className="form-error-msg">{errorMsg}</div>}
                
                <div className="form-group">
                  <label>Tên Profile *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Account Facebook 1"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>User Agent (Tùy chọn)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Mozilla/5.0..."
                      value={newUA}
                      onChange={(e) => setNewUA(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Proxy liên kết (Tùy chọn)</label>
                    <CustomSelect
                      value={newProxy}
                      onChange={(val) => setNewProxy(val)}
                      options={[
                        { value: '', label: '-- Không dùng Proxy --' },
                        ...proxies.map(pr => ({
                          value: String(pr.id),
                          label: `[${pr.type || 'HTTP'}] ${pr.host}:${pr.port} (${pr.country || '?'})`
                        }))
                      ]}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-sm" style={{ marginTop: '10px' }}>
                  <span>Xác nhận thêm Profile</span>
                </button>
              </form>
            )}

            <div className="profiles-list-container">
              {profiles.length === 0 ? (
                <div className="profiles-empty-state">
                  Chưa có profile nào. Các luồng chạy sẽ tự tạo profile mới với thư mục ngẫu nhiên và lưu lại cho lần sau.
                </div>
              ) : (
                <div className="profiles-grid">
                  {profiles.map((prof) => {
                    const isChecked = selectedProfileIds.includes(prof.id);
                    return (
                      <div
                        key={prof.id}
                        className={`profile-card-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleToggleProfile(prof.id)}
                        style={{ height: 'auto', minHeight: '120px', padding: '12px' }}
                      >
                        <div className="profile-card-checkbox">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ pointerEvents: 'none' }}
                          />
                        </div>
                        <div className="profile-card-details" style={{ flex: 1 }}>
                          <div className="profile-card-name" style={{ fontWeight: 700 }}>{prof.name}</div>
                          <div className="profile-card-folder" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prof.folderName}</div>
                          
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Proxy sử dụng:</label>
                            <CustomSelect
                              value={profileProxyMap[prof.id] !== undefined ? profileProxyMap[prof.id] : (prof.proxyId || -1)}
                              onChange={(val) => {
                                const numVal = parseInt(val);
                                setProfileProxyMap({
                                  ...profileProxyMap,
                                  [prof.id]: numVal
                                });
                                handleUpdateProfileProxy(prof.id, numVal);
                              }}
                              options={[
                                { value: -1, label: '-- Không dùng Proxy --' },
                                ...proxies.map(pr => ({
                                  value: pr.id,
                                  label: `[${pr.type || 'HTTP'}] ${pr.host}:${pr.port} (${pr.country || '?'})`
                                }))
                              ]}
                            />
                          </div>
                          
                          <div className="profile-card-tags" style={{ marginTop: '8px' }}>
                            {prof.userAgent && (
                              <span className="profile-badge badge-ua" title={prof.userAgent}>
                                <Shield size={10} /> UA
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-card-delete-btn"
                          onClick={(e) => handleDeleteProfile(prof.id, e)}
                          title="Xóa Profile khỏi DB"
                          style={{ alignSelf: 'flex-start' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {threads > selectedProfileIds.length && (
            <div className="profiles-notice-warning">
              💡 Bạn đang cấu hình <strong>{threads} luồng</strong> nhưng chỉ chọn <strong>{selectedProfileIds.length} profile</strong>. 
              Các luồng dư thừa sẽ <strong>tự động sinh ra các Profile mới</strong> và tự lưu lại vào database.
              Chúng sẽ được <strong>gán ngẫu nhiên một Proxy</strong> từ danh sách proxy sẵn có.
            </div>
          )}
        </div>

        <div className="run-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button className="btn-primary" onClick={handleSubmit} style={{ backgroundColor: 'var(--color-success)', width: 'auto', padding: '10px 24px' }}>
            <Play size={16} />
            <span>Kích hoạt chạy thử ({threads} Luồng)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunModal;
