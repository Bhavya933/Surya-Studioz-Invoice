import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, Mail, Phone, Calendar, 
  DollarSign, Trash2, Edit2, ExternalLink, 
  Layout, Star, TrendingUp, Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientsProject = ({ isDarkMode, onNavigateToClient }) => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const theme = {
    bg: isDarkMode ? '#0a0f1e' : '#f8fafc',
    card: isDarkMode ? '#111827' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e', 
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    accent: '#6366f1',
    rowHover: isDarkMode ? '#1e293b' : '#f1f5f9'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch(`${API_URL}/clients`),
          fetch(`${API_URL}/all-projects`)
        ]);
        const cData = await cRes.json();
        const pData = await pRes.json();
        setClients(cData);
        setProjects(pData);
      } catch (err) {
        console.error('Data Load Error:', err);
        setClients(JSON.parse(localStorage.getItem('studio_clients') || '[]'));
        setProjects(JSON.parse(localStorage.getItem('studio_projects') || '[]'));
      }
    };
    fetchData();
  }, []);

  const getClientProjectStats = (clientName) => {
    const clientProjects = projects.filter(p => p.clientName === clientName);
    const totalBudget = clientProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const lastProject = clientProjects.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    return {
      count: clientProjects.length,
      revenue: totalBudget,
      lastShoot: lastProject ? new Date(lastProject.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No shoots yet'
    };
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 0', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .client-row { transition: 0.2s ease; border-radius: 20px; }
        .client-row:hover { background: ${theme.rowHover} !important; border-color: ${theme.accent}40 !important; }
      `}</style>

      {/* 🚀 HUB HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '950', color: theme.text, margin: 0, letterSpacing: '-0.02em' }}>Logistics Intelligence Hub</h1>
          <p style={{ color: theme.muted, fontSize: '14px', margin: '4px 0 0 0', fontWeight: '600' }}>Manage project lifecycles by client</p>
        </div>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color={theme.muted} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search clients with projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '16px', border: '1px solid ' + theme.border, background: theme.card, color: theme.text, outline: 'none', fontSize: '14px', fontWeight: '700' }}
          />
        </div>
      </div>

      {/* 💼 CLIENT-CENTRIC PROJECT LIST */}
      <div style={{ background: theme.card, borderRadius: '32px', border: '1px solid ' + theme.border, padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <th style={{ padding: '0 24px' }}>IDENTITY</th>
              <th>PROJECT STATUS</th>
              <th>PROJECT REVENUE</th>
              <th>CATEGORY</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>LOGISTICS ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => {
              const stats = getClientProjectStats(client.name);
              return (
                <tr key={client.id} className="client-row" style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: '1px solid ' + theme.border }}>
                  <td style={{ padding: '16px 24px', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: isDarkMode ? '#1e293b' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '950', color: '#f97316', border: '1px solid ' + theme.border }}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: theme.text }}>{client.name}</h4>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                           <span style={{ fontSize: '12px', color: theme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {client.email}</span>
                           <span style={{ fontSize: '12px', color: theme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '14px', fontWeight: '900', color: theme.text }}>{stats.count} Projects</span>
                       <span style={{ fontSize: '11px', color: theme.muted, fontWeight: '600' }}>Last shoot: {stats.lastShoot}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: '950', color: '#10b981' }}>₹{stats.revenue.toLocaleString()}</span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '5px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '950',
                      background: client.category === 'VIP' ? '#f9731615' : (client.category === 'Premium' ? '#10b98115' : theme.bg),
                      color: client.category === 'VIP' ? '#f97316' : (client.category === 'Premium' ? '#10b981' : theme.muted),
                      border: '1px solid currentColor'
                    }}>
                      {client.category.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                       <button 
                         onClick={() => {
                           // This navigates to the detailed Logistics Hub within ClientDetails
                           if (onNavigateToClient) onNavigateToClient(client);
                         }}
                         style={{ border: '1px solid #6366f140', background: '#6366f110', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', transition: '0.2s' }}
                         title="Open Logistics Analyzer"
                         onMouseOver={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                         onMouseOut={(e) => { e.currentTarget.style.background = '#6366f110'; e.currentTarget.style.color = '#6366f1'; }}
                       >
                         <ExternalLink size={18} strokeWidth={2.5} /> Enter Hub
                       </button>
                       <button style={{ border: '1px solid ' + theme.border, background: theme.card, padding: '10px', borderRadius: '12px', cursor: 'pointer', color: theme.muted }}><Edit2 size={16} /></button>
                       <button style={{ border: '1px solid #ef444430', background: '#ef444410', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div style={{ padding: '80px', textAlign: 'center', color: theme.muted }}>
             <Users size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
             <h3 style={{ fontWeight: '900', margin: 0 }}>No clients found</h3>
             <p style={{ fontSize: '14px', fontWeight: '600' }}>Search for another name or register a new client</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsProject;
