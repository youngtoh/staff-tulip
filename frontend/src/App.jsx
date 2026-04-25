import React, { useState, useEffect } from "react";
import LoginPage from "./pages/Login";
import AdminPage from "./pages/Admin";
import StaffPage from "./pages/Staff";
import UserPage from "./pages/User";

// Simple shared UI pieces
const Shell = ({ role, activeMenu, onMenu, onLogout, onOpenSettings, children }) => {
  const adminMenus = [
    { key: "users", label: "User Management", icon: "👤" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];
  const staffMenus = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "rooms", label: "Room Management", icon: "🚪" },
    { key: "lease", label: "Lease & Agreement", icon: "📋" },
    { key: "meter", label: "Meter Recording", icon: "📊" },
    { key: "maintenance", label: "Maintenance", icon: "🔧" },
    { key: "billing", label: "Payment & Bills", icon: "💳" },
    { key: "reports", label: "Reports", icon: "📁" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];
  const residentMenus = [
    { key: "res_home", label: "Home", icon: "🏠" },
    { key: "res_maintenance", label: "Maintenance", icon: "🔧" },
    { key: "res_billing", label: "Payment & Bills", icon: "💳" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  const menus = role === "admin" ? adminMenus : role === "resident" ? residentMenus : staffMenus;
  const roleLabel = role === "admin" ? "Dashboard Admin" : role === "resident" ? "Resident" : "Tulip Mansion Staff";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Sarabun','Noto Sans Thai',sans-serif", background: "#f3f4f6" }}>
      <div style={{ width: 220, background: "#1e3a5f", color: "#fff", display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>ManageApp</div>
              <div style={{ fontSize: 11, color: "#93c5fd" }}>{roleLabel}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 0" }}>
          {menus.map(m => (
            <button key={m.key} onClick={() => onMenu(m.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 20px", background: activeMenu === m.key ? "rgba(37,99,235,0.35)" : "transparent", border: "none", color: activeMenu === m.key ? "#fff" : "#bfdbfe", fontSize: 13, cursor: "pointer", textAlign: "left", borderLeft: activeMenu === m.key ? "3px solid #60a5fa" : "3px solid transparent" }}>
              <span style={{ fontSize: 15 }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 16px 16px", padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13, cursor: "pointer" }}>
          🚪 LOG OUT
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(90deg, #1e40af 0%, #2563eb 100%)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
            HELLO, {role === "admin" ? "ADMIN" : role === "resident" ? "RESIDENT" : "STAFF"}
          </span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input placeholder="Type to search..." style={{ padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 13, width: 220, background: "rgba(255,255,255,0.15)", color: "#fff", outline: "none" }} />
            <button style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>🔔</button>
            <button onClick={() => (onOpenSettings ? onOpenSettings() : onMenu('settings'))} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>⚙️</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "20px 24px", ...style }}>{children}</div>
);

const Btn = ({ children, onClick, color = "#2563eb", outline = false, style = {} }) => (
  <button onClick={onClick} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${color}`, background: outline ? "#fff" : color, color: outline ? color : "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", ...style }}>{children}</button>
);

function Settings({ currentUser, onReload, setCurrentUser }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState(currentUser?.room || '');
  const [status, setStatus] = useState(currentUser?.status || 'Active');
  const [type, setType] = useState(currentUser?.type || 'Resident');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    if (!currentUser) return setMsg('No user');
    setLoading(true); setMsg(null);
    try {
      const payload = { name, username, room, status, type };
      if (password && password.length > 0) payload.password = password;
      const res = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setMsg(e.error || 'Update failed');
        setLoading(false);
        return;
      }
      const result = await res.json();
      setMsg('Profile updated');
      if (result.user) setCurrentUser(result.user);
      if (onReload) onReload();
    } catch (err) {
      setMsg('Could not contact server');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
        <label style={{ fontSize: 13, color: '#374151' }}>Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
        <label style={{ fontSize: 13, color: '#374151' }}>Password (leave blank to keep)</label>
        <input value={password} type="password" onChange={e => setPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
        <label style={{ fontSize: 13, color: '#374151' }}>Room</label>
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
        </div>
        {msg && <div style={{ color: '#374151' }}>{msg}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null);
  const [menu, setMenu] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [leases, setLeases] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [bills, setBills] = useState([]);
  const [master, setMaster] = useState([]);

  useEffect(() => {
    async function initAndLoad() {
      try {
        await fetch("http://localhost:3000/init-db");
      } catch (err) {
        console.warn("Could not contact DB init server (http://localhost:3000). Start backend with `npm run dev` in the backend folder to enable DB creation.", err);
      }

      try {
        const res = await fetch("http://localhost:3000/api/master");
        if (res.ok) {
          const payload = await res.json();
          setUsers(payload.users || []);
          setRooms(payload.rooms || []);
          setLeases(payload.leases || []);
          setMaintenance(payload.maintenance || []);
          setBills(payload.bills || []);
          setMaster(payload.master || []);
          setDbLoaded(true);
          console.log("Loaded data from /api/master");
        } else {
          console.warn("/api/master responded", res.status);
        }
      } catch (err) {
        console.warn("Failed to load /api/master", err);
      }
    }
    initAndLoad();
    // expose load function for manual refresh after settings update
    window.__tulip_reload_master = initAndLoad;
  }, []);

  const handleLogin = (user) => {
    if (!user) return;
    const r = (user.type || '').toLowerCase();
    setCurrentUser(user);
    setRole(r);
    setMenu(r === "admin" ? "users" : r === "resident" ? "res_home" : "home");
  };
  const handleLogout = () => { setRole(null); setMenu(null); };

  if (!role) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    switch (menu) {
      case "users": return <AdminPage users={users} rooms={rooms} leases={leases} maintenance={maintenance} bills={bills} />;
      case "settings": return (
        <Card>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Settings</div>
          <Settings currentUser={currentUser} onReload={() => { if (window.__tulip_reload_master) window.__tulip_reload_master().then(() => { /* reload done */ }); }} setCurrentUser={setCurrentUser} />
        </Card>
      );
      case "home": return <StaffPage master={master} />;
      case "rooms": return <AdminPage users={users} rooms={rooms} leases={leases} maintenance={maintenance} bills={bills} />;
      case "lease": return <AdminPage users={users} rooms={rooms} leases={leases} maintenance={maintenance} bills={bills} />;
      case "meter": return <StaffPage master={master} />;
      case "maintenance": return <AdminPage users={users} rooms={rooms} leases={leases} maintenance={maintenance} bills={bills} />;
      case "billing": return <AdminPage users={users} rooms={rooms} leases={leases} maintenance={maintenance} bills={bills} />;
      case "reports": return <StaffPage master={master} />;
      case "res_home": return <UserPage user={currentUser} leases={leases.filter(l => l.tenant === (currentUser?.name))} bills={bills.filter(b => b.room === (currentUser?.room))} maintenance={maintenance.filter(m => m.room === (currentUser?.room))} />;
      case "res_billing": return <UserPage user={currentUser} leases={leases.filter(l => l.tenant === (currentUser?.name))} bills={bills.filter(b => b.room === (currentUser?.room))} maintenance={maintenance.filter(m => m.room === (currentUser?.room))} />;
      case "res_maintenance": return <UserPage user={currentUser} leases={leases.filter(l => l.tenant === (currentUser?.name))} bills={bills.filter(b => b.room === (currentUser?.room))} maintenance={maintenance.filter(m => m.room === (currentUser?.room))} />;
      default: return <Card><div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>⚙️ Settings</div><div style={{ color: "#6b7280", fontSize: 14 }}>หน้านี้อยู่ระหว่างพัฒนา</div></Card>;
    }
  };

  return (
    <>
      <Shell role={role} activeMenu={menu} onMenu={setMenu} onLogout={handleLogout} onOpenSettings={() => setShowSettings(true)}>
        {renderContent()}
      </Shell>

      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowSettings(false)}>
          <div style={{ width: 'min(780px, 96%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✖️</button>
            </div>
            <Settings currentUser={currentUser} onReload={() => { if (window.__tulip_reload_master) window.__tulip_reload_master(); setShowSettings(false); }} setCurrentUser={setCurrentUser} />
          </div>
        </div>
      )}
    </>
  );
}
