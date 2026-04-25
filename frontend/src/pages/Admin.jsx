import React, { useState } from 'react';

const SimpleList = ({ title, items, renderItem }) => (
  <div style={{ marginBottom: 18 }}>
    <h3 style={{ margin: '6px 0 10px', color: '#1e3a5f' }}>{title}</h3>
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((it, i) => <div key={i} style={{ padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #eef2ff' }}>{renderItem(it)}</div>)}
      {items.length === 0 && <div style={{ color: '#9ca3af' }}>No items</div>}
    </div>
  </div>
);

export default function AdminPage({ users = [], rooms = [], leases = [], maintenance = [], bills = [] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState(null);

  const validatePassword = (pw) => {
    if (!pw || pw.length === 0) return 'รหัสผ่านต้องไม่ว่าง';
    if (!/^[A-Z]/.test(pw)) return 'รหัสผ่านต้องขึ้นต้นด้วยตัวพิมพ์ใหญ่ 1 ตัว';
    if ((pw.match(/\./g) || []).length < 1) return 'รหัสผ่านต้องมีจุด (.) อย่างน้อย 1 ตัว';
    if ((pw.match(/\d/g) || []).length < 3) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 3 ตัว';
    return null;
  };

  const AddUserForm = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [room, setRoom] = useState('');
    const [status, setStatus] = useState('Active');
    const [type, setType] = useState('Resident');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
      setMsg(null);
      const newU = (username || '').trim().toLowerCase();
      if (newU && users.some(u => ((u.username || '').toLowerCase() === newU))) {
        setMsg('มีชื่อนี้อยู่แล้ว ใช้ username อื่น');
        return;
      }
      const pwErr = validatePassword(password);
      if (pwErr) {
        setMsg(pwErr);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('http://localhost:3000/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username, password, room, status, type })
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          setMsg(e.error || 'Could not create user');
          setLoading(false);
          return;
        }
        const data = await res.json();
        try { await (window.__tulip_reload_master ? window.__tulip_reload_master() : Promise.resolve()); } catch (e) { /* ignore */ }
        setMsg('User created');
        setShowAdd(false);
      } catch (err) {
        setMsg('Could not contact server');
      } finally { setLoading(false); }
    };

    return (
      <div style={{ marginBottom: 12, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #eef2ff' }}>
        <h3 style={{ margin: '6px 0 10px', color: '#1e3a5f' }}>Add New User</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <input placeholder="Room No" value={room} onChange={e => setRoom(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
              <option>Resident</option>
              <option>Staff</option>
              <option>Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submit} disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Cancel</button>
          </div>
          {msg && <div style={{ color: '#dc2626' }}>{msg}</div>}
        </div>
      </div>
    );
  };

  const UserManagement = ({ initialUsers = [] }) => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 20;
    const [editing, setEditing] = useState(null);

    const filtered = initialUsers.filter(u => {
      if (!u) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

    const EditUserForm = ({ user }) => {
      const [name, setName] = useState(user.name || '');
      const [username, setUsername] = useState(user.username || '');
      const [password, setPassword] = useState('');
      const [room, setRoom] = useState(user.room || '');
      const [status, setStatus] = useState(user.status || 'Active');
      const [type, setType] = useState(user.type || 'Resident');
      const [loading, setLoading] = useState(false);
      const [msg, setMsg] = useState(null);

      const submit = async () => {
        setMsg(null);
        // check for username collision with other users
        const newU = (username || '').trim().toLowerCase();
        if (newU && initialUsers.some(u => ((u.username || '').toLowerCase() === newU) && u.id !== user.id)) {
          setMsg('มีชื่อนี้อยู่แล้ว ใช้ username อื่น');
          return;
        }
        setLoading(true);
        try {
          if (password && password.length > 0) {
            const pwErr = validatePassword(password);
            if (pwErr) { setMsg(pwErr); setLoading(false); return; }
          }
          const payload = { name, username, room, status, type };
          if (password && password.length > 0) payload.password = password;
          const res = await fetch(`http://localhost:3000/api/users/${user.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            setMsg(e.error || 'Update failed');
            setLoading(false);
            return;
          }
          try { await (window.__tulip_reload_master ? window.__tulip_reload_master() : Promise.resolve()); } catch (e) { /* ignore */ }
          setMsg('Updated');
          setEditing(null);
        } catch (err) {
          setMsg('Could not contact server');
        } finally { setLoading(false); }
      };

      return (
        <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #eef2ff' }}>
          <h4 style={{ margin: '6px 0 10px', color: '#1e3a5f' }}>Edit User</h4>
          <div style={{ display: 'grid', gap: 8 }}>
            <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <input value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <input placeholder="(leave blank to keep)" value={password} type="password" onChange={e => setPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <input value={room} onChange={e => setRoom(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <option>Resident</option>
                <option>Staff</option>
                <option>Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submit} disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
              <button onClick={() => setEditing(null)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Cancel</button>
            </div>
            {msg && <div style={{ color: '#dc2626' }}>{msg}</div>}
          </div>
        </div>
      );
    };

    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: '#1e3a5f' }}>User Management</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search name or username" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <div style={{ color: '#6b7280', fontSize: 13 }}>{filtered.length} users</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #eef2ff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eef2ff' }}>
                <th style={{ padding: 10 }}>Name</th>
                <th style={{ padding: 10 }}>Username</th>
                <th style={{ padding: 10 }}>Room</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Type</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10 }}>{u.name}</td>
                  <td style={{ padding: 10 }}>{u.username}</td>
                  <td style={{ padding: 10 }}>{u.room}</td>
                  <td style={{ padding: 10 }}>{u.status}</td>
                  <td style={{ padding: 10 }}>{u.type}</td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => setEditing(u)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 10px', marginRight: 8 }}>Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '6px 10px' }}>Next</button>
          </div>
          <div style={{ color: '#6b7280' }}>Page {page} / {totalPages}</div>
        </div>

        {editing && <EditUserForm user={editing} />}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#1e3a5f' }}>Admin Dashboard</h2>
        <div>
          <button onClick={() => setShowAdd(s => !s)} style={{ padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{showAdd ? 'Close' : 'Add User'}</button>
        </div>
      </div>
      {showAdd && <AddUserForm />}
      <div style={{ marginTop: 12 }}>
        <UserManagement initialUsers={users} />
      </div>
    </div>
  );
}
