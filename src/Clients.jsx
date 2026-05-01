import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Mail, Phone, Calendar, 
  DollarSign, Trash2, Edit2, X, Star, CreditCard,
  MessageCircle, ExternalLink, ChevronRight, Filter, RefreshCw, Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, isDarkMode }) => {
  if (!isOpen) return null;
  const theme = {
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#111',
    muted: isDarkMode ? '#94a3b8' : '#666',
    border: isDarkMode ? '#334155' : '#f1f5f9',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ background: theme.card, borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', textAlign: 'center', position: 'relative', border: '1px solid ' + theme.border, animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button onClick={onCancel} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        <div style={{ background: isDarkMode ? '#dc262620' : '#fee2e2', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={24} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.text, margin: '0 0 12px 0' }}>{title}</h3>
        <p style={{ fontSize: '15px', color: theme.muted, margin: '0 0 28px 0', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '14px', background: isDarkMode ? '#334155' : '#f3f4f6', color: theme.text, border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const Clients = ({ isDarkMode, onViewDetails, searchQuery: globalSearchQuery }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff',
    primary: '#f97316'
  };

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    category: 'Wedding', 
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cRes, iRes, pRes] = await Promise.all([
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/invoices`),
        fetch(`${API_URL}/all-projects`)
      ]);
      
      const cData = await cRes.json();
      if (Array.isArray(cData)) setClients(cData);

      const iData = await iRes.json();
      if (Array.isArray(iData)) setInvoices(iData);

      const pData = await pRes.json();
      if (Array.isArray(pData)) setProjects(pData);
    } catch (err) {
      console.error('Data Load Error:', err);
      setClients(JSON.parse(localStorage.getItem('studio_clients') || '[]'));
      setInvoices(JSON.parse(localStorage.getItem('invoice_history') || '[]'));
      setProjects(JSON.parse(localStorage.getItem('studio_projects') || '[]'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      // Use name as fallback if ID is missing (for legacy or auto-generated clients)
      const clientId = editingClient?.id || editingClient?.name;
      const url = editingClient ? `${API_URL}/clients/${clientId}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server Error');
      }

      fetchData();
      closeModal();
    } catch (err) { 
      console.error('Update Error:', err);
      alert('Update failed: ' + err.message); 
    }
  };

  const deleteClient = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    try {
      await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
      fetchData();
      setConfirmDelete({ isOpen: false, id: null });
    } catch (err) { 
      alert('Delete failed'); 
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ ...client });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '', category: 'Wedding' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const getClientStats = (clientName) => {
    const clientInvoices = invoices.filter(inv => inv.client?.name === clientName);
    const totalSpent = clientInvoices.reduce((sum, inv) => {
      const total = inv.items?.reduce((s, item) => s + (item.rate * item.qty), 0) || 0;
      return sum + total;
    }, 0);
    return { count: clientInvoices.length, spent: totalSpent, invoices: clientInvoices };
  };

  const formatDateStr = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.valueOf())) return dateString;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch(e) { return dateString; }
  };

  const filteredClients = useMemo(() => {
    const uniqueMap = new Map();
    clients.forEach(c => {
      if (!c.name) return;
      const latestProject = projects.filter(p => p.clientName === c.name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const isCompleted = latestProject && latestProject.status === 'Delivered';
      
      const query = (globalSearchQuery || '').toLowerCase();
      const searchMatch = (c.name || '').toLowerCase().includes(query) ||
                         (c.email || '').toLowerCase().includes(query) ||
                         (c.phone || '').includes(query);

      if (!isCompleted && searchMatch) {
        if (!uniqueMap.has(c.name) || (c.phone && !uniqueMap.get(c.name).phone)) {
          uniqueMap.set(c.name, c);
        }
      }
    });
    return Array.from(uniqueMap.values());
  }, [clients, projects, globalSearchQuery]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: theme.muted }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Loading Clients Data...</span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '28px', animation: 'clientFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        isDarkMode={isDarkMode}
        title="Delete Client?"
        message="Are you sure you want to delete this client? This action cannot be undone."
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
      />
      <style>{`
        @keyframes clientFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowEntrance {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .client-card { animation: kpiEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .client-row { animation: rowEntrance 0.5s ease both; }
        .client-row:hover { background: ${isDarkMode ? '#3d4b5f' : '#f8fafc'} !important; transform: scale(1.002); }
        @keyframes kpiEntrance {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="stagger-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { label: 'Total Clients', value: filteredClients.length, icon: Users, color: '#6366f1' },
          { label: 'Total Revenue', value: `₹${filteredClients.reduce((sum, c) => sum + getClientStats(c.name).spent, 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
          { label: 'Net Studio Margin', value: `₹${(filteredClients.reduce((sum, c) => sum + getClientStats(c.name).spent, 0) - projects.reduce((sum, p) => sum + (Number(p.editorPrice) || 0), 0)).toLocaleString()}`, icon: Award, color: '#f59e0b' },
        ].map((card, idx) => (
          <div key={idx} className="client-card hover-lift" style={{ animationDelay: `${idx * 0.1}s`, background: theme.card, padding: '20px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ background: `${card.color}15`, color: card.color, padding: '10px', borderRadius: '12px' }}><card.icon size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: theme.muted }}>{card.label}</p>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '900', color: theme.text }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button onClick={() => openModal()} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><UserPlus size={18} /> Register Client</button>
      </div>

      <div className="hover-lift" style={{ background: theme.card, borderRadius: '28px', border: '1px solid ' + theme.border, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '900' }}>
              <th style={{ padding: '20px 24px' }}>IDENTITY</th>
              <th>CATEGORY</th>
              <th>REVENUE</th>
              <th>PROJECTS</th>
              <th>STAGE</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACCESS</th>
            </tr>
          </thead>
          <tbody className="stagger-list">
            {filteredClients.map((client, idx) => {
              const stats = getClientStats(client.name);
              return (
                <tr key={client.id} className="client-row" style={{ borderTop: '1px solid ' + theme.border, transition: '0.3s', animationDelay: `${0.3 + (idx * 0.05)}s` }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: '900' }}>{client.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '800', color: theme.text }}>{client.name}</div>
                        <div style={{ fontSize: '11px', color: theme.muted }}>{client.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', background: theme.primary + '10', color: theme.primary }}>{(client.category || 'Other').toUpperCase()}</span>
                  </td>
                  <td style={{ fontWeight: '900', color: theme.primary }}>₹{stats.spent.toLocaleString()}</td>
                  <td style={{ fontWeight: '700', color: theme.text }}>{stats.count} Projects</td>
                  <td>
                    {(() => {
                      const lp = projects.filter(p => p.clientName === client.name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                      return <span style={{ fontSize: '11px', fontWeight: '800', color: lp ? theme.primary : theme.muted }}>{lp ? lp.status : 'No Projects'}</span>;
                    })()}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => onViewDetails(client)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.primary }}><ExternalLink size={14} /></button>
                      <button onClick={() => openModal(client)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.muted }}><Edit2 size={14} /></button>
                      <button onClick={() => deleteClient(client.id)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #ef444440', background: '#ef444410', color: '#ef4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: theme.card, width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'transparent', color: theme.muted }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px' }}>{editingClient ? 'Edit Client' : 'Add Client'}</h2>
            <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', marginBottom: '8px', display: 'block' }}>FULL NAME</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '900', marginBottom: '8px', display: 'block' }}>CATEGORY</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text }}>
                  <option value="Wedding">Wedding</option>
                  <option value="Pre Wedding">Pre Wedding</option>
                  <option value="Maternity Shoot">Maternity Shoot</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '900', marginBottom: '8px', display: 'block' }}>EMAIL</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '900', marginBottom: '8px', display: 'block' }}>PHONE</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text }} />
                </div>
              </div>
              <button type="submit" style={{ background: theme.primary, color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>{editingClient ? 'Update Profile' : 'Register Client'}</button>
            </form>
          </div>
        </div>
      )}
      {/* HIDDEN PRINT REPORT FOR CLIENTS PDF DOWNLOAD */}
      <div id="clients-report-root" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="clients-report-content" style={{ width: '1000px', padding: '40px', background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f3f4f6', paddingBottom: '24px', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#111827', letterSpacing: '-0.02em' }}>Client Management Analysis</h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Results</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '900', color: '#f97316' }}>{filteredClients.length} Profiles</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Total Clients</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900' }}>{filteredClients.length}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>VIP Partners</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#6366f1' }}>{filteredClients.filter(c => getClientStats(c.name).spent > 100000).length}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Avg Revenue</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₹{Math.round(filteredClients.length ? (filteredClients.reduce((sum, c) => sum + getClientStats(c.name).spent, 0) / filteredClients.length) : 0).toLocaleString()}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Weddings</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#f97316' }}>{filteredClients.filter(c => c.category === 'Wedding').length}</h2>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #f97316', paddingLeft: '12px' }}>Client Registry Details</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>IDENTITY & CONTACT</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>CATEGORY</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>REVENUE</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>PROJECTS</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>STAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, i) => {
                const stats = getClientStats(client.name);
                const lp = projects.filter(p => p.clientName === client.name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                return (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{client.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{client.phone || 'No Phone'}</div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{(client.category || 'Other').toUpperCase()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '800', color: '#10b981' }}>₹{stats.spent.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{stats.count} Projects</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '700', color: lp ? '#f97316' : '#9ca3af' }}>{lp ? lp.status : 'N/A'}</td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidential Client Report • Surya Studioz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
