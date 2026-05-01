import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingCart, DollarSign, BarChart3, 
  TrendingUp, TrendingDown, MoreHorizontal, 
  RefreshCw, Briefcase, Star, ChevronRight, Activity, Zap, Camera, Heart
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const KPICard = ({ title, value, trend, trendDir, icon: Icon, color, isDarkMode }) => (
  <div className="hover-lift" style={{
    background: isDarkMode ? '#334155' : '#fff',
    borderRadius: '24px',
    padding: '24px',
    flex: 1,
    border: '1px solid ' + (isDarkMode ? '#475569' : '#f1f5f9'),
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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

const Dashboard = ({ isDarkMode, timeRange = 'Last 6 months', searchQuery = '' }) => {
  const [stats, setStats] = useState(null);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(null);

  useEffect(() => {
    setSelectedMonthOffset(null);
  }, [timeRange, searchQuery]);

  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9'
  };

  useEffect(() => {
    let isMounted = true;

    // The data processing logic
    const processData = (rawProjects, invoices, clients) => {
        try {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // 🔍 Apply Global Search
          let searchFilteredProjects = rawProjects;
          let filteredInvoices = invoices;
          let filteredClients = clients;

          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            searchFilteredProjects = rawProjects.filter(p => 
              (p.clientName || '').toLowerCase().includes(q) || 
              (p.title || '').toLowerCase().includes(q) ||
              (p.category || '').toLowerCase().includes(q)
            );
            filteredInvoices = invoices.filter(inv => 
              (inv.client?.name || '').toLowerCase().includes(q) ||
              (inv.number || '').toString().includes(q)
            );
            filteredClients = clients.filter(c => 
              (c.name || '').toLowerCase().includes(q) ||
              (c.id || '').toLowerCase().includes(q)
            );
          }

          // 📊 GRAPH & SPLIT (Always calculate from searchFilteredProjects)
          const split = { Wedding: 0, Prewedding: 0, Commercial: 0 };
          searchFilteredProjects.forEach(p => {
            const cat = p.category || 'Wedding';
            if (split[cat] !== undefined) split[cat]++;
            else split['Wedding']++;
          });

          const getInvoiceTotal = (inv) => inv.items?.reduce((s, item) => s + ((Number(item.rate) || 0) * (Number(item.qty) || 0)), 0) || 0;

          const getInvoiceDate = (inv) => {
             const relatedProject = searchFilteredProjects.find(p => p.clientName && inv.client?.name && p.clientName.toLowerCase() === inv.client.name.toLowerCase());
             if (relatedProject && (relatedProject.event_date || relatedProject.date)) {
                 return new Date(relatedProject.event_date || relatedProject.date);
             }
             return new Date(inv.date);
          };

          const monthlyRev = [];
          const monthLabels = [];
          for (let i = 5; i >= 0; i--) {
            const target = new Date(currentYear, currentMonth - i, 1);
            const m = target.getMonth();
            const y = target.getFullYear();
            
            const monthTotal = filteredInvoices.filter(inv => {
              const d = getInvoiceDate(inv);
              if (isNaN(d.getTime())) return false;
              return d.getMonth() === m && d.getFullYear() === y;
            }).reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);
            
            monthlyRev.push(monthTotal);
            monthLabels.push(target.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase());
          }
          
          const actualMax = Math.max(...monthlyRev, 100);
          let stepSize = 1000;
          if (actualMax > 100000) stepSize = 50000;
          else if (actualMax > 50000) stepSize = 25000;
          else if (actualMax > 20000) stepSize = 20000;
          else if (actualMax > 10000) stepSize = 10000;
          const maxRev = Math.ceil(actualMax / (stepSize * 3)) * (stepSize * 3) || (stepSize * 3);

          // ⏳ KPI DATA (Filtered by timeRange or selected bar)
          let kpiProjects = searchFilteredProjects;
          let prevKpiProjects = [];
          let kpiInvoices = filteredInvoices;
          let prevKpiInvoices = [];

          if (selectedMonthOffset !== null) {
            const target = new Date(currentYear, currentMonth - selectedMonthOffset, 1);
            kpiProjects = searchFilteredProjects.filter(p => {
              const d = new Date(p.event_date || p.date);
              return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
            });
            kpiInvoices = filteredInvoices.filter(inv => {
              const d = getInvoiceDate(inv); return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
            });
            prevKpiProjects = searchFilteredProjects.filter(p => {
              const d = new Date(p.event_date || p.date);
              const prevTarget = new Date(currentYear, currentMonth - selectedMonthOffset - 1, 1);
              return d.getMonth() === prevTarget.getMonth() && d.getFullYear() === prevTarget.getFullYear();
            });
            prevKpiInvoices = filteredInvoices.filter(inv => {
              const d = getInvoiceDate(inv); const pt = new Date(currentYear, currentMonth - selectedMonthOffset - 1, 1);
              return d.getMonth() === pt.getMonth() && d.getFullYear() === pt.getFullYear();
            });
          } else if (timeRange === 'This month') {
            kpiProjects = searchFilteredProjects.filter(p => {
              const d = new Date(p.event_date || p.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            kpiInvoices = filteredInvoices.filter(inv => { const d = getInvoiceDate(inv); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
            
            prevKpiProjects = searchFilteredProjects.filter(p => {
              const d = new Date(p.event_date || p.date);
              const target = new Date(currentYear, currentMonth - 1, 1);
              return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
            });
            prevKpiInvoices = filteredInvoices.filter(inv => { const d = getInvoiceDate(inv); const target = new Date(currentYear, currentMonth - 1, 1); return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear(); });
          } else if (timeRange === 'Last 6 months') {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            kpiProjects = searchFilteredProjects.filter(p => new Date(p.event_date || p.date) >= sixMonthsAgo);
            kpiInvoices = filteredInvoices.filter(inv => getInvoiceDate(inv) >= sixMonthsAgo);
            
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(now.getMonth() - 12);
            prevKpiProjects = searchFilteredProjects.filter(p => {
                const d = new Date(p.event_date || p.date);
                return d >= twelveMonthsAgo && d < sixMonthsAgo;
            });
            prevKpiInvoices = filteredInvoices.filter(inv => {
                const d = getInvoiceDate(inv); return d >= twelveMonthsAgo && d < sixMonthsAgo;
            });
          } else if (timeRange === 'Last year') {
            const lastYear = now.getFullYear() - 1;
            kpiProjects = searchFilteredProjects.filter(p => new Date(p.event_date || p.date).getFullYear() === lastYear);
            kpiInvoices = filteredInvoices.filter(inv => getInvoiceDate(inv).getFullYear() === lastYear);
            prevKpiProjects = searchFilteredProjects.filter(p => new Date(p.event_date || p.date).getFullYear() === lastYear - 1);
            prevKpiInvoices = filteredInvoices.filter(inv => getInvoiceDate(inv).getFullYear() === lastYear - 1);
          } else {
            // All Time: No previous trend
            prevKpiProjects = [];
            prevKpiInvoices = [];
          }

          const calcRevenue = (arr) => arr.reduce((s, inv) => s + getInvoiceTotal(inv), 0);
          const calcCost = (arr) => arr.reduce((s, p) => s + (Number(p.team_price) || 0) + (Number(p.editor_price) || 0) + (Number(p.album_price) || 0), 0);

          const revCurr = calcRevenue(kpiInvoices);
          const revPrev = calcRevenue(prevKpiInvoices);
          
          const costCurr = calcCost(kpiProjects);
          const costPrev = calcCost(prevKpiProjects);

          const marginCurr = revCurr - costCurr;
          const marginPrev = revPrev - costPrev;
          const activePipeline = kpiProjects.filter(p => p.status !== 'Delivered').length;

          const calculateTrend = (curr, prev) => {
            if (prev === 0) return curr === 0 ? '0%' : '+100%';
            const diff = ((curr - prev) / prev) * 100;
            return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
          };

          if (isMounted) {
            setStats({
              revenue: revCurr,
              revTrend: calculateTrend(revCurr, revPrev),
              costs: costCurr,
              costTrend: calculateTrend(costCurr, costPrev),
              margin: marginCurr,
              marginTrend: calculateTrend(marginCurr, marginPrev),
              activePipeline,
              totalClients: filteredClients.length,
              recentInvoices: filteredInvoices.slice(0, 4),
              categorySplit: split,
              monthlyRev,
              monthLabels,
              maxRev: Number.isFinite(maxRev) ? maxRev : 100
            });
          }
        } catch (err) {
          console.error('Data Processing Error:', err);
        }
    };

    // 1. Instantly load from localStorage for zero wait time
    let localProjects = JSON.parse(localStorage.getItem('studio_projects') || '[]');
    let localInvoices = JSON.parse(localStorage.getItem('invoice_history') || '[]');
    let localClients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
    
    if (localProjects.length > 0 || localInvoices.length > 0) {
      processData(localProjects, localInvoices, localClients);
    }

    // 2. Fetch fresh data in the background (waits for Render server if asleep)
    const fetchFreshData = async () => {
      try {
        const [pRes, iRes, cRes] = await Promise.all([
          fetch(`${API_URL}/all-projects`).catch(() => null),
          fetch(`${API_URL}/invoices`).catch(() => null),
          fetch(`${API_URL}/clients`).catch(() => null)
        ]);

        let pData = pRes && pRes.ok ? await pRes.json() : null;
        let iData = iRes && iRes.ok ? await iRes.json() : null;
        let cData = cRes && cRes.ok ? await cRes.json() : null;

        if (Array.isArray(pData)) {
          localProjects = pData;
          localStorage.setItem('studio_projects', JSON.stringify(pData));
        }
        if (Array.isArray(iData)) {
          localInvoices = iData;
          localStorage.setItem('invoice_history', JSON.stringify(iData));
        }
        if (Array.isArray(cData)) {
          localClients = cData;
          localStorage.setItem('studio_clients', JSON.stringify(cData));
        }

        // Re-process with fresh data silently!
        processData(localProjects, localInvoices, localClients);

      } catch (err) {
        console.error('API Fetch Error:', err);
        // Fallback state if we never loaded local data either
        if (!stats && isMounted) {
          setStats({
            revenue: 0, revTrend: '0%', costs: 0, costTrend: '0%', margin: 0, marginTrend: '0%',
            activePipeline: 0, totalClients: 0, recentInvoices: [], categorySplit: { Wedding: 0, Prewedding: 0, Commercial: 0 },
            monthlyRev: [0,0,0,0,0,0], monthLabels: ['','','','','',''], maxRev: 100
          });
        }
      }
    };
    
    fetchFreshData();

    return () => { isMounted = false; };
  }, [timeRange, searchQuery, selectedMonthOffset]);


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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'dashboardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
      <style>{`
        @keyframes dashboardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kpiEntrance {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .kpi-card-wrapper { animation: kpiEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .kpi-card-wrapper:hover { transform: translateY(-10px); }
        .kpi-card-wrapper:hover > div { box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; border-color: #6366f140 !important; }
        .live-badge { animation: pulse 2s infinite; }
        .dashboard-row { display: grid; gap: 24px; }
        .chart-bar { transition: height 1s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease; }
        .chart-bar:hover { filter: brightness(1.2); }
      `}</style>

      {/* KPI ROW */}
      <div className="dashboard-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card-wrapper" style={{ animationDelay: '0.1s' }}><KPICard isDarkMode={isDarkMode} title="TOTAL REVENUE" value={`₹${stats.revenue.toLocaleString()}`} trend={stats.revTrend} trendDir={stats.revTrend.includes('-') ? 'down' : 'up'} icon={DollarSign} color="#6366f1" /></div>
        <div className="kpi-card-wrapper" style={{ animationDelay: '0.2s' }}><KPICard isDarkMode={isDarkMode} title="PROJECT COSTS" value={`₹${stats.costs.toLocaleString()}`} trend={stats.costTrend} trendDir={stats.costTrend.includes('+') ? 'up' : 'down'} icon={ShoppingCart} color="#f97316" /></div>
        <div className="kpi-card-wrapper" style={{ animationDelay: '0.3s' }}><KPICard isDarkMode={isDarkMode} title="STUDIO MARGIN" value={`₹${stats.margin.toLocaleString()}`} trend={stats.marginTrend} trendDir={stats.marginTrend.includes('-') ? 'down' : 'up'} icon={TrendingUp} color="#10b981" /></div>
        <div className="kpi-card-wrapper" style={{ animationDelay: '0.4s' }}><KPICard isDarkMode={isDarkMode} title="ACTIVE PIPELINE" value={stats.activePipeline} trend={`+${stats.activePipeline} Leads`} trendDir="up" icon={Activity} color="#f43f5e" /></div>
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
            <div className="live-badge" style={{ background: isDarkMode ? '#10b98120' : '#10b98110', padding: '8px 16px', borderRadius: '12px', border: '1px solid #10b98140', fontSize: '12px', fontWeight: '750', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
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
                   const offset = 5 - i;
                   const isSelected = selectedMonthOffset === offset;
                   const hasSelection = selectedMonthOffset !== null;
                   
                   let formattedVal = val.toString();
                   if (val >= 100000) formattedVal = (val / 100000).toFixed(2) + 'L';
                   else if (val >= 1000) formattedVal = (val / 1000).toFixed(1) + 'k';

                   const isCurrentMonth = i === 5;
                   // Logic for highlighting the bar
                   let barOpacity = 1;
                   if (hasSelection && !isSelected) barOpacity = 0.3;
                   
                   let barBackground = isDarkMode ? 'linear-gradient(180deg, #475569 0%, #334155 100%)' : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)';
                   if (isSelected) barBackground = 'linear-gradient(180deg, #f97316 0%, #fb923c 100%)'; // Orange highlight for selected
                   else if (isCurrentMonth) barBackground = 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)';

                   return (
                     <div 
                        key={i} 
                        onClick={() => setSelectedMonthOffset(isSelected ? null : offset)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14%', gap: '12px', zIndex: 1, height: '100%', cursor: 'pointer', opacity: barOpacity, transition: 'opacity 0.3s ease' }}
                     >
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '950', 
                          color: val > 0 ? (isSelected ? '#f97316' : (isCurrentMonth ? '#6366f1' : theme.text)) : theme.muted, 
                          opacity: val > 0 ? 1 : 0.4,
                          marginTop: 'auto',
                          transition: 'color 0.3s ease'
                        }}>
                          ₹{formattedVal}
                        </span>
                        
                        <div style={{ height: '200px', width: '100%', maxWidth: '44px', display: 'flex', alignItems: 'flex-end', background: isDarkMode ? '#1e293b80' : '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
                           <div className="chart-bar" style={{ 
                             width: '100%', 
                             height: `${Math.max(5, heightPct)}%`, 
                             background: barBackground, 
                             borderRadius: '8px',
                             transition: 'height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease',
                             boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.3)' : (isCurrentMonth ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none')
                           }} />
                        </div>
                        
                        <span style={{ fontSize: '11px', fontWeight: '900', color: isSelected ? '#f97316' : (isCurrentMonth ? theme.text : theme.muted), marginBottom: '8px', transition: 'color 0.3s ease' }}>
                          {stats.monthLabels[i]}
                        </span>
                     </div>
                   );
                })}
             </div>
          </div>
        </div>

        {/* DISTRIBUTION */}
        <div className="hover-lift" style={{ background: theme.card, borderRadius: '32px', padding: '24px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: '16px', fontWeight: '950', color: theme.text, margin: 0 }}>Shoot Split</h2>
             <Zap size={18} color="#f59e0b" fill="#f59e0b" />
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {/* Modern Donut Chart */}
              <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                {(() => {
                  const total = stats.categorySplit.Wedding + stats.categorySplit.Prewedding + stats.categorySplit.Commercial;
                  const wPct = total > 0 ? (stats.categorySplit.Wedding / total) * 100 : 0;
                  const pPct = total > 0 ? (stats.categorySplit.Prewedding / total) * 100 : 0;
                  const cPct = total > 0 ? (stats.categorySplit.Commercial / total) * 100 : 0;

                  const wEnd = wPct;
                  const pEnd = wPct + pPct;

                  return (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: total > 0 
                        ? `conic-gradient(#6366f1 0% ${wEnd}%, #f97316 ${wEnd}% ${pEnd}%, #10b981 ${pEnd}% 100%)`
                        : (isDarkMode ? '#1e293b' : '#f1f5f9'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }} className="donut-chart">
                      <div style={{
                        width: '78%',
                        height: '78%',
                        background: theme.card,
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        border: '1px solid ' + theme.border
                      }}>
                        <span style={{ fontSize: '26px', fontWeight: '950', color: theme.text, lineHeight: 1 }}>{total}</span>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Shoots</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Wedding', count: stats.categorySplit.Wedding, color: '#6366f1' },
                  { label: 'Prewedding', count: stats.categorySplit.Prewedding, color: '#f97316' },
                  { label: 'Commercial', count: stats.categorySplit.Commercial, color: '#10b981' }
                ].map((item, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    borderRadius: '12px', 
                    background: isDarkMode ? '#1e293b50' : '#f8fafc',
                    border: '1px solid ' + theme.border,
                    transition: '0.2s'
                  }} className="split-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: '11px', fontWeight: '800', color: theme.text }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '950', color: theme.text }}>{item.count}</span>
                  </div>
                ))}
              </div>
           </div>
         </div>
        <style>{`
          .donut-chart:hover { transform: scale(1.05); }
          .split-item:hover { transform: translateX(8px); background: ${isDarkMode ? '#334155' : '#fff'} !important; border-color: #6366f1 !important; }
        `}</style>
      </div>

      {/* RECENT BILLING TABLE */}
      <div style={{ background: theme.card, borderRadius: '32px', padding: '32px', border: '1px solid ' + theme.border }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
           <h2 style={{ fontSize: '20px', fontWeight: '950', color: theme.text, margin: 0 }}>Recent Recognized Billing</h2>
           <BarChart3 size={20} color={theme.muted} />
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.recentInvoices.map((inv, i) => {
              const sub = (inv.items || []).reduce((s, item) => s + (parseFloat(item.rate) || 0) * (parseInt(item.qty) || 0), 0);
              const tax = sub * ((inv.taxRate || 0) / 100);
              const total = sub + tax;
              const amountPaid = parseFloat(inv.amountPaid) || 0;
              const balance = total - amountPaid;
              
              const isPaid = total > 0 && balance <= 0;
              const statusText = isPaid ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'DUE');
              const statusColor = isPaid ? '#10b981' : (amountPaid > 0 ? '#3b82f6' : '#f97316');

              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '20px', border: '1px solid ' + theme.border, background: i % 2 === 0 ? (isDarkMode ? '#1e293b50' : '#f8fafc20') : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: `${['#6366f1', '#f97316', '#10b981', '#f43f5e'][i%4]}15`, color: ['#6366f1', '#f97316', '#10b981', '#f43f5e'][i%4], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: theme.text }}>{inv.client?.name || 'Untitled'}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: theme.muted, fontWeight: '700' }}>INV#{inv.number} • {(() => {
                        const d = new Date(inv.date);
                        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      })()}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '950', color: theme.text }}>₹{Number(total || inv.total || inv.amount || 0).toLocaleString()}</p>
                    <span style={{ fontSize: '10px', color: statusColor, fontWeight: '900', padding: '2px 6px', background: statusColor + '15', borderRadius: '4px' }}>{statusText}</span>
                  </div>
                </div>
              );
            })}
            {stats.recentInvoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.muted }}>No invoices found in database.</div>
            )}
         </div>
      </div>
      {/* HIDDEN PRINT REPORT FOR PDF DOWNLOAD */}
      <div id="analysis-report-root" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="analysis-report-content" style={{ width: '1000px', padding: '40px', background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f3f4f6', paddingBottom: '24px', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#111827', letterSpacing: '-0.02em' }}>Studio Performance Analysis</h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Period</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '900', color: '#f97316' }}>
                {selectedMonthOffset !== null ? `${stats.monthLabels[5 - selectedMonthOffset]} Selected` : timeRange}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Total Revenue</p>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '20px', fontWeight: '900' }}>₹{stats.revenue.toLocaleString()}</h2>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#10b981' }}>{stats.revTrend} vs last mo.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Project Costs</p>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '20px', fontWeight: '900' }}>₹{stats.costs.toLocaleString()}</h2>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#ef4444' }}>{stats.costTrend} vs last mo.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Studio Margin</p>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₹{stats.margin.toLocaleString()}</h2>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#10b981' }}>{stats.marginTrend} vs last mo.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Active Pipeline</p>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '20px', fontWeight: '900', color: '#6366f1' }}>{stats.activePipeline}</h2>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#6366f1' }}>Current Leads</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>Revenue Intelligence (6 Mo.)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                    <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>MONTH</th>
                    <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthLabels.map((label, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700' }}>{label}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>₹{stats.monthlyRev[idx].toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #f97316', paddingLeft: '12px' }}>Shoot Split Overview</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                    <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>CATEGORY</th>
                    <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.categorySplit).map(([cat, count]) => (
                    <tr key={cat}>
                      <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700' }}>{cat}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>{count} Shoots</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>Recent Recognized Billing</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>CLIENT NAME</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>INV NO.</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>DATE</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>STATUS</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInvoices.map((inv, i) => {
                const sub = (inv.items || []).reduce((s, item) => s + (parseFloat(item.rate) || 0) * (parseInt(item.qty) || 0), 0);
                const tax = sub * ((inv.taxRate || 0) / 100);
                const total = sub + tax;
                const amountPaid = parseFloat(inv.amountPaid) || 0;
                const balance = total - amountPaid;
                
                const isPaid = total > 0 && balance <= 0;
                const statusText = isPaid ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'DUE');
                const statusColor = isPaid ? '#10b981' : (amountPaid > 0 ? '#3b82f6' : '#f97316');

                return (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700' }}>{inv.client?.name || 'Untitled'}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>#{inv.number}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>{new Date(inv.date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800', color: statusColor }}>{statusText}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '900', color: '#10b981' }}>₹{Number(total || inv.total || inv.amount || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
              {stats.recentInvoices.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No billing records found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidential Studio Report • Surya Studioz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
