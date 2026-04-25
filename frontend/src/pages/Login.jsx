import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error || 'Login failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      onLogin(data.user);
    } catch (err) {
      setError('Could not contact server');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sarabun','Noto Sans Thai',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏢</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: '#1e3a5f' }}>Tulip Mansion</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>ระบบจัดการหอพัก</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="กรอก username" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="กรอก password" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }} />
        </div>

        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '11px', background: 'linear-gradient(90deg, #1e40af, #2563eb)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
        </button>

        {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</div>}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9ca3af' }}>Demo: ใช้ username/password จากตัวอย่างใน DB</div>
      </div>
    </div>
  );
}
