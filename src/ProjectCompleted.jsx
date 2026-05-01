import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Search, Mail, Phone, Calendar, 
  DollarSign, ArrowRight, ExternalLink, 
  Award, TrendingUp, BarChart2, Briefcase, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ProjectCompleted = ({ isDarkMode, onOpenAnalysis, searchQuery: globalSearchQuery }) => {
  const [projects, setProjects] = useState([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/all-projects`);
        const data = await res.json();
        // Filter only DELIVERED projects
        const delivered = data.filter(p => p.status === 'Delivered');
        setProjects(delivered);
      } catch (err) {
        console.error('Project Fetch Error:', err);
        setProjects(JSON.parse(localStorage.getItem('studio_projects') || '[]').filter(p => p.status === 'Delivered'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const q = (globalSearchQuery || localSearchQuery).toLowerCase();
    return p.clientName?.toLowerCase().includes(q) || p.title?.toLowerCase().includes(q);
  });

  const stats = {
    total: projects.length,
    revenue: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    margin: projects.reduce((sum, p) => {
      const costs = (Number(p.team_price || p.teamPrice) || 0) + (Number(p.editor_price || p.editorPrice) || 0) + (Number(p.album_price || p.albumPrice) || 0);
      return sum + (Number(p.budget) || 0) - costs;
    }, 0)
  };

  return (
    <div style={{ padding: '24px 0', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes archiveFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowSlide {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .archive-card { animation: kpiEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .archive-row { animation: rowSlide 0.5s ease both; transition: all 0.3s ease; }
        .archive-row:hover { background: ${isDarkMode ? '#3d4b5f' : '#f8fafc'} !important; transform: scale(1.005); }
        @keyframes kpiEntrance {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: theme.muted }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Loading Completed Projects...</span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : (
        <>
          {/* 📊 ARCHVIE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { label: 'Completed Shoots', value: stats.total, icon: CheckCircle, color: '#10b981' },
          { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#6366f1' },
          { label: 'Net Studio Margin', value: `₹${stats.margin.toLocaleString()}`, icon: Award, color: '#f59e0b' },
        ].map((card, idx) => (
          <div key={idx} className="archive-card" style={{ animationDelay: `${idx * 0.1}s`, background: theme.card, padding: '24px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ background: `${card.color}15`, color: card.color, padding: '14px', borderRadius: '16px' }}>
              <card.icon size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '950', color: theme.text }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 SEARCH & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: '26px', fontWeight: '950', color: theme.text, margin: 0 }}>Project Archive</h1>
           <p style={{ color: theme.muted, fontSize: '14px', fontWeight: '600', margin: '4px 0 0 0' }}>Review all delivered projects and financial analysis</p>
        </div>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color={theme.muted} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" placeholder="Search by client or project..." 
            value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} 
            style={{ width: '100%', padding: '12px 20px 12px 48px', borderRadius: '18px', border: '1px solid ' + theme.border, outline: 'none', background: theme.card, color: theme.text, fontSize: '14px', fontWeight: '700' }} 
          />
        </div>
      </div>

      {/* 💼 COMPLETED TABLE */}
      <div style={{ background: theme.card, borderRadius: '28px', border: '1px solid ' + theme.border, padding: '10px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '900', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 24px' }}>PROJECT IDENTITY</th>
              <th>CLIENT</th>
              <th>EVENT DATE</th>
              <th>STUDIO MARGIN</th>
              <th>DELIVERED DATE</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p, idx) => {
                const totalCost = (Number(p.team_price || p.teamPrice) || 0) + (Number(p.editor_price || p.editorPrice) || 0) + (Number(p.album_price || p.albumPrice) || 0);
                const margin = (Number(p.budget) || 0) - totalCost;
              return (
                <tr key={p.id} className="archive-row" style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', animationDelay: `${0.3 + (idx * 0.05)}s` }}>
                  <td style={{ padding: '16px 24px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#10b98110', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '950', color: theme.text }}>{p.title || 'Untitled Project'}</h4>
                        <span style={{ fontSize: '11px', color: theme.muted, fontWeight: '700' }}>#{String(p.id).slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '800', color: theme.text, fontSize: '14px' }}>{p.clientName}</td>
                  <td style={{ fontWeight: '950', color: theme.text, fontSize: '14px' }}>{new Date(p.event_date || p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '950',
                      background: margin >= 0 ? '#10b98115' : '#ef444415',
                      color: margin >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      ₹{margin.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: '750', color: theme.muted }}>{p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}</td>
                  <td style={{ textAlign: 'right', paddingRight: '20px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                    <button 
                      onClick={() => onOpenAnalysis(p.clientName)}
                      style={{ 
                        border: '1px solid #6366f140', background: '#6366f110', color: '#6366f1',
                        padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '900',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#6366f110'; e.currentTarget.style.color = '#6366f1'; }}
                    >
                      View Analysis <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProjects.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: theme.muted }}>
             <CheckCircle size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
             <h3 style={{ margin: 0, fontWeight: '900' }}>No completed projects found</h3>
             <p style={{ fontSize: '13px', fontWeight: '600' }}>Projects will appear here once marked as 'Delivered'</p>
          </div>
        )}
      </div>
      </>
      )}
      {/* HIDDEN PRINT REPORT FOR ARCHIVE PDF DOWNLOAD */}
      <div id="archive-report-root" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="archive-report-content" style={{ width: '1000px', padding: '40px', background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f3f4f6', paddingBottom: '24px', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#111827', letterSpacing: '-0.02em' }}>Project Archive & Financials</h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Delivered</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '900', color: '#10b981' }}>{projects.length} Projects</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Completed Shoots</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900' }}>{stats.total}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Total Revenue</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900' }}>₹{stats.revenue.toLocaleString()}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Net Studio Margin</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₹{stats.margin.toLocaleString()}</h2>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #f97316', paddingLeft: '12px' }}>Delivered Projects Registry</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>PROJECT TITLE</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>CLIENT</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>BUDGET</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>MARGIN</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>DELIVERED</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => {
                const costs = (Number(p.team_price || p.teamPrice) || 0) + (Number(p.editor_price || p.editorPrice) || 0) + (Number(p.album_price || p.albumPrice) || 0);
                const margin = (Number(p.budget) || 0) - costs;
                return (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.title || 'Untitled'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>#{String(p.id).slice(-6)}</div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>{p.clientName}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700' }}>₹{Number(p.budget || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '800', color: margin >= 0 ? '#10b981' : '#ef4444' }}>₹{margin.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{p.deadline || 'N/A'}</td>
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No projects found in archive.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Archive Report • Surya Studioz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCompleted;
