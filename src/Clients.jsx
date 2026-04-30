import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Mail, Phone, Calendar, 
  DollarSign, Trash2, Edit2, X, Star, CreditCard,
  MessageCircle, ExternalLink, ChevronRight, Filter, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Clients = ({ isDarkMode, onViewDetails }) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
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

  const deleteClient = async (id) => {
    if (window.confirm('Delete client?')) {
      try {
        await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) { alert('Delete failed'); }
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
      const searchMatch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.phone || '').includes(searchQuery);

      if (!isCompleted && searchMatch) {
        if (!uniqueMap.has(c.name) || (c.phone && !uniqueMap.get(c.name).phone)) {
          uniqueMap.set(c.name, c);
        }
      }
    });
    return Array.from(uniqueMap.values());
  }, [clients, projects, searchQuery]);

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
    <div style={{ padding: '24px 0', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { label: 'Total Clients', value: clients.length, icon: Users, color: '#6366f1' },
          { label: 'VIP Partners', value: clients.filter(c => getClientStats(c.name).spent > 100000).length, icon: Star, color: '#f59e0b' },
          { label: 'Avg Revenue', value: `₹${Math.round(clients.length ? (clients.reduce((sum, c) => sum + getClientStats(c.name).spent, 0) / clients.length) : 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
          { label: 'Weddings', value: clients.filter(c => c.category === 'Wedding').length, icon: CreditCard, color: '#f97316' },
        ].map((card, idx) => (
          <div key={idx} style={{ background: theme.card, padding: '20px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: `${card.color}15`, color: card.color, padding: '10px', borderRadius: '12px' }}><card.icon size={20} /></div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: theme.muted }}>{card.label}</p>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '900', color: theme.text }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color={theme.muted} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 20px 12px 48px', borderRadius: '18px', border: '1px solid ' + theme.border, background: theme.inputBg, color: theme.text, fontSize: '14px', fontWeight: '600' }} />
        </div>
        <button onClick={() => openModal()} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}><UserPlus size={18} /> Register Client</button>
      </div>

      <div style={{ background: theme.card, borderRadius: '28px', border: '1px solid ' + theme.border, overflow: 'hidden' }}>
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
          <tbody>
            {filteredClients.map(client => {
              const stats = getClientStats(client.name);
              return (
                <tr key={client.id} style={{ borderTop: '1px solid ' + theme.border }}>
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
    </div>
  );
};

export default Clients;
