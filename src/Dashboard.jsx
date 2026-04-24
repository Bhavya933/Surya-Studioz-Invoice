import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingCart, DollarSign, BarChart3, 
  TrendingUp, TrendingDown, MoreHorizontal, 
  RefreshCw, Briefcase, Star, ChevronRight, Activity, Zap
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const KPICard = ({ title, value, trend, trendDir, icon: Icon, color, isDarkMode }) => (
  <div style={{
    background: isDarkMode ? '#334155' : '#fff',
    borderRadius: '24px',
    padding: '24px',
    flex: 1,
    border: '1px solid ' + (isDarkMode ? '#475569' : '#f1f5f9'),
    boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ background: `${color}15`, padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon color={color} size={22} strokeWidth={2.5} />
      </div>
      <MoreHorizontal size={20} color={isDarkMode ? '#94a3b8' : '#cbd5e1'} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: '800', letterSpacing: '0.02em' }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '950', color: isDarkMode ? '#f8fafc' : '#1a1c2e', margin: 0 }}>{value}</h2>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '950',
          background: trendDir === 'up' ? '#10b98115' : '#ef444415',
          color: trendDir === 'up' ? '#10b981' : '#ef4444'
        }}>
          {trendDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <span style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: '11px', fontWeight: '600' }}>vs last month</span>
    </div>
  </div>
);

const Dashboard = ({ isDarkMode }) => {
  const [stats, setStats] = useState(null);

  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9'
  };

  useEffect(() => {
    const fetchData = async () => {
      let projects = [];
      let invoices = [];
      let clients = [];
      
      try {
        const [pRes, iRes, cRes] = await Promise.all([
          fetch(`${API_URL}/all-projects`).catch(() => null),
          fetch(`${API_URL}/invoices`).catch(() => null),
          fetch(`${API_URL}/clients`).catch(() => null)
        ]);

        if (pRes && pRes.ok) projects = await pRes.json();
        else projects = JSON.parse(localStorage.getItem('studio_projects') || '[]');

        if (iRes && iRes.ok) invoices = await iRes.json();
        else invoices = JSON.parse(localStorage.getItem('invoice_history') || '[]');

        if (cRes && cRes.ok) clients = await cRes.json();
        else clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');

      } catch (err) {
        console.error('API Fetch Error:', err);
        projects = JSON.parse(localStorage.getItem('studio_projects') || '[]');
        invoices = JSON.parse(localStorage.getItem('invoice_history') || '[]');
        clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
      }
      
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 2. HELPERS FOR TRENDS
        const getMonthAggregates = (items, dateField, valueField, monthOffset = 0) => {
          const target = new Date(currentYear, currentMonth - monthOffset, 1);
          const m = target.getMonth();
          const y = target.getFullYear();
          
          return items.filter(item => {
            const dStr = item[dateField] || item.event_date || item.date;
            if (!dStr) return false;
            const d = new Date(dStr);
            return d.getMonth() === m && d.getFullYear() === y;
          }).reduce((sum, item) => sum + (Number(item[valueField] || item.budget) || 0), 0);
        };

        const calculateTrend = (curr, prev) => {
          if (prev === 0) return curr === 0 ? '0%' : '+100%';
          const diff = ((curr - prev) / prev) * 100;
          return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
        };

        // REVENUE TRENDS
        const revCurr = getMonthAggregates(projects, 'event_date', 'budget', 0);
        const revPrev = getMonthAggregates(projects, 'event_date', 'budget', 1);

        // COST TRENDS
        const costCurr = projects.filter(p => {
          const dStr = p.event_date || p.date;
          if (!dStr) return false;
          const d = new Date(dStr);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (Number(p.team_price) || 0) + (Number(p.editor_price) || 0) + (Number(p.album_price) || 0), 0);
        
        const costPrev = projects.filter(p => {
          const dStr = p.event_date || p.date;
          if (!dStr) return false;
          const d = new Date(dStr);
          const target = new Date(currentYear, currentMonth - 1, 1);
          return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
        }).reduce((sum, p) => sum + (Number(p.team_price) || 0) + (Number(p.editor_price) || 0) + (Number(p.album_price) || 0), 0);

        const marginCurr = revCurr - costCurr;
        const marginPrev = revPrev - costPrev;
        const activePipeline = projects.filter(p => p.status !== 'Delivered').length;

        const split = { Wedding: 0, Event: 0, Commercial: 0 };
        projects.forEach(p => {
          const cat = p.category || 'Wedding';
          if (split[cat] !== undefined) split[cat]++;
          else split['Wedding']++;
        });

        const monthlyRev = [];
        const monthLabels = [];
        for (let i = 5; i >= 0; i--) {
          const target = new Date(currentYear, currentMonth - i, 1);
          monthlyRev.push(getMonthAggregates(projects, 'event_date', 'budget', i));
          monthLabels.push(target.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase());
        }
        
        const maxRev = Math.max(...monthlyRev, 1000);
        const points = monthlyRev.map((val, i) => {
          const x = (i * (1000 / 5));
          const y = 250 - (val / maxRev * 200);
          return { x, y };
        });

        const pathD = points.length > 0 
          ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
          : 'M 0 150 L 1000 150';

        const areaD = `${pathD} L 1000 300 L 0 300 Z`;

        setStats({
          revenue: revCurr || projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
          revTrend: calculateTrend(revCurr, revPrev),
          costs: costCurr || projects.reduce((s, p) => s + (Number(p.team_price) || 0) + (Number(p.editor_price) || 0) + (Number(p.album_price) || 0), 0),
          costTrend: calculateTrend(costCurr, costPrev),
          margin: marginCurr || (projects.reduce((s, p) => s + (Number(p.budget) || 0), 0) - projects.reduce((s, p) => s + (Number(p.team_price) || 0) + (Number(p.editor_price) || 0) + (Number(p.album_price) || 0), 0)),
          marginTrend: calculateTrend(marginCurr, marginPrev),
          activePipeline,
          totalClients: clients.length,
          recentInvoices: invoices.slice(0, 4),
          categorySplit: split,
          pathD,
          areaD,
          monthLabels,
          chartPoints: points
        });
      } catch (err) {
        console.error('Dashboard Load Error:', err);
      }
    };
    fetchData();
  }, []);

  if (!stats) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.6s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .dashboard-row { display: grid; gap: 24px; }
      `}</style>

      {/* KPI ROW */}
      <div className="dashboard-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPICard isDarkMode={isDarkMode} title="TOTAL REVENUE" value={`₹${stats.revenue.toLocaleString()}`} trend={stats.revTrend} trendDir={stats.revTrend.includes('-') ? 'down' : 'up'} icon={DollarSign} color="#6366f1" />
        <KPICard isDarkMode={isDarkMode} title="PROJECT COSTS" value={`₹${stats.costs.toLocaleString()}`} trend={stats.costTrend} trendDir={stats.costTrend.includes('+') ? 'up' : 'down'} icon={ShoppingCart} color="#f97316" />
        <KPICard isDarkMode={isDarkMode} title="STUDIO MARGIN" value={`₹${stats.margin.toLocaleString()}`} trend={stats.marginTrend} trendDir={stats.marginTrend.includes('-') ? 'down' : 'up'} icon={TrendingUp} color="#10b981" />
        <KPICard isDarkMode={isDarkMode} title="ACTIVE PIPELINE" value={stats.activePipeline} trend={`+${stats.activePipeline} Leads`} trendDir="up" icon={Activity} color="#f43f5e" />
      </div>

      {/* ANALYTICS ROW */}
      <div className="dashboard-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* DYNAMIC CHART */}
        <div style={{ background: theme.card, borderRadius: '32px', padding: '32px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '950', color: theme.text, margin: 0 }}>Revenue Intelligence</h2>
              <p style={{ margin: 0, color: theme.muted, fontSize: '13px', fontWeight: '600' }}>Actual Performance Data (Last 6 Months)</p>
            </div>
            <div style={{ background: isDarkMode ? '#1e293b50' : '#f8fafc', padding: '8px 16px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '12px', fontWeight: '750', color: theme.muted }}>
               Live Tracking
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', position: 'relative', marginTop: '20px', padding: '0 30px' }}>
             <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={stats.areaD} fill="url(#chartGrad)" />
                <path d={stats.pathD} fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                {stats.chartPoints.map((p, i) => (
                   <circle key={i} cx={p.x} cy={p.y} r="8" fill="#fff" stroke="#6366f1" strokeWidth="4" />
                ))}
             </svg>
             <div style={{ 
               position: 'relative', 
               height: '20px', 
               marginTop: '20px', 
               color: theme.muted, 
               fontSize: '11px', 
               fontWeight: '950',
               margin: '0 30px'
             }}>
                {stats.monthLabels.map((lbl, i) => (
                  <span key={i} style={{ 
                    position: 'absolute', 
                    left: `${(i * 20)}%`, 
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap'
                  }}>
                    {lbl}
                  </span>
                ))}
             </div>
          </div>
        </div>

        {/* DISTRIBUTION */}
        <div style={{ background: theme.card, borderRadius: '32px', padding: '32px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: '18px', fontWeight: '950', color: theme.text, margin: 0 }}>Shoot Split</h2>
             <Zap size={20} color="#f59e0b" fill="#f59e0b" />
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { label: 'Weddings', count: stats.categorySplit.Wedding, color: '#6366f1' },
                { label: 'Events / Commercial', count: stats.categorySplit.Event + stats.categorySplit.Commercial, color: '#f97316' },
                { label: 'Other Shoots', count: 0, color: '#10b981' }
              ].map((item, i) => {
                const total = stats.categorySplit.Wedding + stats.categorySplit.Event + stats.categorySplit.Commercial;
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: theme.muted }}>{item.label.toUpperCase()}</span>
                      <span style={{ fontSize: '12px', fontWeight: '950', color: theme.text }}>{item.count} Shoots</span>
                    </div>
                    <div style={{ height: '8px', background: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(5, percentage)}%`, height: '100%', background: item.color, borderRadius: '10px' }} />
                    </div>
                  </div>
                );
              })}
           </div>

           <div style={{ marginTop: 'auto', background: isDarkMode ? '#1e293b50' : '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px dashed ' + theme.border, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: theme.text }}>Portfolio Performance</p>
              <h2 style={{ margin: '4px 0 0 0', fontWeight: '950', color: '#10b981' }}>STRONG</h2>
           </div>
        </div>
      </div>

      {/* RECENT BILLING TABLE */}
      <div style={{ background: theme.card, borderRadius: '32px', padding: '32px', border: '1px solid ' + theme.border }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
           <h2 style={{ fontSize: '20px', fontWeight: '950', color: theme.text, margin: 0 }}>Recent Recognized Billing</h2>
           <BarChart3 size={20} color={theme.muted} />
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.recentInvoices.map((inv, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '20px', border: '1px solid ' + theme.border, background: i % 2 === 0 ? (isDarkMode ? '#1e293b50' : '#f8fafc20') : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: `${['#6366f1', '#f97316', '#10b981', '#f43f5e'][i%4]}15`, color: ['#6366f1', '#f97316', '#10b981', '#f43f5e'][i%4], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={18} fill="currentColor" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: theme.text }}>{inv.client?.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.muted, fontWeight: '700' }}>INV#{inv.number} • {new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '950', color: '#10b981' }}>₹{Number(inv.amount || 0).toLocaleString()}</p>
                  <span style={{ fontSize: '10px', color: theme.muted, fontWeight: '900' }}>PAID / RECEIVED</span>
                </div>
              </div>
            ))}
            {stats.recentInvoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.muted }}>No invoices found in database.</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
