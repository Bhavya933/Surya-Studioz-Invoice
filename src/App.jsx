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
  Plus, DollarSign, Download, Sun, Moon, Globe, X
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
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeRange, setTimeRange] = useState('This month');
  const [projects, setProjects] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
  });
  const invoiceRef = useRef();
  const contentRef = useRef();

  // 🔔 Notification Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/all-projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          
          const newNotifications = [];
          const now = new Date();
          const tenDaysFromNow = new Date();
          tenDaysFromNow.setDate(now.getDate() + 10);

          data.forEach(p => {
            // Skip projects that are already delivered
            if (p.status === 'Delivered') return;

            const eventDate = new Date(p.date || p.event_date);
            const editorDeadline = p.deadlineDate ? new Date(p.deadlineDate) : null;
            const finalDeadline = p.deadline ? new Date(p.deadline) : null;

            // 1. Upcoming Shoot (Next 10 days)
            const diffTime = eventDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 10 && diffDays > 0) {
              newNotifications.push({
                id: `shoot-${p.id}`,
                title: 'Upcoming Shoot',
                message: `${p.clientName || 'Client'}'s shoot in ${diffDays} days!`,
                type: 'warning',
                date: eventDate
              });
            }

            // 2. Editor Deadline Today
            if (editorDeadline && editorDeadline.toDateString() === now.toDateString()) {
              newNotifications.push({
                id: `editor-${p.id}`,
                title: 'Editor Deadline',
                message: `Editing for ${p.clientName} must be finished TODAY!`,
                type: 'danger',
                date: editorDeadline
              });
            }

            // 3. Final Delivery Deadline Today
            if (finalDeadline && finalDeadline.toDateString() === now.toDateString()) {
              newNotifications.push({
                id: `final-${p.id}`,
                title: 'Delivery Today',
                message: `Final delivery for ${p.clientName} is due TODAY!`,
                type: 'danger',
                date: finalDeadline
              });
            }
          });

          setNotifications(newNotifications);
        }
      } catch (err) {
        console.error('Notification check failed:', err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

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
    let element = null;
    let filename = 'Analysis_Report.pdf';
    let orientation = 'portrait';

    if (currentPage === 'invoice' && invoiceRef.current) {
      element = invoiceRef.current;
      filename = `Invoice_${invoice.number}.pdf`;
    } else if (currentPage === 'dashboard') {
      element = document.getElementById('analysis-report-content');
      filename = `Studio_Analysis_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    } else if (currentPage === 'clients') {
      element = document.getElementById('clients-report-content');
      filename = `Client_Registry_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    } else if (currentPage === 'project-completed') {
      element = document.getElementById('archive-report-content');
      filename = `Project_Archive_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    } else if (currentPage === 'history') {
      element = document.getElementById('history-report-content');
      filename = `Invoice_History_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    } else if (currentPage === 'studioteam') {
      element = document.getElementById('team-report-content');
      filename = `Studio_Team_Roster_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    } else if (currentPage === 'notes') {
      element = document.getElementById('notes-report-content');
      filename = `Studio_Notes_${new Date().toLocaleDateString()}.pdf`;
      orientation = 'landscape';
    }

    if (!element) {
      // Fallback to the main content area if the specific report isn't found
      element = contentRef.current;
    }

    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff' // Always white background for the table report
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
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
    { label: 'Visit Website', icon: Globe, href: 'https://suryastudioz.com/' },
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

  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#111827',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#e2e8f0'
  };

  return (
    <div className="dashboard-outer" style={{ minHeight: '100vh', padding: '16px', background: isDarkMode ? '#0f172a' : '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }}>
      <div className="dashboard-inner-container" style={{ height: '94vh', width: '100%', borderRadius: '32px', overflow: 'hidden', display: 'flex', boxShadow: isDarkMode ? '0 50px 100px -20px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Persistent Sidebar */}
        <div className="dashboard-sidebar" data-html2canvas-ignore="true" style={{ 
          height: '100%', 
          width: '280px', 
          background: '#1a1c2e', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '24px 0',
          flexShrink: 0 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '44px', marginBottom: '32px' }}>
            <img src={logo} alt="Studio Logo" style={{ height: 'auto', width: '160px', objectFit: 'contain' }} />
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
                onClick={() => { 
                  if (tab.label === 'Log out') handleLogout(); 
                  if (tab.href) window.open(tab.href, '_blank');
                }}
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
        <div 
          ref={contentRef}
          style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: isDarkMode ? '#1e293b' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0, transition: 'background 0.3s ease' }}
        >
          
          {/* Global Header — hidden during print */}
          <div className="no-print" data-html2canvas-ignore="true" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px', 
            flexShrink: 0,
            gap: '32px',
            height: '44px'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: theme.text, margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Welcome Back, {user?.username === 'Rahuljajora@9660' ? 'Rahul Jajora' : (user?.username || 'Studio Member')}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
                <Search size={18} color={isDarkMode ? '#94a3b8' : '#6b7280'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input 
                  type="text" 
                  placeholder="Search clients, projects..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 15px 12px 48px', 
                    borderRadius: '16px', 
                    border: '1px solid ' + theme.border,
                    background: theme.card,
                    color: theme.text,
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    height: '44px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{ height: '44px', background: theme.card, padding: '0 16px', borderRadius: '14px', border: '1px solid ' + theme.border, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: isDarkMode ? '#f97316' : '#64748b', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}
                >
                  {isDarkMode ? <Sun size={16} fill="currentColor" /> : <Moon size={16} />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
                
                <select 
                  disabled={currentPage !== 'dashboard'}
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ height: '44px', background: theme.card, padding: '0 12px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '13px', cursor: currentPage !== 'dashboard' ? 'not-allowed' : 'pointer', opacity: currentPage !== 'dashboard' ? 0.5 : 1, color: theme.text, fontWeight: '700', outline: 'none' }}
                >
                  <option value="All time">All Time</option>
                  <option value="This month">This Month</option>
                  <option value="Last 6 months">Last 6 Months</option>
                  <option value="Last year">Last Year</option>
                </select>

                {currentPage !== 'invoice' && (
                  <button 
                    disabled={currentPage === 'client-details'}
                    onClick={currentPage === 'client-details' ? undefined : downloadPDF} 
                    style={{ height: '44px', background: theme.card, padding: '0 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '13px', cursor: currentPage === 'client-details' ? 'not-allowed' : 'pointer', opacity: currentPage === 'client-details' ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: theme.text }}
                  >
                    <Download size={14} /> Download
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ cursor: 'pointer', position: 'relative', height: '44px', width: '44px', borderRadius: '14px', background: theme.card, border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                >
                  <Bell size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
                  {notifications.filter(n => !dismissedIds.includes(n.id)).length > 0 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%', border: '2px solid ' + theme.card }} />
                  )}
                </div>

                {showNotifications && (
                  <div style={{ position: 'absolute', top: '55px', right: 0, width: '320px', background: theme.card, borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid ' + theme.border, zIndex: 1000, padding: '20px', animation: 'slideUp 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: theme.text }}>Notifications</h3>
                      {notifications.filter(n => !dismissedIds.includes(n.id)).length > 0 && (
                        <button 
                          onClick={() => setDismissedIds(notifications.map(n => n.id))}
                          style={{ background: 'transparent', border: 'none', color: '#f97316', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.filter(n => !dismissedIds.includes(n.id)).length > 0 ? notifications.filter(n => !dismissedIds.includes(n.id)).map(n => (
                        <div key={n.id} style={{ padding: '14px', borderRadius: '16px', background: theme.bg, borderLeft: '4px solid ' + (n.type === 'danger' ? '#f43f5e' : '#f59e0b'), position: 'relative' }}>
                          <button 
                            onClick={() => handleDismiss(n.id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: theme.muted, cursor: 'pointer', padding: '4px' }}
                          >
                            <X size={14} />
                          </button>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: theme.text, paddingRight: '20px' }}>{n.title}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.muted, fontWeight: '600' }}>{n.message}</p>
                        </div>
                      )) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme.muted, fontSize: '13px' }}>No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid ' + theme.border, height: '44px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontSize: '15px', fontWeight: '950', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                }}>
                  {user?.username === 'Rahuljajora@9660' ? 'R' : (user?.username?.charAt(0).toUpperCase() || 'A')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: theme.text, lineHeight: 1.1 }}>
                    {user?.username === 'Rahuljajora@9660' ? 'Rahul' : (user?.username || 'User')}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: theme.muted, marginTop: '2px' }}>Admin</span>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            input::placeholder { color: ${isDarkMode ? '#64748b' : '#94a3b8'}; }
          `}</style>

          {/* Dynamic Content */}
          <div key={currentPage} className="page-content">
            <ErrorBoundary>
            {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} timeRange={timeRange} searchQuery={searchQuery} />}
            {currentPage === 'history' && (
              <HistoryPage 
                isDarkMode={isDarkMode}
                searchQuery={searchQuery}
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
            { currentPage === 'studioteam' && <StudioTeam isDarkMode={isDarkMode} searchQuery={searchQuery} /> }
            { currentPage === 'notes' && <Notes isDarkMode={isDarkMode} searchQuery={searchQuery} /> }
            { currentPage === 'clients' && (
              <Clients 
                isDarkMode={isDarkMode} 
                searchQuery={searchQuery}
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
                searchQuery={searchQuery}
                onOpenAnalysis={(clientName) => {
                  const clients = JSON.parse(localStorage.getItem('studio_clients') || '[]');
                  let client = clients.find(c => c.name === clientName);
                  if (!client) client = { name: clientName, phone: '', email: '', address: '' };
                  setSelectedClient(client);
                  setCurrentPage('client-details');
                }}
              />
            )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
