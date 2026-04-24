import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Search, Mail, Phone, Calendar, 
  DollarSign, ArrowRight, ExternalLink, 
  Award, TrendingUp, BarChart2, Briefcase
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ProjectCompleted = ({ isDarkMode, onOpenAnalysis }) => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      try {
        const res = await fetch(`${API_URL}/all-projects`);
        const data = await res.json();
        // Filter only DELIVERED projects
        const delivered = data.filter(p => p.status === 'Delivered');
        setProjects(delivered);
      } catch (err) {
        console.error('Project Fetch Error:', err);
        setProjects(JSON.parse(localStorage.getItem('studio_projects') || '[]').filter(p => p.status === 'Delivered'));
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* 📊 ARCHVIE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { label: 'Completed Shoots', value: stats.total, icon: CheckCircle, color: '#10b981' },
          { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#6366f1' },
          { label: 'Net Studio Margin', value: `₹${stats.margin.toLocaleString()}`, icon: Award, color: '#f59e0b' },
        ].map((card, idx) => (
          <div key={idx} style={{ background: theme.card, padding: '24px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
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
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
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
              <th>BUDGET</th>
              <th>STUDIO MARGIN</th>
              <th>DELIVERED DATE</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(p => {
                const totalCost = (Number(p.team_price || p.teamPrice) || 0) + (Number(p.editor_price || p.editorPrice) || 0) + (Number(p.album_price || p.albumPrice) || 0);
                const margin = (Number(p.budget) || 0) - totalCost;
              return (
                <tr key={p.id} style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                  <td style={{ padding: '16px 24px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#10b98110', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '950', color: theme.text }}>{p.title || 'Untitled Project'}</h4>
                        <span style={{ fontSize: '11px', color: theme.muted, fontWeight: '700' }}>#{p.id.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '800', color: theme.text, fontSize: '14px' }}>{p.clientName}</td>
                  <td style={{ fontWeight: '950', color: theme.text, fontSize: '14px' }}>₹{Number(p.budget || 0).toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '950',
                      background: margin >= 0 ? '#10b98115' : '#ef444415',
                      color: margin >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      ₹{margin.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: '750', color: theme.muted }}>{p.deadline || 'N/A'}</td>
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
    </div>
  );
};

export default ProjectCompleted;
