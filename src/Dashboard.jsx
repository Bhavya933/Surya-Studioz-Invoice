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

        let pData = pRes && pRes.ok ? await pRes.json() : null;
        projects = Array.isArray(pData) ? pData : JSON.parse(localStorage.getItem('studio_projects') || '[]');
        if (!Array.isArray(projects)) projects = [];

        let iData = iRes && iRes.ok ? await iRes.json() : null;
        invoices = Array.isArray(iData) ? iData : JSON.parse(localStorage.getItem('invoice_history') || '[]');
        if (!Array.isArray(invoices)) invoices = [];

        let cData = cRes && cRes.ok ? await cRes.json() : null;
        clients = Array.isArray(cData) ? cData : JSON.parse(localStorage.getItem('studio_clients') || '[]');
        if (!Array.isArray(clients)) clients = [];

      } catch (err) {
        console.error('API Fetch Error:', err);
        projects = JSON.parse(localStorage.getItem('studio_projects') || '[]');
        if (!Array.isArray(projects)) projects = [];
        invoices = JSON.parse(localStorage.getItem('invoice_history') || '[]');
        if (!Array.isArray(invoices)) invoices = [];
        clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
        if (!Array.isArray(clients)) clients = [];
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

        const split = { Wedding: 0, Prewedding: 0, Commercial: 0 };
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
        
        const maxRev = Math.max(...monthlyRev, 100);

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
          monthlyRev,
          monthLabels,
          maxRev: Number.isFinite(maxRev) ? maxRev : 100
        });
      } catch (err) {
        console.error('Dashboard Load Error:', err);
        // Set a fallback state so it doesn't spin forever
        setStats({
          revenue: 0, revTrend: '0%', costs: 0, costTrend: '0%', margin: 0, marginTrend: '0%',
          activePipeline: 0, totalClients: 0, recentInvoices: [], categorySplit: { Wedding: 0, Prewedding: 0, Commercial: 0 },
          monthlyRev: [0,0,0,0,0,0], monthLabels: ['','','','','',''], maxRev: 100
        });
      }
    };
    fetchData();
  }, []);

  if (!stats) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '16px', fontWeight: '600' }}>Loading Data...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

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

          <div style={{ height: '300px', width: '100%', display: 'flex', gap: '15px', marginTop: '20px' }}>
             {/* Y-Axis Labels */}
             <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '200px', alignSelf: 'flex-end', paddingBottom: '4px', marginBottom: '44px' }}>
                {[3, 2, 1, 0].map((step) => {
                   const val = (stats.maxRev / 3) * step;
                   let formatted = val >= 100000 ? (val / 100000).toFixed(1) + 'L' : (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val);
                   return <span key={step} style={{ fontSize: '10px', fontWeight: '900', color: theme.muted, textAlign: 'right', minWidth: '35px' }}>{formatted}</span>
                })}
             </div>

             <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', height: '100%' }}>
                {/* Horizontal grid lines */}
                <div style={{ position: 'absolute', bottom: '244px', left: 0, right: 0, borderTop: '1px dashed ' + theme.border + '50', zIndex: 0 }} />
                <div style={{ position: 'absolute', bottom: '178px', left: 0, right: 0, borderTop: '1px dashed ' + theme.border + '50', zIndex: 0 }} />
                <div style={{ position: 'absolute', bottom: '112px', left: 0, right: 0, borderTop: '1px dashed ' + theme.border + '50', zIndex: 0 }} />
                <div style={{ position: 'absolute', bottom: '46px', left: 0, right: 0, borderTop: '1px dashed ' + theme.border + '50', zIndex: 0 }} />

                {stats.monthlyRev.map((val, i) => {
                   const heightPct = stats.maxRev > 0 ? (val / stats.maxRev) * 100 : 0;
                   
                   let formattedVal = val.toString();
                   if (val >= 100000) formattedVal = (val / 100000).toFixed(2) + 'L';
                   else if (val >= 1000) formattedVal = (val / 1000).toFixed(1) + 'k';

                   const isCurrentMonth = i === 5;

                   return (
                     <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14%', gap: '12px', zIndex: 1, height: '100%' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '950', 
                          color: val > 0 ? (isCurrentMonth ? '#6366f1' : theme.text) : theme.muted, 
                          opacity: val > 0 ? 1 : 0.4,
                          marginTop: 'auto'
                        }}>
                          ₹{formattedVal}
                        </span>
                        
                        <div style={{ height: '200px', width: '100%', maxWidth: '44px', display: 'flex', alignItems: 'flex-end', background: isDarkMode ? '#1e293b80' : '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
                           <div style={{ 
                             width: '100%', 
                             height: `${Math.max(5, heightPct)}%`, 
                             background: isCurrentMonth ? 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' : (isDarkMode ? 'linear-gradient(180deg, #475569 0%, #334155 100%)' : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)'), 
                             borderRadius: '8px',
                             transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                             boxShadow: isCurrentMonth ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                           }} />
                        </div>
                        
                        <span style={{ fontSize: '11px', fontWeight: '900', color: isCurrentMonth ? theme.text : theme.muted, marginBottom: '8px' }}>{stats.monthLabels[i]}</span>
                     </div>
                   );
                })}
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
                { label: 'Wedding', count: stats.categorySplit.Wedding, color: '#6366f1' },
                { label: 'Prewedding', count: stats.categorySplit.Prewedding, color: '#f97316' },
                { label: 'Commercial', count: stats.categorySplit.Commercial, color: '#10b981' }
              ].map((item, i) => {
                const total = stats.categorySplit.Wedding + stats.categorySplit.Prewedding + stats.categorySplit.Commercial;
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
                    <p style={{ margin: 0, fontSize: '11px', color: theme.muted, fontWeight: '700' }}>INV#{inv.number} • {(() => {
                      const d = new Date(inv.date);
                      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    })()}</p>
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
