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

const SimplePieChart = ({ data, colors }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;

  const segments = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: colors[i % colors.length], name: d.name, value: d.value };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size}>
        {segments.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />)}
      </svg>
      <div>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: colors[i % colors.length], display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#374151' }}>{d.name}: <strong>{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimpleLineChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0)), 10);
  const w = 400; const h = 160; const pad = { top: 10, bottom: 30, left: 30, right: 10 };
  const chartW = w - pad.left - pad.right; const chartH = h - pad.top - pad.bottom;
  const toX = (i) => pad.left + (i / (data.length - 1)) * chartW;
  const toY = (v) => pad.top + chartH - (v / maxVal) * chartH;
  const incomePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.income)}`).join(' ');
  const expensePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.expense)}`).join(' ');
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        {[0, Math.round(maxVal / 2), maxVal].map(v => (
          <g key={v}>
            <line x1={pad.left} y1={toY(v)} x2={w - pad.right} y2={toY(v)} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad.left - 4} y={toY(v) + 4} fontSize={10} fill="#9ca3af" textAnchor="end">{v}</text>
          </g>
        ))}
        {data.map((d, i) => (<text key={d.month} x={toX(i)} y={h - 8} fontSize={9} fill="#9ca3af" textAnchor="middle">{d.month}</text>))}
        <path d={incomePath} fill="none" stroke="#2563eb" strokeWidth={2} />
        <path d={expensePath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      </svg>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 2, background: '#2563eb', display: 'inline-block' }} /> รายรับ</span>
        <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 2, background: '#f59e0b', display: 'inline-block' }} /> รายจ่าย</span>
      </div>
    </div>
  );
};

export default function StaffPage({ master = [] }) {
  const [data, setData] = useState({ rooms: [], maintenance: [], bills: [], users: [] });

  useEffect(() => {
    if (master && master.length > 0) {
      // if App passed master array, try to use it
      setData(prev => ({ ...prev, master }));
    } else {
      // fetch master from backend
      (async () => {
        try {
          const res = await fetch('http://localhost:3000/api/master');
          if (!res.ok) return;
          const p = await res.json();
          setData({ rooms: p.rooms || [], maintenance: p.maintenance || [], bills: p.bills || [], users: p.users || [] });
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [master]);

  // fallback sample aggregates if empty
  const rooms = data.rooms.length ? data.rooms : [];
  const maintenance = data.maintenance.length ? data.maintenance : [];
  const bills = data.bills.length ? data.bills : [];

  const pieData = [
    { name: 'มีผู้เช่า', value: rooms.filter(r => r.status === 'Occupied').length },
    { name: 'อยู่ระหว่างปรับปรุง', value: rooms.filter(r => r.status === 'Maintenance').length },
    { name: 'ว่าง', value: rooms.filter(r => r.status === 'Vacant').length },
  ];
  const PIE_COLORS = ['#2563eb', '#f59e0b', '#e5e7eb'];

  const lineData = [
    { month: 'Jan', income: 18, expense: 8 }, { month: 'Feb', income: 20, expense: 7 },
    { month: 'Mar', income: 22, expense: 9 }, { month: 'Apr', income: 21, expense: 8 },
    { month: 'May', income: 25, expense: 10 }, { month: 'Jun', income: 24, expense: 9 },
  ];

  return (
    <div>
      <h2 style={{ color: '#1e3a5f' }}>Staff Home</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'ห้องพักทั้งหมด', value: `${rooms.length} ห้อง`, icon: '🏠', color: '#2563eb' },
          { label: 'ห้องว่าง', value: `${rooms.filter(r => r.status === 'Vacant').length} ห้อง`, icon: '✅', color: '#16a34a' },
          { label: 'รายการแจ้งซ่อม', value: `${maintenance.filter(m => m.status === 'Pending').length} รายการ`, icon: '🔧', color: '#d97706' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, color: '#1e3a5f' }}>อัตราสถานะห้อง</div>
          <SimplePieChart data={pieData} colors={PIE_COLORS} />
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, color: '#1e3a5f' }}>รายรับ-รายจ่าย (ตัวอย่าง)</div>
          <SimpleLineChart data={lineData} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#1e3a5f' }}>🔧 รายการแจ้งซ่อม</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{maintenance.filter(m => m.status === 'Pending').length} รายการ</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>รอดำเนินการ</div>
          <div style={{ height: 1, background: '#f3f4f6', margin: '12px 0' }} />
          {maintenance.filter(m => m.status === 'Pending').slice(0, 3).map(m => (
            <div key={m.id} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>ห้อง {m.room}: {m.detail}</div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#1e3a5f' }}>ล่าสุดจากระบบ</div>
          <div style={{ color: '#6b7280' }}>บิลทั้งหมด: {bills.length} ใบ</div>
          <div style={{ color: '#6b7280' }}>สมาชิก: {data.users.length || 0} คน</div>
        </Card>
      </div>
    </div>
  );
}
