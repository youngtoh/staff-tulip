import React, { useEffect, useState } from 'react';

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '20px 24px', ...style }}>{children}</div>
);

const Btn = ({ children, onClick, color = '#2563eb', outline = false, style = {} }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${color}`, background: outline ? '#fff' : color, color: outline ? color : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', ...style }}>{children}</button>
);

const Badge = ({ text }) => {
  const map = {
    Active: ['#dcfce7', '#16a34a'], Inactive: ['#fee2e2', '#dc2626'],
    Occupied: ['#dbeafe', '#1d4ed8'], Vacant: ['#f0fdf4', '#15803d'],
    Maintenance: ['#fef3c7', '#b45309'], Pending: ['#fef3c7', '#b45309'],
    Done: ['#dcfce7', '#15803d'], Expiring: ['#fee2e2', '#dc2626'],
    Paid: ['#dcfce7', '#15803d'], Monthly: ['#ede9fe', '#6d28d9'],
  };
  const [bg, color] = map[text] || ['#f3f4f6', '#374151'];
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{text}</span>;
};

export default function UserPage({ user = null, leases = [], bills = [], maintenance = [] }) {
  const [localLeases, setLocalLeases] = useState(leases || []);
  const [localBills, setLocalBills] = useState(bills || []);
  const [localMaint, setLocalMaint] = useState(maintenance || []);

  useEffect(() => {
    // if props empty, try to load from API
    (async () => {
      if ((localLeases.length === 0 || localBills.length === 0 || localMaint.length === 0) && user) {
        try {
          const res = await fetch('http://localhost:3000/api/master');
          if (!res.ok) return;
          const p = await res.json();
          setLocalLeases(p.leases ? p.leases.filter(l => l.tenant === (user.name || '')) : []);
          setLocalBills(p.bills ? p.bills.filter(b => b.room === (user.room || '')) : []);
          setLocalMaint(p.maintenance ? p.maintenance.filter(m => m.room === (user.room || '')) : []);
        } catch (e) {
          // ignore
        }
      }
    })();
  }, [user]);

  if (!user) return <div><h2 style={{ color: '#1e3a5f' }}>Resident</h2><div style={{ color: '#9ca3af' }}>No user selected</div></div>;

  return (
    <div>
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f 60%, #2563eb 100%)', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Resident: {user.name}</div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 6 }}>ห้อง {user.room} · สถานะ {user.status}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>ยอดค้างชำระ</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{localBills.reduce((s, b) => s + (b.amount || 0), 0)} ฿</div>
            </div>
            <Btn>💳 ชำระเงิน</Btn>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e3a5f', marginBottom: 12 }}>📢 ประชาสัมพันธ์</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
            🔔 กำหนดชำระค่าเช่าภายในวันที่ 15 ของทุกเดือน<br />🔧 ปิดซ่อมบำรุงลิฟต์วันที่ 20/04/2569<br />🌿 กรุณาทิ้งขยะที่จุดพักขยะชั้น 1 เท่านั้น
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <Card>
          <h4 style={{ marginTop: 0 }}>Leases</h4>
          {localLeases.length === 0 && <div style={{ color: '#9ca3af' }}>No leases</div>}
          {localLeases.map(l => <div key={l.id || l.room} style={{ color: '#6b7280' }}>{l.room} • {l.status}</div>)}
        </Card>

        <Card>
          <h4 style={{ marginTop: 0 }}>Bills</h4>
          {localBills.length === 0 && <div style={{ color: '#9ca3af' }}>No bills</div>}
          {localBills.map(b => (
            <div key={b.id} style={{ color: '#6b7280', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>{b.id} • {b.date}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div>฿{b.amount}</div><Badge text={b.status} /></div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card>
          <h4 style={{ marginTop: 0 }}>Maintenance</h4>
          {localMaint.length === 0 && <div style={{ color: '#9ca3af' }}>No maintenance records</div>}
          {localMaint.map(m => <div key={m.id} style={{ color: '#6b7280' }}>{m.id} • {m.detail} • <strong>{m.status}</strong></div>)}
        </Card>
      </div>
    </div>
  );
}
