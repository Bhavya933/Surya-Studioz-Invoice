import { useState } from 'react';
import { ArrowLeft, Search, FileText, IndianRupee, Users, Trash2, ExternalLink, AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onConfirm, onCancel, invoiceNumber, isDarkMode }) => {
  if (!isOpen) return null;
  const theme = {
    card: isDarkMode ? '#1e293b' : '#fff',
    text: isDarkMode ? '#f8fafc' : '#111',
    muted: isDarkMode ? '#94a3b8' : '#666',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    bg: isDarkMode ? '#0f172a' : '#f3f4f6'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: theme.card, borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', textAlign: 'center', position: 'relative', border: '1px solid ' + theme.border }}>
        <button onClick={onCancel} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        <div style={{ background: isDarkMode ? '#dc262620' : '#fee2e2', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={24} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.text, margin: '0 0 12px 0' }}>Delete Invoice?</h3>
        <p style={{ fontSize: '15px', color: theme.muted, margin: '0 0 28px 0', lineHeight: '1.5' }}>
          Are you sure you want to delete invoice <span style={{ fontWeight: 'bold', color: theme.text }}>{invoiceNumber}</span>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f3f4f6', color: theme.text, border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = ({ savedInvoices, onEdit, onDelete, onBack, isDarkMode, searchQuery: globalSearchQuery }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#111111',
    muted: isDarkMode ? '#94a3b8' : '#666666',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };
  const [localSearch, setLocalSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unique'
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, number: '' });

  // Get unique clients by taking the latest invoice for each
  const uniqueInvoices = Array.from(
    savedInvoices.reduce((map, inv) => {
      const name = inv.client?.name || 'Untitled';
      if (!map.has(name)) map.set(name, inv);
      return map;
    }, new Map()).values()
  );

  const baseList = filterMode === 'unique' ? uniqueInvoices : savedInvoices;

  const filtered = baseList.filter((inv) => {
    const q = (globalSearchQuery || localSearch).toLowerCase();
    return (
      (inv.client?.name || '').toLowerCase().includes(q) ||
      (inv.number || '').toLowerCase().includes(q) ||
      (inv.date || '').includes(q)
    );
  });

  const totalRevenue = savedInvoices.reduce((sum, inv) => {
    const sub = (inv.items || []).reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.qty) || 0), 0);
    const tax = sub * ((inv.taxRate || 0) / 100);
    const total = sub + tax;
    return sum + (total - (parseFloat(inv.amountPaid) || 0));
  }, 0);

  const uniqueCount = uniqueInvoices.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ConfirmModal 
        isDarkMode={isDarkMode}
        isOpen={confirmDelete.isOpen} 
        invoiceNumber={confirmDelete.number}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, number: '' })}
        onConfirm={() => {
          onDelete(confirmDelete.id);
          setConfirmDelete({ isOpen: false, id: null, number: '' });
        }}
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div 
          onClick={() => setFilterMode('all')}
          style={{ 
            background: theme.card, borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: filterMode === 'all' ? '2px solid #6366f1' : '1px solid ' + theme.border, transition: 'all 0.2s'
          }}
        >
          <div style={{ background: isDarkMode ? '#6366f120' : '#eef2ff', borderRadius: '10px', padding: '12px' }}><FileText size={22} color="#6366f1" /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: theme.text }}>{savedInvoices.length}</div>
            <div style={{ fontSize: '13px', color: theme.muted }}>Total Invoices</div>
          </div>
        </div>
        <div style={{ background: theme.card, borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid ' + theme.border }}>
          <div style={{ background: isDarkMode ? '#10b98120' : '#f0fdf4', borderRadius: '10px', padding: '12px' }}><IndianRupee size={22} color="#10b981" /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: theme.text }}>₹{totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: theme.muted }}>Total Balance Due</div>
          </div>
        </div>
        <div 
          onClick={() => setFilterMode('unique')}
          style={{ 
            background: theme.card, borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: filterMode === 'unique' ? '2px solid #f97316' : '1px solid ' + theme.border, transition: 'all 0.2s'
          }}
        >
          <div style={{ background: isDarkMode ? '#f9731620' : '#fff7ed', borderRadius: '10px', padding: '12px' }}><Users size={22} color="#f97316" /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: theme.text }}>{uniqueCount}</div>
            <div style={{ fontSize: '13px', color: theme.muted }}>Unique Clients</div>
          </div>
        </div>
      </div>

        {/* Search */}
        <div style={{ background: theme.card, borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid ' + theme.border }}>
          <Search size={17} color={theme.muted} />
          <input
            type="text"
            placeholder="Search by client name, invoice no. or date..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '14px', color: theme.text, flex: 1, background: 'transparent' }}
          />
        </div>

        {/* Table */}
        <div style={{ background: theme.card, borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid ' + theme.border }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: isDarkMode ? '#1e293b' : '#f9fafb', borderBottom: '2px solid ' + theme.border }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px', width: '48px' }}>SN</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Client Details</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Invoice No.</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total Amount</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Balance Due</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.6px', width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '80px 20px', textAlign: 'center', color: theme.muted }}>
                    <div style={{ marginBottom: '12px' }}><FileText size={48} color={isDarkMode ? '#475569' : '#eee'} style={{ margin: '0 auto' }} /></div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>No invoices found</div>
                    <div style={{ fontSize: '14px' }}>Try adjusting your search or create a new invoice.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((inv, index) => {
                  const sub = (inv.items || []).reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.qty) || 0), 0);
                  const tax = sub * ((inv.taxRate || 0) / 100);
                  const total = sub + tax;
                  const balance = total - (parseFloat(inv.amountPaid) || 0);
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid ' + theme.border, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? '#1e293b' : '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: theme.muted }}>{index + 1}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{inv.client?.name || 'Untitled Client'}</div>
                        {inv.client?.phone && <div style={{ fontSize: '12px', color: theme.muted, marginTop: '2px' }}>{inv.client.phone}</div>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: isDarkMode ? '#6366f120' : '#eef2ff', color: '#6366f1', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: '600' }}>{inv.number}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: theme.muted }}>{inv.date}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: theme.text }}>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: balance > 0 ? '#dc2626' : '#16a34a' }}>₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => onEdit(inv)}
                            title="Edit Invoice"
                            style={{ background: isDarkMode ? '#f97316' : '#111', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ExternalLink size={14} /> Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ isOpen: true, id: inv.id, number: inv.number })}
                            title="Delete Invoice"
                            style={{ background: theme.card, color: '#dc2626', border: '1px solid ' + (isDarkMode ? '#dc262640' : '#fee2e2'), borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      {/* HIDDEN PRINT REPORT FOR HISTORY PDF DOWNLOAD */}
      <div id="history-report-root" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="history-report-content" style={{ width: '1000px', padding: '40px', background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f3f4f6', paddingBottom: '24px', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#111827', letterSpacing: '-0.02em' }}>Invoice History & Receivables</h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Mode</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '900', color: '#f97316' }}>{filterMode.toUpperCase()}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Total Invoices</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900' }}>{savedInvoices.length}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Total Balance Due</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₹{totalRevenue.toLocaleString()}</h2>
            </div>
            <div style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>Unique Clients</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#6366f1' }}>{uniqueCount}</h2>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px', borderLeft: '4px solid #f97316', paddingLeft: '12px' }}>Billing Registry Details</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>SN</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>CLIENT NAME</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>INV NO.</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>DATE</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>TOTAL</th>
                <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '800' }}>DUE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => {
                const sub = (inv.items || []).reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.qty) || 0), 0);
                const tax = sub * ((inv.taxRate || 0) / 100);
                const total = sub + tax;
                const due = total - (parseFloat(inv.amountPaid) || 0);
                return (
                  <tr key={idx}>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700' }}>{inv.client?.name || 'Untitled'}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{inv.number}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '12px' }}>{inv.date}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>₹{total.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700', color: due > 0 ? '#ef4444' : '#10b981' }}>₹{due.toLocaleString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial History Report • Surya Studioz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
