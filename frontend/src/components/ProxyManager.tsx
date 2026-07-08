import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Globe, Trash2, CheckCircle2, XCircle, AlertCircle, 
  RefreshCw, Plus, Upload, Search, Filter, UserCheck, Pencil
} from 'lucide-react';
import CustomDialog from './CustomDialog';
import UnifiedTable, { type Column } from './UnifiedTable';
import CustomSelect from './CustomSelect';

const BASE_URL = 'http://localhost:3000/api';

const ProxyManager: React.FC = () => {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [colFilters] = useState<any>({
    display_string: '',
    type: 'all',
    host: '',
    port: '',
    country: '',
    status: 'all'
  });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [assigningProxy, setAssigningProxy] = useState<any>(null);
  const [selectedProfilesForProxy, setSelectedProfilesForProxy] = useState<number[]>([]);
  
  // Dialog visibility states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<any>(null);

  // Edit Proxy Form State
  const [editType, setEditType] = useState('HTTP');
  const [editHost, setEditHost] = useState('');
  const [editPort, setEditPort] = useState(8080);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCountry, setEditCountry] = useState('');

  // Delete Dialog States
  const [deletingProxy, setDeletingProxy] = useState<any>(null);
  const [isDeleteManyOpen, setIsDeleteManyOpen] = useState(false);

  // Single Proxy Form
  const [proxyType, setProxyType] = useState('HTTP');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(8080);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Vietnam');
  
  // Bulk Import Form
  const [bulkText, setBulkText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedProxyIds, setSelectedProxyIds] = useState<number[]>([]);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProxies();
    fetchProfiles();

    const socket = io('http://localhost:3000');

    socket.on('proxy_checked', (data: any) => {
      setProxies((prev) => 
        prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))
      );
    });

    socket.on('proxy_check_all_finished', (data: any) => {
      setCheckingAll(false);
      alert(data.message || "Đã hoàn tất kiểm tra toàn bộ proxy!");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/proxies`);
      if (res.ok) {
        const data = await res.json();
        setProxies(data);
      }
    } catch (e) {
      console.error("Không thể tải danh sách proxies", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (proxy: any) => {
    setAssigningProxy(proxy);
    const linked = profiles.filter(p => p.proxyId === proxy.id).map(p => p.id);
    setSelectedProfilesForProxy(linked);
  };

  const handleSaveProxyProfiles = async () => {
    if (!assigningProxy) return;

    try {
      const promises = profiles.map(async (prof) => {
        const wasLinked = prof.proxyId === assigningProxy.id;
        const isLinkedNow = selectedProfilesForProxy.includes(prof.id);

        if (isLinkedNow && !wasLinked) {
          await fetch(`${BASE_URL}/chrome-profiles/${prof.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proxyId: assigningProxy.id })
          });
        } else if (!isLinkedNow && wasLinked) {
          await fetch(`${BASE_URL}/chrome-profiles/${prof.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proxyId: null })
          });
        }
      });

      await Promise.all(promises);
      setAssigningProxy(null);
      fetchProfiles();
      fetchProxies();
    } catch (e) {
      console.error("Lỗi khi gán profiles cho proxy", e);
    }
  };

  const handleOpenAdd = () => {
    setHost('');
    setPort(8080);
    setUsername('');
    setPassword('');
    setProxyType('HTTP');
    setCountry('Vietnam');
    setIsAddOpen(true);
  };

  const handleOpenImport = () => {
    setBulkText('');
    setImportResult(null);
    setIsImportOpen(true);
  };

  const handleOpenEditModal = (proxy: any) => {
    setEditingProxy(proxy);
    setEditType(proxy.type || 'HTTP');
    setEditHost(proxy.host || '');
    setEditPort(proxy.port || 8080);
    setEditUsername(proxy.username || '');
    setEditPassword(proxy.password || '');
    setEditCountry(proxy.country || '');
  };

  const handleUpdateProxySubmit = async () => {
    if (!editingProxy || !editHost || !editPort) return;

    try {
      const res = await fetch(`${BASE_URL}/proxies/${editingProxy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editType,
          host: editHost,
          port: parseInt(editPort.toString(), 10),
          username: editUsername || null,
          password: editPassword || null,
          country: editCountry || 'Unknown'
        })
      });

      if (res.ok) {
        const updatedProxy = await res.json();
        setProxies((prev) => 
          prev.map((p) => (p.id === updatedProxy.id ? updatedProxy : p))
        );
        setEditingProxy(null);
        fetchProfiles();
      } else {
        const err = await res.json();
        alert(err.error || "Cập nhật proxy thất bại");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối khi cập nhật proxy");
    }
  };

  const handleCreateProxy = async () => {
    if (!host || !port) return;

    try {
      const res = await fetch(`${BASE_URL}/proxies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: parseInt(port.toString(), 10),
          username: username || null,
          password: password || null,
          type: proxyType,
          country
        })
      });

      if (res.ok) {
        const newProxy = await res.json();
        setProxies([newProxy, ...proxies]);
        setIsAddOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Tạo proxy thất bại");
      }
    } catch (e) {
      alert("Lỗi kết nối khi tạo proxy");
    }
  };

  const handleImportProxies = async () => {
    if (!bulkText.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/proxies/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: bulkText })
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        fetchProxies();
        setTimeout(() => {
          setIsImportOpen(false);
          setImportResult(null);
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || "Nhập proxy thất bại");
      }
    } catch (e) {
      alert("Lỗi kết nối khi nhập proxy");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkText(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleDeleteProxySubmit = async () => {
    if (!deletingProxy) return;

    try {
      const res = await fetch(`${BASE_URL}/proxies/${deletingProxy.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProxies(proxies.filter(p => p.id !== deletingProxy.id));
        setSelectedProxyIds(selectedProxyIds.filter(x => x !== deletingProxy.id));
        setDeletingProxy(null);
      }
    } catch (e) {
      console.error("Xóa proxy thất bại", e);
    }
  };

  const handleSelectProxy = (id: number) => {
    if (selectedProxyIds.includes(id)) {
      setSelectedProxyIds(selectedProxyIds.filter(x => x !== id));
    } else {
      setSelectedProxyIds([...selectedProxyIds, id]);
    }
  };

  const handleSelectAll = () => {
    const filteredIds = filteredProxies.map(p => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProxyIds.includes(id));
    if (allSelected) {
      setSelectedProxyIds(selectedProxyIds.filter(id => !filteredIds.includes(id)));
    } else {
      const uniqueIds = Array.from(new Set([...selectedProxyIds, ...filteredIds]));
      setSelectedProxyIds(uniqueIds);
    }
  };

  const handleDeleteMultipleSubmit = async () => {
    if (selectedProxyIds.length === 0) return;

    try {
      const res = await fetch(`${BASE_URL}/proxies`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProxyIds })
      });
      if (res.ok) {
        setProxies(proxies.filter(p => !selectedProxyIds.includes(p.id)));
        setSelectedProxyIds([]);
        setIsDeleteManyOpen(false);
      } else {
        alert("Xóa hàng loạt proxy thất bại!");
      }
    } catch (e) {
      console.error("Lỗi khi xóa hàng loạt proxy", e);
      alert("Lỗi kết nối khi xóa hàng loạt proxy");
    }
  };

  const handleCheckProxy = async (id: number) => {
    setProxies((prev) => 
      prev.map((p) => (p.id === id ? { ...p, status: 'checking' } : p))
    );

    try {
      await fetch(`${BASE_URL}/proxies/check/${id}`, {
        method: 'POST'
      });
    } catch (e) {
      alert("Không thể gửi yêu cầu kiểm tra proxy");
      fetchProxies();
    }
  };

  const handleCheckAll = async () => {
    if (proxies.length === 0) return;
    setCheckingAll(true);
    setProxies((prev) => prev.map((p) => ({ ...p, status: 'checking' })));

    try {
      const res = await fetch(`${BASE_URL}/proxies/check-all`, {
        method: 'POST'
      });
      if (!res.ok) {
        setCheckingAll(false);
        fetchProxies();
      }
    } catch (e) {
      setCheckingAll(false);
      fetchProxies();
    }
  };

  // Stats computation
  const totalCount = proxies.length;
  const aliveCount = proxies.filter(p => p.status === 'alive').length;
  const deadCount = proxies.filter(p => p.status === 'dead').length;
  const unknownCount = proxies.filter(p => p.status === 'unknown' || p.status === 'checking').length;

  // Filter & Search
  const filteredProxies = proxies.filter((p) => {
    const displayStr = p.displayString || `${p.host}:${p.port}`;
    const matchesSearch = searchQuery === '' || 
                          displayStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.country || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    
    if (colFilters.display_string && !displayStr.toLowerCase().includes(colFilters.display_string.toLowerCase())) return false;
    if (colFilters.type !== 'all' && (p.type || 'HTTP').toUpperCase() !== colFilters.type.toUpperCase()) return false;
    if (colFilters.host && !p.host.toLowerCase().includes(colFilters.host.toLowerCase())) return false;
    if (colFilters.port && !String(p.port).includes(colFilters.port)) return false;
    if (colFilters.country && !(p.country || '').toLowerCase().includes(colFilters.country.toLowerCase())) return false;
    
    if (colFilters.status !== 'all') {
      if (colFilters.status === 'unknown') {
        if (p.status !== 'unknown' && p.status !== 'checking' && p.status !== null) return false;
      } else if (p.status !== colFilters.status) {
        return false;
      }
    }
    
    return true;
  });

  const columns: Column[] = [
    { 
      key: 'select', 
      label: (
        <input 
          type="checkbox" 
          checked={filteredProxies.length > 0 && filteredProxies.every(p => selectedProxyIds.includes(p.id))}
          onChange={handleSelectAll}
          style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
        />
      ), 
      initialWidth: 50, 
      minWidth: 40 
    },
    { key: 'host', label: 'Host (IP Address)', initialWidth: 180, minWidth: 100 },
    { key: 'port', label: 'Cổng', initialWidth: 80, minWidth: 50 },
    { key: 'type', label: 'Loại', initialWidth: 90, minWidth: 60 },
    { key: 'credentials', label: 'Tài khoản / Mật khẩu', initialWidth: 160, minWidth: 100 },
    { key: 'country', label: 'Quốc Gia', initialWidth: 110, minWidth: 60 },
    { key: 'ping', label: 'Ping (ms)', initialWidth: 80, minWidth: 50 },
    { key: 'status', label: 'Trạng Thái', initialWidth: 120, minWidth: 80 },
    { key: 'actions', label: 'Thao tác', initialWidth: 160, minWidth: 120 }
  ];

  const renderRow = (p: any, _idx: number, _widths: number[]) => {
    const isChecked = selectedProxyIds.includes(p.id);
    return (
      <tr key={p.id} className={isChecked ? 'row-selected' : ''}>
        <td>
          <input 
            type="checkbox" 
            checked={isChecked}
            onChange={() => handleSelectProxy(p.id)}
            style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
          />
        </td>
        <td className="bold-cell" style={{ fontWeight: 700 }}>{p.host}</td>
        <td>{p.port}</td>
        <td>
          <span className="tag-type" style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
            {p.type}
          </span>
        </td>
        <td>
          {p.username ? (
            <code style={{ fontSize: '0.8rem' }}>{p.username}:{p.password ? '******' : ''}</code>
          ) : (
            <span className="muted" style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trống</span>
          )}
        </td>
        <td>{p.country || 'Unknown'}</td>
        <td>{p.pingSpeed ? `${p.pingSpeed}ms` : '-'}</td>
        <td>
          <span className={`flat-badge ${p.status === 'alive' ? 'success' : (p.status === 'dead' ? 'danger' : 'unknown')}`} style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            backgroundColor: p.status === 'alive' ? '#dcfce7' : (p.status === 'dead' ? '#fee2e2' : '#f1f5f9'),
            color: p.status === 'alive' ? 'var(--color-success)' : (p.status === 'dead' ? 'var(--color-error)' : 'var(--text-secondary)')
          }}>
            {p.status === 'checking' ? 'Testing...' : p.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-action" 
              title="Gán cho profiles" 
              onClick={() => handleOpenAssignModal(p)}
              style={{ color: 'var(--color-accent-hover)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <UserCheck size={16} />
            </button>
            <button 
              className="btn-action" 
              title="Kiểm tra ping" 
              onClick={() => handleCheckProxy(p.id)}
              style={{ color: 'var(--color-success)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCw size={16} className={p.status === 'checking' ? 'spin-icon' : ''} />
            </button>
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
              title="Xóa proxy" 
              onClick={() => setDeletingProxy(p)}
              style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={24} style={{ color: 'var(--color-accent)' }} />
            <span>Danh sách Proxies liên kết</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Quản lý địa chỉ mạng IP, phân loại giao thức, kiểm tra ping speed và liên kết tài khoản profiles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleCheckAll}
            disabled={checkingAll || loading}
            style={{ width: 'auto', padding: '10px 16px', backgroundColor: checkingAll ? 'var(--text-secondary)' : 'var(--color-accent)' }}
          >
            <RefreshCw size={14} className={checkingAll ? 'spin-icon' : ''} />
            <span>{checkingAll ? 'Đang kiểm tra...' : 'Kiểm tra toàn bộ'}</span>
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAdd}
            style={{ width: 'auto', padding: '10px 16px' }}
          >
            <Plus size={14} />
            <span>Thêm thủ công</span>
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenImport}
            style={{ width: 'auto', padding: '10px 16px', backgroundColor: 'var(--color-success)' }}
          >
            <Upload size={14} />
            <span>Nhập số lượng lớn</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', color: '#d97706' }}>
            <Globe size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG PROXIES</div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '6px', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{aliveCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>HOẠT ĐỘNG (ALIVE)</div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '6px', color: '#dc2626' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-error)' }}>{deadCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LỖI KẾT NỐI (DEAD)</div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', color: '#64748b' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}>{unknownCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CHƯA KIỂM TRA</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="filter-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <Search size={16} style={{ color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Tìm nhanh host, quốc gia..." 
          className="form-control" 
          style={{ width: '250px', padding: '6px 12px', fontSize: '0.85rem' }} 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        
        <Filter size={16} style={{ color: 'var(--text-secondary)', marginLeft: '12px' }} />
        <CustomSelect
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'alive', label: 'Alive' },
            { value: 'dead', label: 'Dead' },
            { value: 'unknown', label: 'Chưa kiểm tra' },
          ]}
        />

        {selectedProxyIds.length > 0 && (
          <button 
            type="button" 
            className="btn-danger" 
            onClick={() => setIsDeleteManyOpen(true)} 
            style={{ width: 'auto', padding: '6px 14px', margin: 0, fontSize: '0.8rem' }}
          >
            <Trash2 size={12} />
            <span>Xóa {selectedProxyIds.length} mục đã chọn</span>
          </button>
        )}
      </div>

      {/* 4. Resizable scrollable Table */}
      <UnifiedTable
        columns={columns}
        data={filteredProxies}
        renderRow={renderRow}
        loading={loading}
        emptyText="Không tìm thấy proxy nào phù hợp với bộ lọc."
        maxHeight="calc(100vh - 280px)"
      />

      {/* 5. Add Proxy Dialog */}
      <CustomDialog
        isOpen={isAddOpen}
        title="Thêm Mới Proxy Thủ Công"
        type="form"
        onClose={() => setIsAddOpen(false)}
        onConfirm={handleCreateProxy}
        confirmText="Xác nhận tạo"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Loại Proxy *</label>
            <CustomSelect
              value={proxyType}
              onChange={(val) => setProxyType(val)}
              options={[
                { value: 'HTTP', label: 'HTTP' },
                { value: 'SOCKS5', label: 'SOCKS5' },
                { value: 'SOCKS4', label: 'SOCKS4' },
              ]}
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Host / IP *</label>
              <input type="text" className="form-control" placeholder="e.g. 192.168.1.100" value={host} onChange={(e) => setHost(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Cổng (Port) *</label>
              <input type="number" className="form-control" value={port} onChange={(e) => setPort(parseInt(e.target.value) || 8080)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Username (Tùy chọn)</label>
              <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password (Tùy chọn)</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Quốc Gia</label>
            <input type="text" className="form-control" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
      </CustomDialog>

      {/* 6. Import Proxies Dialog */}
      <CustomDialog
        isOpen={isImportOpen}
        title="Nhập Danh Sách Proxy Số Lượng Lớn"
        type="form"
        onClose={() => setIsImportOpen(false)}
        onConfirm={handleImportProxies}
        confirmText="Xác nhận Import"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {importResult && (
            <div style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-hover)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' }}>
              🎉 Nhập thành công! Đã tạo thêm: <strong>{importResult.createdCount || 0}</strong>, trùng lặp: <strong>{importResult.duplicateCount || 0}</strong>
            </div>
          )}
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Dán danh sách Proxy (Mỗi proxy trên một dòng)</span>
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={12} /> Tải file .txt lên
              </span>
            </label>
            <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            
            <textarea 
              className="form-control" 
              rows={6} 
              placeholder="Định dạng dòng hỗ trợ:&#10;192.168.1.1:8080&#10;192.168.1.2:8080:user:pass&#10;socks5://192.168.1.3:1080:user:pass"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </CustomDialog>

      {/* 7. Edit Proxy Dialog */}
      <CustomDialog
        isOpen={!!editingProxy}
        title="Chỉnh sửa thông tin Proxy"
        type="form"
        onClose={() => setEditingProxy(null)}
        onConfirm={handleUpdateProxySubmit}
        confirmText="Lưu thay đổi"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Giao thức</label>
            <CustomSelect
              value={editType}
              onChange={(val) => setEditType(val)}
              options={[
                { value: 'HTTP', label: 'HTTP' },
                { value: 'SOCKS5', label: 'SOCKS5' },
                { value: 'SOCKS4', label: 'SOCKS4' },
              ]}
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>IP / Host</label>
              <input type="text" className="form-control" value={editHost} onChange={(e) => setEditHost(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Port</label>
              <input type="number" className="form-control" value={editPort} onChange={(e) => setEditPort(parseInt(e.target.value) || 8080)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="text" className="form-control" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Quốc Gia</label>
            <input type="text" className="form-control" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
          </div>
        </div>
      </CustomDialog>

      {/* 8. Assign profiles Dialog */}
      <CustomDialog
        isOpen={!!assigningProxy}
        title={assigningProxy ? `Gán Proxy [${assigningProxy.host}:${assigningProxy.port}] cho Profiles` : 'Gán Proxy'}
        type="form"
        onClose={() => setAssigningProxy(null)}
        onConfirm={handleSaveProxyProfiles}
        confirmText="Xác nhận Lưu"
      >
        <div className="profiles-grid" style={{ maxHeight: '350px' }}>
          {profiles.length === 0 ? (
            <div className="profiles-empty-state">Chưa có profile nào dưới DB.</div>
          ) : (
            profiles.map(p => {
              const isLinked = selectedProfilesForProxy.includes(p.id);
              return (
                <div 
                  key={p.id} 
                  className={`profile-card-item ${isLinked ? 'selected' : ''}`}
                  onClick={() => {
                    if (isLinked) {
                      setSelectedProfilesForProxy(selectedProfilesForProxy.filter(x => x !== p.id));
                    } else {
                      setSelectedProfilesForProxy([...selectedProfilesForProxy, p.id]);
                    }
                  }}
                  style={{ padding: '8px 12px', minHeight: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input type="checkbox" checked={isLinked} onChange={() => {}} style={{ pointerEvents: 'none' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.folderName}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CustomDialog>

      {/* 9. Single Delete Proxy Confirmation Dialog */}
      {deletingProxy && (
        <CustomDialog
          isOpen={!!deletingProxy}
          title="Xác nhận xóa Proxy"
          type="danger"
          onClose={() => setDeletingProxy(null)}
          onConfirm={handleDeleteProxySubmit}
          confirmText="Xác nhận xóa"
          cancelText="Hủy bỏ"
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Bạn có chắc chắn muốn xóa Proxy <strong>{deletingProxy.host}:{deletingProxy.port}</strong> khỏi cơ sở dữ liệu?
            <div style={{ color: 'var(--color-error)', fontWeight: 650, marginTop: '8px', fontSize: '0.8rem' }}>
              ⚠️ Lưu ý: Hành động này sẽ gỡ bỏ liên kết của proxy này với tất cả Chrome Profiles đang sử dụng nó.
            </div>
          </div>
        </CustomDialog>
      )}

      {/* 10. Bulk Delete Proxy Confirmation Dialog */}
      <CustomDialog
        isOpen={isDeleteManyOpen}
        title="Xác nhận xóa nhiều Proxies"
        type="danger"
        onClose={() => setIsDeleteManyOpen(false)}
        onConfirm={handleDeleteMultipleSubmit}
        confirmText="Xác nhận xóa tất cả"
        cancelText="Hủy bỏ"
      >
        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          Bạn có chắc chắn muốn xóa <strong>{selectedProxyIds.length}</strong> proxies đang được lựa chọn?
          <div style={{ color: 'var(--color-error)', fontWeight: 650, marginTop: '8px', fontSize: '0.8rem' }}>
            ⚠️ Thao tác này sẽ gỡ bỏ liên kết proxy của chúng khỏi toàn bộ Chrome Profiles liên quan.
          </div>
        </div>
      </CustomDialog>
    </div>
  );
};

export default ProxyManager;
