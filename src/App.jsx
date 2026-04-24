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
      // Map API fields to frontend if needed
      const mapped = data.map(inv => ({
        ...inv,
        number: inv.invoice_number,
        date: inv.invoice_date,
        total: inv.total_amount,
        amountPaid: inv.paid_amount,
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
      }));
      setSavedInvoices(mapped);
    } catch (err) {
      console.error('History Fetch Error:', err);
      setSavedInvoices(JSON.parse(localStorage.getItem('invoice_history') || '[]'));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem('studio_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSaveInvoice = async () => {
    if (invoice.items.length > 0) {
      try {
        // 1. Calculate required values
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
          items: invoice.items.map(i => ({
             ...i,
             description: i.name ? `${i.name}\n${i.description}`.trim() : i.description
          }))
        };

        // 2. Save to Database
        const response = await fetch(`${API_URL}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           throw new Error('Database Error');
        }

        fetchHistory();
        alert('Invoice successfully saved to Database!');
      } catch (err) {
        alert('Save failed');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', marginBottom: '40px' }}>
            <div style={{ background: '#f97316', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '16px' }}>M</div>
            <span style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>Mboard</span>
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
              Welcome Back, {user?.username || 'Studio Member'}
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
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#111827' }}>
                  {user?.username || 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} />}
          {currentPage === 'history' && (
            <HistoryPage 
              isDarkMode={isDarkMode}
              savedInvoices={savedInvoices} 
              onEdit={(inv) => { setInvoice(inv); setCurrentPage('invoice'); }} 
              onDelete={(id) => {
                const updated = savedInvoices.filter(inv => inv.id !== id);
                localStorage.setItem('invoice_history', JSON.stringify(updated));
                setSavedInvoices(updated);
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
          { currentPage === 'project-completed' && (
            <ProjectCompleted 
              isDarkMode={isDarkMode} 
              onOpenAnalysis={(clientName) => {
                const clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
                const client = clients.find(c => c.name === clientName);
                if (client) {
                  setSelectedClient(client);
                  setCurrentPage('client-details');
                }
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
        </div>
      </div>
    </div>
  );
};

export default App;
