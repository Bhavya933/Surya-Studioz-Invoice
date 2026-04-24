import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Mail, Phone, Calendar, 
  DollarSign, Trash2, Edit2, X, Star, CreditCard,
  MessageCircle, ExternalLink, ChevronRight, Filter
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Clients = ({ isDarkMode, onViewDetails }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    category: 'Maternity Shoot', // Maternity Shoot, Wedding, Pre Wedding
  });

  const fetchData = async () => {
    try {
      // 1. Get Clients
      const cRes = await fetch(`${API_URL}/clients`);
      const cData = await cRes.json();
      setClients(cData);

      // 2. Get Invoices
      const iRes = await fetch(`${API_URL}/invoices`);
      const iData = await iRes.json();
      setInvoices(iData);

      // 3. Get Projects
      const pRes = await fetch(`${API_URL}/all-projects`);
      const pData = await pRes.json();
      setProjects(pData);
    } catch (err) {
      console.error('Data Load Error:', err);
      // LocalStorage Fallbacks
      setClients(JSON.parse(localStorage.getItem('studio_clients') || '[]'));
      setInvoices(JSON.parse(localStorage.getItem('invoice_history') || '[]'));
      setProjects(JSON.parse(localStorage.getItem('studio_projects') || '[]'));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveToStorage = (updated) => {
    setClients(updated);
    localStorage.setItem('studio_clients', JSON.stringify(updated));
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      const url = editingClient ? `${API_URL}/clients/${editingClient.id}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      fetchData();
      closeModal();
    } catch (err) {
      alert('Action failed');
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client? All history for them will remain in invoices.')) {
      try {
        await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ ...client });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '', category: 'Maternity Shoot' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Calculate Revenue per client from Invoice history
  const getClientStats = (clientName) => {
    const clientInvoices = invoices.filter(inv => inv.client?.name === clientName);
    const totalSpent = clientInvoices.reduce((sum, inv) => {
      const total = inv.items?.reduce((s, item) => s + (item.rate * item.qty), 0) || 0;
      return sum + total;
    }, 0);
    return {
      count: clientInvoices.length,
      spent: totalSpent,
      firstDate: clientInvoices.length > 0 ? clientInvoices[clientInvoices.length - 1]?.date : null,
      lastDate: clientInvoices.length > 0 ? clientInvoices[0]?.date : null,
      invoices: clientInvoices
    };
  };

  const formatDateStr = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.valueOf())) return dateString;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch(e) { return dateString; }
  };

  const filteredClients = clients.filter(c => {
    const latestProject = projects.filter(p => p.clientName === c.name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const isCompleted = latestProject && latestProject.status === 'Delivered';
    
    // Search match
    const searchMatch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (c.phone || '').includes(searchQuery);

    // Only show if not completed AND matches search
    return !isCompleted && searchMatch;
  });

  const stats = {
    total: clients.length,
    highValue: clients.filter(c => getClientStats(c.name).spent > 100000).length,
    newThisMonth: 0, // Placeholder for date logic
    avgSpent: clients.length ? (clients.reduce((sum, c) => sum + getClientStats(c.name).spent, 0) / clients.length) : 0
  };

  return (
    <div style={{ padding: '24px 0', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 📊 METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { label: 'Total Clients', value: stats.total, icon: Users, color: '#6366f1' },
          { label: 'VIP Partners', value: stats.highValue, icon: Star, color: '#f59e0b' },
          { label: 'Avg Revenue', value: `₹${Math.round(stats.avgSpent).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
          { label: 'Weddings', value: clients.filter(c => c.category === 'Wedding').length, icon: CreditCard, color: '#f97316' },
        ].map((card, idx) => (
          <div key={idx} style={{ background: theme.card, padding: '20px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ background: `${card.color}15`, color: card.color, padding: '10px', borderRadius: '12px' }}>
              <card.icon size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{card.label}</p>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '900', color: theme.text }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 SEARCH & ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} color={theme.muted} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" placeholder="Search name, email, phone..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ width: '100%', padding: '12px 20px 12px 48px', borderRadius: '18px', border: '1px solid ' + theme.border, outline: 'none', background: theme.inputBg, color: theme.text, fontSize: '14px', fontWeight: '600' }} 
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, background: theme.card, color: theme.muted, fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
        <button onClick={() => openModal()} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(249, 115, 22, 0.2)', fontSize: '14px' }}>
          <UserPlus size={18} strokeWidth={3} /> Register Client
        </button>
      </div>

      {/* 💼 CLIENT TABLE */}
      <div style={{ background: theme.card, borderRadius: '28px', border: '1px solid ' + theme.border, padding: '10px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '900', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 24px' }}>IDENTITY</th>
              <th>CATEGORY</th>
              <th>PROJECT REVENUE</th>
              <th>PROJECT DATES</th>
              <th>STAGE</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>LOGISTICS ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => {
              const clientStats = getClientStats(client.name);
              return (
                <tr key={client.id || Math.random()} style={{ background: isDarkMode ? theme.bg : '#fff' }}>
                  <td style={{ padding: '12px 20px', verticalAlign: 'middle', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: isDarkMode ? '#1e293b' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: '#f97316', border: '1px solid ' + theme.border }}>
                        {(client.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: theme.text }}>{client.name || 'Unnamed Client'}</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                           <span style={{ fontSize: '11px', color: theme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} /> {client.email || 'N/A'}</span>
                           <span style={{ fontSize: '11px', color: theme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {client.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span style={{ 
                      padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900',
                      background: client.category === 'Wedding' ? '#f9731620' : (client.category === 'Pre Wedding' ? '#10b98120' : '#3b82f620'),
                      color: client.category === 'Wedding' ? '#f97316' : (client.category === 'Pre Wedding' ? '#10b981' : '#3b82f6'),
                      border: `1px solid ${client.category === 'Wedding' ? '#f9731640' : (client.category === 'Pre Wedding' ? '#10b98140' : '#3b82f640')}`
                    }}>
                      {(client.category || 'OTHER').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>₹{clientStats.spent.toLocaleString()}</span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '13px', fontWeight: '800', color: theme.text }}>{clientStats.count} Projects</span>
                       {clientStats.count === 1 ? (
                         <span style={{ fontSize: '10.5px', color: theme.muted, fontWeight: '700', letterSpacing: '0.02em', marginTop: '4px' }}>
                           {(() => {
                             const inv = clientStats.invoices[0];
                             const p = projects?.find(cp => inv.items?.some(i => i.description === cp.title)) || projects?.find(cp => cp.client === client.name);
                             
                             if (p?.shootCustomDates !== undefined) return p.shootCustomDates;
                             
                             if (p?.date) {
                               try {
                                 const start = new Date(p.date);
                                 if (isNaN(start.getTime())) return `Start (${formatDateStr(inv.date)})`;
                                 const d = parseInt(p.daysOfProgram) || 1;
                                 if (d > 1) {
                                   const monthInfo = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                                   let daysArray = [];
                                   for(let i = 0; i < d; i++) {
                                     const current = new Date(start);
                                     current.setDate(start.getDate() + i);
                                     daysArray.push(current.getDate());
                                   }
                                   return `Shoot: ${daysArray.join('/')} ${monthInfo}`;
                                 }
                               } catch(e) {}
                             }
                             return `Start (${formatDateStr(inv.date)})`;
                           })()}
                         </span>
                       ) : clientStats.firstDate ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                           <span style={{ fontSize: '10.5px', color: theme.muted, fontWeight: '700', letterSpacing: '0.02em' }}>
                             Start ({formatDateStr(clientStats.firstDate)})
                           </span>
                           {clientStats.firstDate !== clientStats.lastDate && (
                             <span style={{ fontSize: '10.5px', color: theme.muted, fontWeight: '700', letterSpacing: '0.02em' }}>
                               End ({formatDateStr(clientStats.lastDate)})
                             </span>
                           )}
                         </div>
                       ) : (
                         <span style={{ fontSize: '10.5px', color: theme.muted, marginTop: '2px' }}>No shoots yet</span>
                       )}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                     <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '10.5px', 
                        fontWeight: '900',
                        color: theme.muted,
                        border: '1px solid ' + theme.border,
                        background: isDarkMode ? '#1e293b50' : '#f8fafc',
                        display: 'inline-block'
                     }}>
                       {(() => {
                         const latestProject = projects.filter(p => p.clientName === client.name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                         if (!latestProject) return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.muted }} /> <span>NO PROJECT</span></div>;
                         if (latestProject.status === 'Delivered') return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> <span style={{ color: '#10b981', fontWeight: '900' }}>Completed</span></div>;
                         if (latestProject.status === 'Editing') return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} /> <span style={{ color: '#6366f1', fontWeight: '900' }}>Video Editing / Album</span></div>;
                         if (latestProject.status === 'Data Status') return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)' }} /> <span style={{ color: '#f59e0b', fontWeight: '900' }}>Data Status</span></div>;
                         return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)' }} /> <span style={{ color: '#f97316', fontWeight: '900' }}>Team Assigned</span></div>;
                       })()}
                     </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '20px', verticalAlign: 'middle', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                       <button 
                         onClick={() => onViewDetails && onViewDetails(client)}
                         style={{ border: '1px solid #6366f140', background: '#6366f110', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                         title="Open Logistics Analyzer"
                         onMouseOver={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                         onMouseOut={(e) => { e.currentTarget.style.background = '#6366f110'; e.currentTarget.style.color = '#6366f1'; }}
                       >
                         <ExternalLink size={14} strokeWidth={2.5} />
                       </button>
                       <button onClick={() => openModal(client)} style={{ border: 'none', background: theme.card, padding: '8px', borderRadius: '10px', cursor: 'pointer', color: theme.muted, border: '1px solid ' + theme.border }}><Edit2 size={14} /></button>
                       <button onClick={() => deleteClient(client.id)} style={{ border: 'none', background: isDarkMode ? '#ef444420' : '#fef2f2', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', border: '1px solid ' + (isDarkMode ? '#ef444440' : '#fee2e2') }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 💎 CLIENT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '24px' }}>
          <div style={{ background: theme.card, width: '100%', maxWidth: '650px', padding: '50px', borderRadius: '44px', position: 'relative', overflowY: 'auto', maxHeight: '90vh', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', animation: 'modalScale 0.35s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid ' + theme.border }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '32px', right: '32px', border: 'none', background: theme.bg, padding: '12px', borderRadius: '18px', cursor: 'pointer', color: theme.muted }}><X size={26} /></button>
            
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
               <h2 style={{ fontSize: '30px', fontWeight: '900', color: theme.text, margin: '0 0 10px 0' }}>{editingClient ? 'Edit Client Profile' : 'Register New Partner'}</h2>
               <p style={{ color: theme.muted, fontSize: '16px', fontWeight: '500' }}>Manage key contact details and partnership status</p>
            </div>

            <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>FULL NAME</label>
                   <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '15px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="e.g. Rahul Sharma" />
                 </div>
                  <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>SHOOT CATEGORY</label>
                   <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '15px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text, fontWeight: '700', outline: 'none' }}>
                     <option value="Maternity Shoot">Maternity Shoot</option>
                     <option value="Wedding">Wedding</option>
                     <option value="Pre Wedding">Pre Wedding</option>
                   </select>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>EMAIL ADDRESS</label>
                   <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '15px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="client@example.com" />
                 </div>
                 <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>MOBILE NUMBER</label>
                   <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '15px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="+91 12345 67890" />
                 </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>RESIDENTIAL ADDRESS</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '15px 18px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="Door No, Street, City, Pincode" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '10px' }}>PRIVATE NOTES</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', padding: '18px', borderRadius: '18px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '600', resize: 'none' }} placeholder="Special requests, style preferences, etc." />
              </div>

              <button type="submit" style={{ background: '#f97316', color: '#fff', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)' }}>
                {editingClient ? 'Finalize Profile Update' : 'Initialize Client Partnership'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Clients;
