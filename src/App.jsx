import React, { useState, useEffect, useRef } from 'react';
import NewInvoice from './NewInvoice';
import HistoryPage from './History';
import Dashboard from './Dashboard';
import StudioTeam from './studioteam';
import Notes from './Notes';
import Clients from './Clients';
import ClientDetails from './ClientDetails';
import ClientsProject from './Clients Project';
import ProjectCompleted from './ProjectCompleted';
import Login from './Login';
import html2pdf from 'html2pdf.js';
import { 
  LayoutGrid, ShoppingBag, Users, ShoppingCart, Settings, 
  HelpCircle, MessageSquare, LogOut, Search, Bell, ChevronDown, 
  Plus, DollarSign, Download, Sun, Moon
} from 'lucide-react';
import logo from './assets/logo.png';

// 🔴 Error Boundary Component to catch crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '20px', margin: '20px', color: '#991b1b', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Something went wrong.</h1>
          <p style={{ fontWeight: '600', marginTop: '10px' }}>Error Details: {this.state.error?.toString()}</p>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>Please show this message to the developer.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DEFAULT_COMPANY = {
  name: 'Surya Studio',
  address: 'Flat no A-423\nUnnati Nilay Sirsi road Jaipur 302012',
  phone: '9660299920',
  email: 'info@suryastudioz.com',
  gstin: '-----------------',
};

const EMPTY_ITEM = { name: '', description: '', rate: 0, qty: 1 };

const SidebarItem = ({ icon: Icon, label, active, hasDropdown, onClick, onSubItemClick, subItems = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div 
        onClick={() => {
          onClick();
          if (hasDropdown) setIsOpen(!isOpen);
        }}
        className="sidebar-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          margin: '2px 14px',
          borderRadius: '12px',
          cursor: 'pointer',
          background: active ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
          color: active ? '#fff' : '#9ca3af',
          transition: 'all 0.3s ease'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon size={18} color={active ? '#f97316' : '#9ca3af'} />
          <span style={{ fontWeight: active ? '600' : '400', fontSize: '14px' }}>{label}</span>
        </div>
        {hasDropdown && <ChevronDown size={14} color={active ? '#f97316' : '#4b5563'} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />}
      </div>
      {hasDropdown && isOpen && (
        <div style={{ marginLeft: '48px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subItems.map((sub, idx) => (
            <div 
              key={idx} 
              onClick={(e) => {
                e.stopPropagation();
                onSubItemClick(sub);
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
              style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer', padding: '4px 0', transition: '0.2s' }}
            >
              {sub}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [invoice, setInvoice] = useState({
    id: Date.now().toString(),
    number: '#INV-1118',
    date: new Date().toISOString().split('T')[0],
    dueDate: 'On Receipt',
    client: { id: `c-${Date.now()}`, name: '', address: '', phone: '', email: '', gstin: '' },
    items: [{ ...EMPTY_ITEM }],
    taxRate: 0,
    amountPaid: 0,
    deliverables: [
      'Wedding QR Code (Instant Digital Photo Access)',
      'Professionally Edited Wedding Reel',
      'High-Quality Edited Candid Photos (Couple Focused)',
      'Total Raw Data Google Drive',
    ],
    terms: [
      'Payment Terms & Conditions',
      '30% Advance at the time of booking confirmation',
      '60% Payment on wedding completion / event day completion',
      '10% Balance payable at the time of final delivery',
    ],
  });

  const [company, setCompany] = useState({ ...DEFAULT_COMPANY });
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'invoice' | 'history' | 'dashboard'
  const [selectedClient, setSelectedClient] = useState(null);
  
  // 🔐 Authentication State
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('studio_theme') === 'dark';
  });
  const invoiceRef = useRef();

  // Check for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('studio_token');
    const savedUser = localStorage.getItem('studio_user');
    
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsAppLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('studio_token');
    localStorage.removeItem('studio_user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices`);
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.warn('API did not return an array for invoices:', data);
        setSavedInvoices(JSON.parse(localStorage.getItem('invoice_history') || '[]'));
        return;
      }

      // Map API fields to frontend if needed
      const mapped = data.map(inv => {
        // Format date safely
        let formattedDate = '';
        try {
            const dStr = inv.invoice_date || inv.date;
            if (dStr) {
                const d = new Date(dStr);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toISOString().split('T')[0];
                }
            }
        } catch (e) {
            console.warn('Date parsing error for invoice:', inv.id, e);
        }

        return {
          ...inv,
          number: inv.invoice_number,
          date: formattedDate || inv.invoice_date,
          amountPaid: inv.paid_amount,
          terms: inv.notes ? inv.notes.split('\n') : [
            'Payment Terms & Conditions',
            '30% Advance at the time of booking confirmation',
            '60% Payment on wedding completion / event day completion',
            '10% Balance payable at the time of final delivery',
          ],
          deliverables: inv.deliverables ? inv.deliverables.split('\n') : [
            'Wedding QR Code (Instant Digital Photo Access)',
            'Professionally Edited Wedding Reel',
            'High-Quality Edited Candid Photos (Couple Focused)',
            'Total Raw Data Google Drive',
          ],
          items: (inv.items || []).map(item => {
             let n = '';
             let d = item.description || '';
             const parts = d.split('\n');
             if (parts.length > 1) { 
                 n = parts[0];
                 d = parts.slice(1).join('\n');
             } else {
                 n = d;
                 d = '';
             }
             return { ...item, name: n, description: d };
          })
        };
      });
      setSavedInvoices(mapped);
    } catch (err) {
      console.error('History Fetch Error:', err);
      setSavedInvoices(JSON.parse(localStorage.getItem('invoice_history') || '[]'));
    }
  };

  useEffect(() => {
    fetchHistory().then(() => {
      // If we are on the dashboard/new invoice and haven't started typing, 
      // update to the next available number
      if (savedInvoices.length > 0 && invoice.number === '#INV-1118') {
        const numbers = savedInvoices.map(inv => {
          const match = inv.number?.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        });
        const maxNum = Math.max(...numbers);
        if (maxNum > 0) {
          setInvoice(prev => ({ ...prev, number: `#INV-${maxNum + 1}` }));
        }
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('studio_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSaveInvoice = async () => {
    if (invoice.items.length > 0) {
      try {
        const subtotal = invoice.items.reduce((sum, item) => sum + (item.rate * item.qty), 0);
        const taxAmount = (subtotal * invoice.taxRate) / 100;
        const totalAmount = subtotal + taxAmount;
        
        const payload = {
          ...invoice,
          total: totalAmount,
          tax: taxAmount,
          discount: 0,
          paidAmount: invoice.amountPaid || 0,
          status: (invoice.amountPaid >= totalAmount && totalAmount > 0) ? 'Paid' : (invoice.amountPaid > 0 ? 'Partial' : 'Unpaid'),
          notes: invoice.terms?.join('\n') || '',
          deliverables: invoice.deliverables?.join('\n') || '',
          items: invoice.items.map(i => ({
             ...i,
             description: i.name ? `${i.name}\n${i.description}`.trim() : i.description
          }))
        };

        // Determine if this is an edit or new invoice
        // Database IDs are numbers or small numeric strings, 
        // while new local IDs are large timestamp strings.
        const isEdit = invoice.id && (
          typeof invoice.id === 'number' || 
          (typeof invoice.id === 'string' && invoice.id.length < 10)
        );
        
        console.log('Saving invoice:', { id: invoice.id, number: invoice.number, isEdit });

        const url = isEdit ? `${API_URL}/invoices/${invoice.id}` : `${API_URL}/invoices`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
           throw new Error(result.error || 'Database Error');
        }

        // IMPORTANT: Update local invoice state with the new ID from database
        if (!isEdit && result.id) {
          setInvoice(prev => ({ ...prev, id: result.id }));
        }

        fetchHistory();
        alert(isEdit ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
      } catch (err) {
        console.error('Save Error:', err);
        alert('Save failed: ' + err.message);
      }
    }
  };

  const handleNewInvoice = () => {
    let nextNumber = '#INV-1118';
    if (savedInvoices.length > 0) {
      const numbers = savedInvoices.map(inv => {
        const match = inv.number?.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });
      const maxNum = Math.max(...numbers);
      if (maxNum > 0) {
        nextNumber = `#INV-${maxNum + 1}`;
      }
    }

    setInvoice({
      ...invoice,
      id: Date.now().toString(),
      number: nextNumber,
      date: new Date().toISOString().split('T')[0],
      client: { id: `c-${Date.now()}`, name: '', address: '', phone: '', email: '', gstin: '' },
      items: [{ ...EMPTY_ITEM }],
      amountPaid: 0,
    });
    setCurrentPage('invoice');
  };

  useEffect(() => {
    const handleViewDetails = (e) => {
      setSelectedClient(e.detail);
      setCurrentPage('client-details');
    };
    window.addEventListener('view-client-details', handleViewDetails);
    return () => window.removeEventListener('view-client-details', handleViewDetails);
  }, []);

  const downloadPDF = () => {
    const element = invoiceRef.current;
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Invoice_${invoice.number}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const sidebarTabs = [
    { label: 'Overview', icon: LayoutGrid, page: 'dashboard' },
    { label: 'Orders', icon: ShoppingCart, hasDropdown: true, subItems: ['Clients', 'Project Completed'] },
    { label: 'Invoice', icon: DollarSign, hasDropdown: true, subItems: ['New Invoice', 'Invoice History'] },
    { label: 'Studio Team', icon: Users, page: 'studioteam' },
    { label: 'Notes', icon: MessageSquare, page: 'notes' }
  ];

  const bottomTabs = [
    { label: 'Help Centre', icon: HelpCircle },
    { label: 'Contact us', icon: MessageSquare },
    { label: 'Log out', icon: LogOut }
  ];

  const handleSubItemClick = (sub) => {
    if (sub === 'New Invoice') handleNewInvoice();
    else if (sub === 'Invoice History') setCurrentPage('history');
    else if (sub === 'Clients') setCurrentPage('clients');
    else if (sub === 'Project Completed') setCurrentPage('project-completed');
  };

  if (isAppLoading) return null; // Or a splash screen

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="dashboard-outer" style={{ minHeight: '100vh', padding: '16px', background: isDarkMode ? '#0f172a' : '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }}>
      <div className="dashboard-inner-container" style={{ height: '94vh', width: '100%', borderRadius: '32px', overflow: 'hidden', display: 'flex', boxShadow: isDarkMode ? '0 50px 100px -20px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Persistent Sidebar */}
        <div className="dashboard-sidebar" style={{ 
          height: '100%', 
          width: '280px', 
          background: '#1a1c2e', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '30px 0',
          flexShrink: 0 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '40px' }}>
            <img src={logo} alt="Studio Logo" style={{ height: 'auto', width: '180px', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            {sidebarTabs.map((tab) => (
              <SidebarItem 
                key={tab.label} 
                icon={tab.icon} 
                label={tab.label} 
                active={(tab.page && currentPage === tab.page) || (tab.label === 'Invoice' && currentPage === 'invoice') || (tab.label === 'Invoice' && currentPage === 'history')} 
                hasDropdown={tab.hasDropdown}
                subItems={tab.subItems}
                onClick={() => {
                  if (tab.page) setCurrentPage(tab.page);
                  // Parent item only toggles dropdown if it has one, unless it's Overview
                }} 
                onSubItemClick={handleSubItemClick}
              />
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingBottom: '16px' }}>
            {bottomTabs.map(tab => (
              <div 
                key={tab.label} 
                onClick={() => { if (tab.label === 'Log out') handleLogout(); }}
                className="sidebar-item" 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', color: '#9ca3af', cursor: 'pointer' }}
              >
                <tab.icon size={18} />
                <span style={{ fontSize: '14px' }}>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Content Area */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: isDarkMode ? '#1e293b' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0, transition: 'background 0.3s ease' }}>
          
          {/* Global Header — hidden during print */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: isDarkMode ? '#f8fafc' : '#111827', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Welcome Back, {user?.username === 'Rahuljajora@9660' ? 'Rahul Jajora' : (user?.username || 'Studio Member')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{ background: isDarkMode ? '#334155' : '#fff', padding: '8px 16px', borderRadius: '12px', border: '1px solid ' + (isDarkMode ? '#475569' : '#e2e8f0'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: isDarkMode ? '#f97316' : '#64748b', fontWeight: '700', fontSize: '13px' }}
                >
                  {isDarkMode ? <Sun size={16} fill="currentColor" /> : <Moon size={16} />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
                <div style={{ background: isDarkMode ? '#334155' : '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (isDarkMode ? '#475569' : '#e2e8f0'), fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  Last year <ChevronDown size={14} />
                </div>
                <button onClick={downloadPDF} style={{ background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#64748b' }}>
                  <Download size={14} /> Download
                </button>
              </div>
              <Search size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
              <Bell size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: '#f97316', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontSize: '12px', fontWeight: '900' 
                }}>
                  {user?.username === 'Rahuljajora@9660' ? 'R' : (user?.username?.charAt(0).toUpperCase() || 'A')}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#111827' }}>
                  {user?.username === 'Rahuljajora@9660' ? 'Rahul' : (user?.username || 'User')}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          <ErrorBoundary>
            {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} />}
            {currentPage === 'history' && (
              <HistoryPage 
                isDarkMode={isDarkMode}
                savedInvoices={savedInvoices} 
                onEdit={(inv) => { setInvoice(inv); setCurrentPage('invoice'); }} 
                onDelete={async (id) => {
                  if (typeof id === 'number') {
                    try {
                      const response = await fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE' });
                      if (response.ok) fetchHistory();
                    } catch (err) {
                      console.error('Delete error:', err);
                    }
                  } else {
                    const updated = savedInvoices.filter(inv => inv.id !== id);
                    localStorage.setItem('invoice_history', JSON.stringify(updated));
                    setSavedInvoices(updated);
                  }
                }}
                onBack={() => setCurrentPage('dashboard')} 
              />
            )}
            {currentPage === 'invoice' && (
              <NewInvoice 
                isDarkMode={isDarkMode}
                invoice={invoice}
                setInvoice={setInvoice}
                company={company}
                setCompany={setCompany}
                onNewInvoice={handleNewInvoice}
                onSave={handleSaveInvoice}
                onNavigate={setCurrentPage}
                onDownload={downloadPDF}
                invoiceRef={invoiceRef}
              />
            )}
            { currentPage === 'studioteam' && <StudioTeam isDarkMode={isDarkMode} /> }
            { currentPage === 'notes' && <Notes isDarkMode={isDarkMode} /> }
            { currentPage === 'clients' && (
              <Clients 
                isDarkMode={isDarkMode} 
                onViewDetails={(client) => {
                  setSelectedClient(client);
                  setCurrentPage('client-details');
                }}
              />
            )}
            { currentPage === 'client-details' && (
              <ClientDetails 
                isDarkMode={isDarkMode}
                client={selectedClient} 
                onBack={() => setCurrentPage('clients')}
                onNewInvoice={(client) => {
                  setInvoice({
                    ...invoice,
                    id: Date.now().toString(),
                    client: { name: client.name, address: client.address, phone: client.phone, gstin: '' }
                  });
                  setCurrentPage('invoice');
                }}
                onViewInvoice={(inv) => {
                  setInvoice(inv);
                  setCurrentPage('invoice');
                }}
              />
            )}
            { currentPage === 'project-completed' && (
              <ProjectCompleted 
                isDarkMode={isDarkMode} 
                onOpenAnalysis={(clientName) => {
                  const clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
                  let client = clients.find(c => c.name === clientName);
                  
                  // If not found, create a basic client object so the page still opens
                  if (!client) {
                    client = { name: clientName, phone: '', email: '', address: '' };
                  }
                  
                  setSelectedClient(client);
                  setCurrentPage('client-details');
                }}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default App;
