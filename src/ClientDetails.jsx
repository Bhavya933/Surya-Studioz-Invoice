import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  DollarSign, ArrowLeft, Plus, ExternalLink, 
  MessageCircle, Star, Clock, FileText, ChevronRight, ChevronLeft, X,
  HardDrive, AlertCircle, Trash2, Edit3, Layout,
  Camera, CheckCircle, Check, Users, TrendingDown, Award, ChevronDown,
  CheckSquare, Square
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientDetails = ({ client, onBack, onNewInvoice, onViewInvoice, isDarkMode }) => {
  // 1. Theme Configuration
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#f8fafc'
  };

  // 2. Get entire invoice history for this specific client
  const history = useMemo(() => {
    const allHistory = JSON.parse(localStorage.getItem('invoice_history') || '[]');
    return allHistory
      .filter(inv => inv.client?.name === client.name)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [client.name]);

  // 1.5. Manage Projects (Shoots/Bookings)
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const savedTeam = JSON.parse(localStorage.getItem('studio_team') || '[]');
    setTeamMembers(savedTeam);
  }, []);
  const [projects, setProjects] = useState([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTeamEditModalOpen, setIsTeamEditModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [serviceEditingProject, setServiceEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    status: 'Upcoming', // Upcoming, Shooting, Editing, Delivered
    services: [], 
    budget: '',
    assignedTeam: [],
    daysOfProgram: 1,
    teamPrice: '',
    dataFromTeam: 'Pending', // Pending, Received
    editorID: '',
    editorPrice: '',
    dataToEditor: 'Pending', // Pending, Sent
    albumArtistID: '',
    albumPrice: '',
    workCompletion: 0,
    venue: '',
    startTime: '09:30', 
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/${encodeURIComponent(client.name)}`);
      const data = await res.json();
      setProjects(data);
      return data;
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback for safety
      const saved = JSON.parse(localStorage.getItem('studio_projects') || '[]');
      setProjects(saved.filter(p => p.clientName === client.name));
      return [];
    }
  };

  useEffect(() => {
    if (client) {
      fetchProjects().then(clientProjects => {
        // Auto-Initialize Project from Latest Invoice IF no project exists in DB
        if (clientProjects.length === 0) {
          const allHistory = JSON.parse(localStorage.getItem('invoice_history') || '[]');
          const clientHistory = allHistory
            .filter(inv => inv.client?.name === client.name)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          let defaultTitle = `${client.name} Event`;
          let defaultDate = new Date().toISOString().split('T')[0];
          let defaultBudget = 0;

          if (clientHistory.length > 0) {
            const latestInvoice = clientHistory[0];
            if (latestInvoice.items && latestInvoice.items.length > 0) {
              defaultTitle = latestInvoice.items[0].description || defaultTitle;
              defaultBudget = latestInvoice.items.reduce((sum, item) => sum + (item.rate * item.qty), 0);
            }
            defaultDate = latestInvoice.date;
          }

          const newAutoProject = {
            clientName: client.name,
            title: defaultTitle,
            date: defaultDate,
            status: 'Upcoming',
            assignedTeam: [],
            selectedServices: [],
            daysOfProgram: 1,
            teamPrice: '',
            venue: '',
            startTime: '09:30',
            budget: defaultBudget.toString(),
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };

          // Save to API
          fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAutoProject)
          }).then(() => fetchProjects());
        }
      });
    }
  }, [client?.name]);

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProject, clientName: client.name })
      });
      fetchProjects();
      setIsProjectModalOpen(false);
      setNewProject({ 
        title: '', date: new Date().toISOString().split('T')[0], status: 'Upcoming', 
        selectedServices: [], budget: '', assignedTeam: [], daysOfProgram: 1, teamPrice: '',
        dataFromTeam: 'Pending', editorID: '', editorPrice: '', dataToEditor: 'Pending',
        albumArtistID: '', albumPrice: '', workCompletion: 0,
        venue: '', startTime: '09:30',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientName: client.name
      });
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm('Delete this project?')) {
       try {
         await fetch(`${API_URL}/projects/delete/${id}`);
         fetchProjects();
       } catch (err) {
         alert('Delete failed');
       }
    }
  };

  const updateProjectProperty = async (id, property, value) => {
    // Optimistic Update
    const updatedLocally = projects.map(p => p.id === id ? { ...p, [property]: value } : p);
    setProjects(updatedLocally);

    try {
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [property]: value })
      });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const updateProjectStatus = (id, newStatus) => {
    updateProjectProperty(id, 'status', newStatus);
  };

  const advanceProjectPipeline = (p) => {
    if (p.status === 'Upcoming') { updateProjectStatus(p.id, 'Team Assigned'); return; }
    if (p.status === 'Team Assigned') { updateProjectStatus(p.id, 'Data Status'); return; }
    if (p.status === 'Data Status') { 
      updateProjectProperty(p.id, 'dataFromTeam', 'Received');
      updateProjectStatus(p.id, 'Editing'); 
      return; 
    }
    if (p.status === 'Editing') { 
      updateProjectProperty(p.id, 'workCompletion', '100');
      updateProjectProperty(p.id, 'albumCompletion', '100');
      updateProjectStatus(p.id, 'Delivered'); 
      return; 
    }
  };

  const regressProjectPipeline = (p) => {
    if (p.status === 'Delivered') { updateProjectStatus(p.id, 'Editing'); return; }
    if (p.status === 'Editing') { updateProjectStatus(p.id, 'Data Status'); return; }
    if (p.status === 'Data Status') { updateProjectStatus(p.id, 'Team Assigned'); return; }
    if (p.status === 'Team Assigned') { updateProjectStatus(p.id, 'Upcoming'); return; }
  };

  const sendPenaltyNotification = (p, type) => {
    const leader = teamMembers.find(m => p.assignedTeam?.[0] === m.id);
    const message = `Collect your payment and give me data. You are late in this. 500 rupees penalty.`;
    
    if (type === 'whatsapp') {
      const phone = leader?.phone || '';
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`mailto:${leader?.email || ''}?subject=Penalty Alert: Data Pending&body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // 2. Financial Metrics Aggregator
  const stats = useMemo(() => {
    const totalBilling = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalCosting = projects.reduce((sum, p) => {
      const pCosts = Number(p.teamPrice || 0) + Number(p.editorPrice || 0) + Number(p.albumPrice || 0);
      return sum + pCosts;
    }, 0);
    const totalProfit = totalBilling - totalCosting;

    return {
      totalBilling,
      totalCosting,
      totalProfit
    };
  }, [projects]);
  
  // 3. Automation Helpers
  const sendTeamNotification = (p, type) => {
    const leader = teamMembers.find(m => p.assignedTeam?.[0] === m.id);
    if (!leader) { 
      alert("Please assign a Team Leader first! (Click 'Add' in the Crew section)"); 
      return; 
    }

    let finalShootDate = '';
    if (p.shootCustomDates !== undefined) {
      finalShootDate = p.shootCustomDates;
    } else if (p.date) {
      const start = new Date(p.date);
      const d = parseInt(p.daysOfProgram) || 1;
      const monthInfo = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      let daysArray = [];
      for(let i = 0; i < d; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        daysArray.push(current.getDate());
      }
      finalShootDate = `Shoot: ${daysArray.join('/')} ${monthInfo}`;
    } else {
      finalShootDate = 'N/A';
    }

    const servicesStr = (p.selectedServices || []).length > 0 ? (p.selectedServices || []).join(', ').toUpperCase() : 'Not Specified';
    const message = `Hi ${leader?.name || 'Team'}, you are assigned to "${p.title}" on ${finalShootDate} at ${p.startTime || '9:30 AM'}. \n📍 Venue: ${p.venue || 'N/A'} \n⏱️ Duration: ${p.daysOfProgram} Days \n🛠️ Scope: ${servicesStr} \n💰 Total Pay: ₹${Number(p.teamPrice || 0).toLocaleString()} \n\nPlease confirm your availability.`;
    
    if (type === 'whatsapp') {
      const phone = (leader?.phone || '').replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`mailto:${leader?.email || ''}?subject=Project Assignment: ${p.title}&body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const sendProductionAssignment = (p, serviceType) => {
    const isVideo = serviceType === 'video';
    const targetID = isVideo ? p.editorID : p.albumArtistID;
    const days = isVideo ? (p.videoDeadlineDays || 0) : (p.albumDeadlineDays || 0);
    const target = teamMembers.find(m => m.id === targetID);
    
    if (!target) { alert('Please assign a member first!'); return; }
    
    const message = `I have deat was send and edit this data under ${days} days. Your deadline is ${days} days.`;
    window.open(`https://wa.me/${target.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendClientProductionUpdate = (p) => {
    const videoDays = parseInt(p.videoDeadlineDays) || 0;
    const albumDays = parseInt(p.albumDeadlineDays) || 0;
    const maxDays = Math.max(videoDays, albumDays);
    const clientDays = maxDays + 5;
    
    const message = `Hi ${client.name}, your data was going under process in editing and album. We will give you editing videos and albam in just ${clientDays} days.`;
    window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!client) return <div>No client selected</div>;

  const SERVICE_OPTIONS = [
    'Traditional Photo', 'Traditional Video', 'Cinematic Photo', 'Cinematic Video',
    'Maternity Shoot', 'Baby Shoot', 'Corporate Shoot', 'Album Editing', 'Video Editing'
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        .premium-card { transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 32px; }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
        .pulsing-badge { animation: pulse 2s infinite ease-in-out; }
      `}</style>

      {/* 💎 ADD PROJECT MODAL */}
      {isProjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '24px' }}>
          <div style={{ background: theme.card, width: '100%', maxWidth: '600px', padding: '40px', borderRadius: '40px', position: 'relative', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid ' + theme.border }}>
            <button onClick={() => setIsProjectModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: theme.bg, padding: '10px', borderRadius: '14px', cursor: 'pointer', color: theme.muted }}><X size={24} /></button>
            
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.text, margin: '0 0 8px 0' }}>Initialize New Project</h2>
            <p style={{ color: theme.muted, fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}>Track shoot details for {client.name}</p>

            <form onSubmit={saveProject} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>PROJECT TITLE</label>
                <input required type="text" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="e.g. Sharma Wedding 2026" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>EVENT DATE</label>
                  <input required type="date" value={newProject.date} onChange={(e) => setNewProject({ ...newProject, date: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '14px', fontWeight: '700' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>START TIME</label>
                  <input required type="time" value={newProject.startTime} onChange={(e) => setNewProject({ ...newProject, startTime: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '14px', fontWeight: '700' }} />
                </div>
                 <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>CLIENT BUDGET (₹)</label>
                  <input required type="number" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '14px', fontWeight: '700' }} placeholder="50000" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>VENUE / LOCATION</label>
                  <input required type="text" value={newProject.venue} onChange={(e) => setNewProject({ ...newProject, venue: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '15px', fontWeight: '700' }} placeholder="e.g. Grand Palace, Jaipur" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>PROGRAM DAYS</label>
                  <input required type="number" value={newProject.daysOfProgram} onChange={(e) => setNewProject({ ...newProject, daysOfProgram: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '14px', fontWeight: '700' }} placeholder="1" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '12px' }}>ASSIGN SHOOTING CREW & TEAM PAY</label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '100px', overflowY: 'auto', padding: '12px', background: theme.bg, borderRadius: '16px', border: '1px solid ' + theme.border }}>
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          const assigned = newProject.assignedTeam.includes(member.id)
                            ? newProject.assignedTeam.filter(id => id !== member.id)
                            : [...newProject.assignedTeam, member.id];
                          setNewProject({ ...newProject, assignedTeam: assigned });
                        }}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer',
                          background: newProject.assignedTeam.includes(member.id) ? '#10b981' : theme.card,
                          color: newProject.assignedTeam.includes(member.id) ? '#fff' : theme.muted,
                          border: '1px solid ' + (newProject.assignedTeam.includes(member.id) ? '#10b981' : theme.border),
                          transition: '0.2s'
                        }}
                      >
                        <img src={member.image} style={{ width: '16px', height: '16px', borderRadius: '50%' }} alt="" /> {member.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <input type="number" placeholder="Total Team Pay" value={newProject.teamPrice} onChange={(e) => setNewProject({ ...newProject, teamPrice: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.text, fontSize: '13px', fontWeight: '700', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px', background: theme.bg, borderRadius: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: theme.muted, marginBottom: '4px' }}>EDITOR & FEE (₹)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={newProject.editorID} onChange={(e) => setNewProject({ ...newProject, editorID: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '12px', fontWeight: '700', outline: 'none' }}>
                      <option value="">Select Editor</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" placeholder="Fee" value={newProject.editorPrice} onChange={(e) => setNewProject({ ...newProject, editorPrice: e.target.value })} style={{ width: '80px', padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '12px', fontWeight: '700', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: theme.muted, marginBottom: '4px' }}>ALBUM ARTIST & FEE (₹)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={newProject.albumArtistID} onChange={(e) => setNewProject({ ...newProject, albumArtistID: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '12px', fontWeight: '700', outline: 'none' }}>
                      <option value="">Select Artist</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" placeholder="Fee" value={newProject.albumPrice} onChange={(e) => setNewProject({ ...newProject, albumPrice: e.target.value })} style={{ width: '80px', padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '12px', fontWeight: '700', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.text, marginBottom: '8px' }}>FINAL DELIVERY DEADLINE</label>
                <input required type="date" value={newProject.deadline} onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '14px', fontWeight: '700' }} />
              </div>

              <button type="submit" style={{ background: '#f97316', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)' }}>
                Initialize Project Tracking
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 0', minHeight: '100%', animation: 'fadeIn 0.4s easeOut', position: 'relative' }}>
        
        {/* 🔙 NAVIGATION HEAD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button 
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: theme.muted, fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} /> Back to Clients List
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
             {projects.length === 0 && (
               <button 
                 onClick={() => setIsProjectModalOpen(true)}
                 style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f140', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
               >
                 <Plus size={16} strokeWidth={3} /> Add Project
               </button>
             )}
          </div>
        </div>

        {/* 🏢 PROFILE HEADER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '32px', marginBottom: '40px' }}>
          
          {/* PROFILE CARD */}
          <div style={{ background: theme.card, borderRadius: '24px', padding: '28px', border: '1px solid ' + theme.border, boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <div style={{ width: '70px', height: '70px', borderRadius: '24px', background: '#f9731615', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900', border: '2px solid #f9731630', marginBottom: '16px' }}>
                 {client.name.charAt(0)}
               </div>
               <h2 style={{ fontSize: '22px', fontWeight: '900', color: theme.text, margin: '0 0 4px 0' }}>{client.name}</h2>
               <span style={{ 
                 padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900',
                 background: client.category === 'VIP' ? '#f9731620' : (client.category === 'Premium' ? '#10b98120' : theme.bg),
                 color: client.category === 'VIP' ? '#f97316' : (client.category === 'Premium' ? '#10b981' : theme.muted),
                 marginBottom: '12px'
               }}>
                 {client.category.toUpperCase()}
               </span>

               {(() => {
                 const latest = projects.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                 if (!latest) return null;
                 
                 const getStatusColor = (s) => {
                   if (s === 'Delivered') return '#10b981';
                   if (s === 'Editing') return '#6366f1';
                   if (s === 'Data Status') return '#f59e0b';
                   return '#f97316';
                 };
                 
                 const getStatusText = (s) => {
                   if (s === 'Delivered') return 'Completed';
                   if (s === 'Editing') return 'Video Editing / Album';
                   if (s === 'Data Status') return 'Data Status';
                   return 'Team Assigned';
                 };

                 const color = getStatusColor(latest.status);
                 const text = getStatusText(latest.status);

                 return (
                   <div style={{ 
                     padding: '6px 14px', 
                     borderRadius: '12px', 
                     fontSize: '11px', 
                     fontWeight: '950',
                     color: color,
                     border: `1px solid ${color}30`,
                     background: `${color}10`,
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     marginBottom: '24px'
                   }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}40` }} />
                     {text}
                   </div>
                 );
               })()}

               <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.muted, fontSize: '13px', fontWeight: '700' }}>
                   <Mail size={14} color={theme.muted} /> {client.email}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.muted, fontSize: '13px', fontWeight: '700' }}>
                   <Phone size={14} color={theme.muted} /> {client.phone}
                 </div>
                 <div style={{ display: 'flex', gap: '10px', color: theme.muted, fontSize: '13px', fontWeight: '700', lineHeight: '1.4' }}>
                   <MapPin size={14} color={theme.muted} style={{ flexShrink: 0, marginTop: '2px' }} /> {client.address || 'Address not listed'}
                 </div>
               </div>

               <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                 <a href={`tel:${client.phone}`} style={{ textDecoration: 'none', background: theme.bg, color: theme.text, padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid ' + theme.border }}>
                   <Phone size={14} /> Call
                 </a>
                 <a href={`https://wa.me/${client.phone}`} style={{ textDecoration: 'none', background: '#25D36615', color: '#128C7E', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #25D36630' }}>
                   <MessageCircle size={14} /> WhatsApp
                 </a>
               </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
               {[
                 { label: 'Billing Amount', value: `₹${stats.totalBilling.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                 { label: 'Costing', value: `₹${stats.totalCosting.toLocaleString()}`, icon: TrendingDown, color: '#ef4444' },
                 { label: 'Total Profit', value: `₹${stats.totalProfit.toLocaleString()}`, icon: Award, color: '#f59e0b' },
               ].map((card, idx) => (
                 <div key={idx} style={{ background: theme.card, padding: '16px 20px', borderRadius: '20px', border: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                   <div style={{ background: `${card.color}15`, color: card.color, padding: '8px', borderRadius: '10px' }}>
                     <card.icon size={16} />
                   </div>
                   <div>
                     <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.muted, textTransform: 'uppercase' }}>{card.label}</p>
                     <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '900', color: theme.text }}>{card.value}</h3>
                   </div>
                 </div>
               ))}
            </div>
 
            {/* 📈 DYNAMIC PROJECT TRACKER (STEPPER) */}
            <div style={{ background: theme.card, borderRadius: '24px', padding: '24px', border: '1px solid ' + theme.border, boxShadow: '0 8px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: theme.text }}>Active Project Timeline</h3>
                <span style={{ fontSize: '10px', fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-time Status</span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '0 20px 20px 20px' }}>
                {/* Connecting Line Backdrop */}
                <div style={{ position: 'absolute', top: '35%', left: '40px', right: '40px', height: '2px', background: isDarkMode ? '#1e293b' : '#f1f5f9', zIndex: 0 }} />
                
                {(() => {
                  const latest = projects.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                  const stages = [
                    { label: 'Team Assigned', icon: Users, completed: latest?.status === 'Data Status' || latest?.status === 'Editing' || latest?.status === 'Delivered', active: latest?.status === 'Team Assigned' },
                    { label: 'Data Status', icon: HardDrive, completed: latest?.status === 'Editing' || latest?.status === 'Delivered', active: latest?.status === 'Data Status' },
                    { label: 'Video Editing / Album', icon: Edit3, completed: latest?.status === 'Delivered', active: latest?.status === 'Editing' },
                    { label: 'Completed', icon: CheckCircle, completed: latest?.status === 'Delivered', active: latest?.status === 'Delivered' }
                  ];

                  return stages.map((step, i) => {
                    const Icon = step.icon;
                    const isLast = i === stages.length - 1;
                    
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, position: 'relative', width: '25%' }}>
                        {/* Connecting Line Progress */}
                        {!isLast && step.completed && (
                          <div style={{ position: 'absolute', top: '15.5px', left: '50%', width: '100%', height: '2px', background: '#f97316', zIndex: -1 }} />
                        )}
                        
                        <div style={{ color: step.completed ? '#f97316' : (step.active ? '#6366f1' : theme.muted), background: theme.card, padding: '4px', transition: '0.3s' }}>
                          <Icon size={20} strokeWidth={step.completed || step.active ? 3 : 2} style={{ animation: step.active ? 'pulse-icon 2s infinite ease-in-out' : 'none' }} />
                        </div>
                        
                        <div style={{ 
                          width: step.active ? '28px' : '24px', height: step.active ? '28px' : '24px', borderRadius: '50%', 
                          background: step.completed ? '#f97316' : (step.active ? '#6366f1' : (isDarkMode ? '#1e293b' : '#f1f5f9')), 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `2px solid ${step.completed ? '#f97316' : (step.active ? '#6366f1' : theme.border)}`,
                          boxShadow: step.completed ? '0 0 15px rgba(249, 115, 22, 0.3)' : (step.active ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'),
                          transition: '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                          {step.completed ? <Check size={12} color="#fff" strokeWidth={4} /> : <span style={{ fontSize: step.active ? '11px' : '10px', fontWeight: '950', color: step.active ? '#fff' : theme.muted }}>{i+1}</span>}
                        </div>
                        
                        <span style={{ fontSize: '9px', fontWeight: '950', color: step.completed || step.active ? theme.text : theme.muted, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.02em', opacity: step.completed || step.active ? 1 : 0.6 }}>
                          {step.label}
                        </span>
                        
                        {step.active && (
                          <div style={{ position: 'absolute', bottom: '-22px', padding: '4px 10px', background: '#6366f115', color: '#6366f1', borderRadius: '6px', fontSize: '8px', fontWeight: '950', whiteSpace: 'nowrap', border: '1px solid #6366f130', animation: 'fadeIn 0.3s' }}>
                            {step.label === 'Completed' ? 'FINAL DELIVERED' : step.label.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <style>{`
                @keyframes pulse-icon {
                  0% { transform: scale(1); opacity: 0.8; }
                  50% { transform: scale(1.15); opacity: 1; }
                  100% { transform: scale(1); opacity: 0.8; }
                }
              `}</style>
            </div>

          </div>
        </div>

        {/* 🚀 DEEP LOGISTICS ANALYSIS LIST */}
        {projects.length > 0 && (
          <div style={{ marginBottom: '64px', animation: 'fadeIn 0.6s ease-out' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '900', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layout size={20} color="#f97316" /> Strategic Project Analysis
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {projects.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1).map(p => {
                const shootCrew = teamMembers.filter(m => p.assignedTeam?.includes(m.id));
                const editor = teamMembers.find(m => m.id === p.editorID);
                const albumArtist = teamMembers.find(m => m.id === p.albumArtistID);
                
                const internalCost = (Number(p.teamPrice) || 0) + (Number(p.editorPrice) || 0) + (Number(p.albumPrice) || 0);
                const clientBudget = Number(p.budget) || 0;
                const profit = clientBudget - internalCost;

                return (
                  <div key={p.id} style={{ marginBottom: '32px' }}>
                    {/* 🏷️ Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 12px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <input 
                           type="text" 
                           value={p.title} 
                           onChange={(e) => updateProjectProperty(p.id, 'title', e.target.value)}
                           style={{ 
                             margin: 0, 
                             fontSize: '20px', 
                             fontWeight: '950', 
                             color: theme.text, 
                             background: 'transparent', 
                             border: 'none', 
                             outline: 'none', 
                             width: (p.title?.length || 1) + 1 + 'ch',
                             minWidth: '150px',
                             maxWidth: '400px',
                             transition: 'width 0.1s ease-out'
                           }} 
                         />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: theme.muted }}>
                          <Calendar size={12} /> 
                          <input 
                            type="date" 
                            value={p.date}
                            onChange={(e) => updateProjectProperty(p.id, 'date', e.target.value)}
                            style={{ 
                              border: 'none', 
                              background: 'transparent', 
                              color: theme.muted, 
                              fontSize: '12px', 
                              fontWeight: '800', 
                              outline: 'none', 
                              cursor: 'pointer',
                              padding: 0
                            }} 
                          />
                        </div>
                        <span className="pulsing-badge" style={{ fontSize: '10px', fontWeight: '900', color: p.status === 'Team Assigned' ? '#f97316' : (p.status === 'Editing' ? '#6366f1' : '#10b981'), background: (p.status === 'Team Assigned' ? '#f9731615' : (p.status === 'Editing' ? '#6366f115' : '#10b98115')), padding: '2px 10px', borderRadius: '20px', border: '1px solid currentColor' }}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          value={p.status} 
                          onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                          style={{ border: '1px solid ' + theme.border, background: theme.bg, color: theme.text, padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', outline: 'none', cursor: 'pointer' }}
                        >
                          {['Upcoming', 'Team Assigned', 'Data Status', 'Editing', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteProject(p.id)} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#ef444450', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {p.status === 'Editing' ? (
                        /* 🎬 PRODUCTION HUB (VISIBLE DURING EDITING) */
                        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', background: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : '#ffffff', borderRadius: '32px', border: '1px solid ' + (isDarkMode ? '#6366f130' : theme.border) }}>
                             {/* 🛠️ QUICK PIPELINE OVERRIDE (STICKY TOP) */}
                             <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid ' + theme.border, paddingBottom: '24px' }}>
                                <div onClick={() => updateProjectProperty(p.id, 'videoEditingRequired', !p.videoEditingRequired)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: p.videoEditingRequired ? '#6366f115' : 'transparent', border: '1px solid ' + (p.videoEditingRequired ? '#6366f1' : theme.border), color: p.videoEditingRequired ? '#6366f1' : theme.muted, fontSize: '11px', fontWeight: '950', cursor: 'pointer', transition: '0.3s' }}>
                                  {p.videoEditingRequired ? <CheckSquare size={16} /> : <Square size={16} />} VIDEO EDITING
                                </div>
                                <div onClick={() => updateProjectProperty(p.id, 'albumEditingRequired', !p.albumEditingRequired)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: p.albumEditingRequired ? '#f59e0b15' : 'transparent', border: '1px solid ' + (p.albumEditingRequired ? '#f59e0b' : theme.border), color: p.albumEditingRequired ? '#f59e0b' : theme.muted, fontSize: '11px', fontWeight: '950', cursor: 'pointer', transition: '0.3s' }}>
                                  {p.albumEditingRequired ? <CheckSquare size={16} /> : <Square size={16} />} ALBUM DESIGN
                                </div>
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 1fr) 1.2fr 240px', gap: '32px', alignItems: 'center' }}>
                               {/* COLUMN 1: CONFIGURATIONS */}
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  {p.videoEditingRequired && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: isDarkMode ? '#6366f108' : '#6366f103', borderRadius: '16px', border: '1px solid ' + (isDarkMode ? '#6366f120' : '#6366f110') }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '10px', fontWeight: '950', color: '#6366f1', letterSpacing: '0.05em' }}>VIDEO EDITING CONFIG</span>
                                          <span style={{ fontSize: '9px', fontWeight: '950', color: '#6366f1', background: '#6366f115', padding: '2px 8px', borderRadius: '8px' }}>{p.workCompletion || 0}%</span>
                                       </div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '8px' }}>
                                          <select value={p.editorID || ''} onChange={(e) => updateProjectProperty(p.id, 'editorID', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }}><option value="">Editor</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}><input type="number" value={p.videoDeadlineDays || 0} onChange={(e) => updateProjectProperty(p.id, 'videoDeadlineDays', e.target.value)} style={{ width: '100%', padding: '8px 24px 8px 8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }} /><span style={{ position: 'absolute', right: '8px', fontSize: '8px', fontWeight: '900', color: theme.muted }}>D</span></div>
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}><span style={{ position: 'absolute', left: '8px', fontSize: '9px', fontWeight: '900', color: theme.muted }}>₹</span><input type="number" placeholder="Pay" value={p.editorPrice || ''} onChange={(e) => updateProjectProperty(p.id, 'editorPrice', e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 18px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }} /></div>
                                       </div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                          <button onClick={() => sendProductionAssignment(p, 'video')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D36615', color: '#128C7E', border: '1px solid #25D36630', padding: '10px', borderRadius: '12px', fontSize: '9px', fontWeight: '950', cursor: 'pointer' }}><MessageCircle size={14} /> MSG EDITOR</button>
                                          <button onClick={() => sendClientProductionUpdate(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#6366f115', color: '#6366f1', border: '1px solid #6366f130', padding: '10px', borderRadius: '12px', fontSize: '9px', fontWeight: '950', cursor: 'pointer' }}><MessageCircle size={14} /> MSG CLIENT</button>
                                       </div>
                                    </div>
                                  )}
                                  {p.albumEditingRequired && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: isDarkMode ? '#f59e0b08' : '#f59e0b03', borderRadius: '16px', border: '1px solid ' + (isDarkMode ? '#f59e0b20' : '#f59e0b10') }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '10px', fontWeight: '950', color: '#f59e0b', letterSpacing: '0.05em' }}>ALBUM DESIGN CONFIG</span>
                                          <span style={{ fontSize: '9px', fontWeight: '950', color: '#f59e0b', background: '#f59e0b15', padding: '2px 8px', borderRadius: '8px' }}>{p.albumCompletion || 0}%</span>
                                       </div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '8px' }}>
                                          <select value={p.albumArtistID || ''} onChange={(e) => updateProjectProperty(p.id, 'albumArtistID', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }}><option value="">Artist</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}><input type="number" value={p.albumDeadlineDays || 0} onChange={(e) => updateProjectProperty(p.id, 'albumDeadlineDays', e.target.value)} style={{ width: '100%', padding: '8px 24px 8px 8px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }} /><span style={{ position: 'absolute', right: '8px', fontSize: '8px', fontWeight: '900', color: theme.muted }}>D</span></div>
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}><span style={{ position: 'absolute', left: '8px', fontSize: '9px', fontWeight: '900', color: theme.muted }}>₹</span><input type="number" placeholder="Pay" value={p.albumPrice || ''} onChange={(e) => updateProjectProperty(p.id, 'albumPrice', e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 18px', borderRadius: '10px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '700', outline: 'none' }} /></div>
                                       </div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                          <button onClick={() => sendProductionAssignment(p, 'album')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D36615', color: '#128C7E', border: '1px solid #25D36630', padding: '10px', borderRadius: '12px', fontSize: '9px', fontWeight: '950', cursor: 'pointer' }}><MessageCircle size={14} /> MSG ARTIST</button>
                                          <button onClick={() => sendClientProductionUpdate(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#6366f115', color: '#6366f1', border: '1px solid #6366f130', padding: '10px', borderRadius: '12px', fontSize: '9px', fontWeight: '950', cursor: 'pointer' }}><MessageCircle size={14} /> MSG CLIENT</button>
                                       </div>
                                    </div>
                                  )}
                                  {!p.videoEditingRequired && !p.albumEditingRequired && (
                                    <div style={{ padding: '24px', textAlign: 'center', background: isDarkMode ? '#1e293b50' : '#f8fafc', borderRadius: '20px', border: '1px dashed ' + theme.border }}>
                                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '950', color: theme.text }}>DIRECT DELIVERY</p>
                                      <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: theme.muted }}>No editing tasks active. Finish project below.</p>
                                    </div>
                                  )}
                               </div>

                               {/* COLUMN 2: TEAM STATUS */}
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>TEAM STATUS</p>
                                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                     {p.videoEditingRequired && (
                                       <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                         <p style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '950', color: theme.muted }}>EDITOR</p>
                                         <div style={{ background: theme.card, padding: '6px 12px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '900', color: theme.text }}>{editor ? editor.name : 'Unassigned'}</div>
                                       </div>
                                     )}
                                     {p.albumEditingRequired && (
                                       <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                         <p style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '950', color: theme.muted }}>ARTIST</p>
                                         <div style={{ background: theme.card, padding: '6px 12px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '11px', fontWeight: '900', color: theme.text }}>{albumArtist ? albumArtist.name : 'Unassigned'}</div>
                                       </div>
                                     )}
                                     <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                       <p style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '950', color: theme.muted }}>DATA</p>
                                       <div onClick={() => updateProjectProperty(p.id, 'dataFromTeam', p.dataFromTeam === 'Received' ? 'Pending' : 'Received')} style={{ cursor: 'pointer', background: p.dataFromTeam === 'Received' ? '#10b98120' : '#ef444410', color: p.dataFromTeam === 'Received' ? '#10b981' : '#ef4444', padding: '6px 12px', borderRadius: '12px', border: '1px solid currentColor', fontSize: '11px', fontWeight: '950' }}>{p.dataFromTeam === 'Received' ? '✓ OK' : 'PEND'}</div>
                                     </div>
                                  </div>
                               </div>

                               {/* COLUMN 3: ACTIONS */}
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                  <button onClick={() => regressProjectPipeline(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', color: theme.muted, border: '1px solid ' + theme.border, cursor: 'pointer', fontWeight: '950', fontSize: '12px', transition: '0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }} onMouseOut={(e) => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'; e.currentTarget.style.color = theme.muted; }}><ChevronLeft size={16} /> BACK</button>
                                  <button onClick={() => advanceProjectPipeline(p)} style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '950', fontSize: '12px', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>MARK COMPLETED <CheckCircle size={16} fill="white" color="#10b981" /></button>
                               </div>
                             </div>
                        </div>
                      ) : p.status === 'Data Status' ? (
                        /* 📂 DATA STATUS HUB (STAGE 2) */
                        <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 1fr) 1.2fr 240px', gap: '32px', padding: '32px', background: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : '#ffffff', borderRadius: '32px', border: '1px solid ' + (isDarkMode ? '#f59e0b30' : theme.border), alignItems: 'flex-start' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', borderRight: '1px solid ' + theme.border, paddingRight: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                 <img src={shootCrew[0]?.image || 'https://via.placeholder.com/40'} style={{ width: '48px', height: '48px', borderRadius: '16px', border: '2px solid #f59e0b' }} alt="Leader" />
                                 <div>
                                   <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase' }}>TEAM LEADER</p>
                                   <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '950', color: theme.text }}>{shootCrew[0]?.name || 'Unassigned'}</h4>
                                 </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '14px', border: '1px solid ' + theme.border }}>
                                 <span style={{ fontSize: '10px', fontWeight: '950', color: theme.muted, letterSpacing: '0.05em' }}>PAY STATUS</span>
                                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100px' }}>
                                    <span style={{ position: 'absolute', left: '10px', fontSize: '10px', fontWeight: '900', color: theme.muted }}>₹</span>
                                    <input 
                                      type="number" 
                                      placeholder="0" 
                                      value={p.teamPrice || ''} 
                                      onChange={(e) => updateProjectProperty(p.id, 'teamPrice', e.target.value)} 
                                      style={{ width: '100%', padding: '6px 6px 6px 20px', borderRadius: '8px', background: theme.card, color: theme.text, border: '1px solid ' + theme.border, fontSize: '13px', fontWeight: '800', outline: 'none' }} 
                                    />
                                  </div>
                              </div>
                           </div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                                 <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>DATA QUALITY CHECK</p>
                                 <div style={{ display: 'flex', gap: '12px' }}>
                                    {['Right', 'Wrong'].map(q => <button key={q} onClick={() => updateProjectProperty(p.id, 'dataQuality', q)} style={{ padding: '10px 24px', borderRadius: '14px', border: '1px solid ' + (p.dataQuality === q ? (q === 'Right' ? '#10b981' : '#ef4444') : theme.border), background: p.dataQuality === q ? (q === 'Right' ? '#10b98120' : '#ef444410') : 'transparent', color: p.dataQuality === q ? (q === 'Right' ? '#10b981' : '#ef4444') : theme.muted, fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}>{q === 'Right' ? '✓ DATA OK' : '⚠ DATA ISSUE'}</button>)}
                                 </div>
                              </div>
                              
                              <button onClick={() => {
                                 if(!shootCrew[0]) { alert('No Team Leader assigned!'); return; }
                                 if(!shootCrew[0].phone) { alert('No Phone Number found for Team Leader!'); return; }
                                 const message = `Hello ${shootCrew[0].name},\n\nGive me the data for [${p.title}] and collect your payment. Please note that taking a delay will incur a penalty of ₹500 per day.`;
                                 window.open(`https://wa.me/${shootCrew[0].phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                              }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ef444410', color: '#ef4444', border: '1px dashed #ef444440', padding: '12px 24px', borderRadius: '16px', fontSize: '10px', fontWeight: '950', cursor: 'pointer', transition: '0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#ef444420'; e.currentTarget.style.border = '1px solid #ef4444'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#ef444410'; e.currentTarget.style.border = '1px dashed #ef444440'; }}>
                                 <MessageCircle size={15} /> WHATSAPP LEADER (PENALTY)
                              </button>
                           </div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <button onClick={() => regressProjectPipeline(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', borderRadius: '20px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid ' + theme.border, color: theme.muted, cursor: 'pointer', fontWeight: '950', fontSize: '12px', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'}><ChevronLeft size={16} /> BACK</button>
                              <button onClick={() => advanceProjectPipeline(p)} style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '20px', background: isDarkMode ? '#1e293b' : '#ffffff', border: '1px dashed ' + (isDarkMode ? '#f59e0b50' : '#f59e0b'), color: isDarkMode ? '#f59e0b' : '#f59e0b', cursor: 'pointer', fontWeight: '950', fontSize: '12px', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>PRODUCTION HUB <ChevronRight size={16} /></button>
                           </div>
                        </div>
                      ) : p.status === 'Delivered' ? (
                        /* 🎉 DELIVERY HUB (STAGE 4 - COMPLETED) */
                        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '48px', background: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : '#ffffff', borderRadius: '32px', border: '1px solid ' + (isDarkMode ? '#10b98130' : theme.border), alignItems: 'center' }}>
                           <div style={{ padding: '24px', background: '#10b98120', borderRadius: '50%', border: '4px solid #10b981', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
                              <CheckCircle size={56} color="#10b981" />
                           </div>
                           <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                              <h2 style={{ margin: 0, color: '#10b981', fontSize: '28px', fontWeight: '950', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>PROJECT DELIVERED</h2>
                              <p style={{ margin: '12px 0 0 0', color: theme.muted, fontSize: '13px', lineHeight: '1.6', fontWeight: '700' }}>All processes have been completed successfully. The final data is ready. Please update the client and secure a happy customer.</p>
                           </div>

                           {/* 📊 FULL PROJECT ANALYSIS */}
                           <div style={{ width: '100%', maxWidth: '850px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Final Project Analysis</h4>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                 {/* 1. Timeline */}
                                 <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TIMELINE</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
                                       <span style={{color: theme.muted}}>Event Schedule:</span> 
                                       <span style={{color: theme.text, fontSize: '11px'}}>
                                          {p.shootCustomDates || (() => {
                                             if (!p.date) return 'N/A';
                                             const start = new Date(p.date);
                                             const d = parseInt(p.daysOfProgram) || 1;
                                             const monthInfo = start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                                             let daysArray = [];
                                             for(let i = 0; i < d; i++) {
                                               const current = new Date(start);
                                               current.setDate(start.getDate() + i);
                                               daysArray.push(current.getDate());
                                             }
                                             return `${daysArray.join('/')} ${monthInfo}`;
                                          })()}
                                       </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Duration:</span> <span style={{color: theme.text}}>{p.daysOfProgram || 1} Days</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '950' }}><span style={{color: theme.muted}}>Turnaround:</span> <span style={{color: '#f59e0b'}}>{p.date ? Math.max(1, Math.ceil((new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24))) : 0} Days</span></div>
                                 </div>
                                 
                                 {/* 2. Crew Deployed */}
                                 <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CREW DEPLOYED</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Leader:</span> <span style={{color: theme.text}}>{teamMembers.find(m => p.assignedTeam?.includes(m.id))?.name || 'Unassigned'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Editor:</span> <span style={{color: theme.text}}>{teamMembers.find(m => m.id === p.editorID)?.name || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Artist:</span> <span style={{color: theme.text}}>{teamMembers.find(m => m.id === p.albumArtistID)?.name || 'N/A'}</span></div>
                                 </div>

                                 {/* 3. Service Scope */}
                                 <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SERVICE SCOPE</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Video Editing:</span> <span style={{color: p.videoEditingRequired ? '#10b981' : theme.muted}}>{p.videoEditingRequired ? 'YES' : 'NO'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Album Design:</span> <span style={{color: p.albumEditingRequired ? '#10b981' : theme.muted}}>{p.albumEditingRequired ? 'YES' : 'NO'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Quality:</span> <span style={{color: p.dataQuality === 'Right' ? '#10b981' : '#ef4444'}}>{p.dataQuality || 'Pending'}</span></div>
                                 </div>

                                 {/* 4. Financials */}
                                 <div style={{ background: isDarkMode ? '#10b98110' : '#10b98105', padding: '20px', borderRadius: '16px', border: '1px dashed #10b98160', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FINANCIALS</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Budget:</span> <span style={{color: theme.text}}>₹{Number(p.budget || 0).toLocaleString()}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}><span style={{color: theme.muted}}>Total Cost:</span> <span style={{color: '#ef4444'}}>-₹{(Number(p.teamPrice || 0) + Number(p.editorPrice || 0) + Number(p.albumPrice || 0)).toLocaleString()}</span></div>
                                    <div style={{ height: '1px', background: isDarkMode ? '#10b98130' : '#10b98120', margin: '4px 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '950' }}><span style={{color: theme.muted}}>Margin:</span> <span style={{color: '#10b981'}}>₹{((Number(p.budget || 0)) - (Number(p.teamPrice || 0) + Number(p.editorPrice || 0) + Number(p.albumPrice || 0))).toLocaleString()}</span></div>
                                 </div>
                              </div>
                           </div>
                           
                           <button onClick={() => {
                                const message = `Dear ${client.name},\nWe are extremely pleased to inform you that your final data for [${p.title}] is ready and successfully delivered! We hope you love the results as much as we loved capturing those moments for you. 🎉\n\nThank you for choosing us! We look forward to serving you again.\n\nWarm Regards,\nSurya Studio Team`;
                                const phone = client.phone ? String(client.phone).replace(/[^0-9]/g, '') : '';
                                if(phone) {
                                   window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                } else {
                                   alert("No WhatsApp number found for this client! You can still send a message manually.");
                                   window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                }
                           }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '18px 40px', borderRadius: '24px', fontSize: '14px', fontWeight: '950', cursor: 'pointer', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                               <MessageCircle size={20} fill="white" /> WHATSAPP "HAPPY CUSTOMER" MSG
                           </button>
                           
                           <button onClick={() => regressProjectPipeline(p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: theme.muted, border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '12px', padding: '10px 20px', borderRadius: '12px', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}><ChevronLeft size={14} /> BACK TO EDITING</button>
                        </div>
                      ) : (
                         /* 🛠️ LOGISTICS HUB (VISIBLE DURING ASSIGNMENT/SHOOTING) */
                         <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 0.8fr) minmax(280px, 1fr) 1.2fr 240px', gap: '24px', padding: '32px', background: isDarkMode ? 'rgba(0,0,0,0.1)' : '#ffffff', borderRadius: '32px', border: '1px solid ' + theme.border, alignItems: 'flex-start' }}>
                             {/* 1. Location & Time */}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid ' + theme.border, paddingRight: '24px' }}>
                             <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>EVENT LOGISTICS</p>
                             
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDarkMode ? '#f9731615' : '#f9731608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Calendar size={16} color="#f97316" />
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                 <input type="date" value={p.date} onChange={(e) => updateProjectProperty(p.id, 'date', e.target.value)} style={{ border: 'none', background: 'transparent', color: theme.text, fontSize: '15px', fontWeight: '900', outline: 'none', padding: 0, width: 'fit-content', alignSelf: 'flex-start' }} />
                                 <input 
                                   type="text"
                                   value={p.shootCustomDates !== undefined ? p.shootCustomDates : (() => {
                                      if (!p.date) return '';
                                      const start = new Date(p.date);
                                      const d = parseInt(p.daysOfProgram) || 1;
                                      const monthInfo = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                                      let daysArray = [];
                                      for(let i = 0; i < d; i++) {
                                        const current = new Date(start);
                                        current.setDate(start.getDate() + i);
                                        daysArray.push(current.getDate());
                                      }
                                      return `Shoot: ${daysArray.join('/')} ${monthInfo}`;
                                   })()}
                                   onChange={(e) => updateProjectProperty(p.id, 'shootCustomDates', e.target.value)}
                                   style={{ fontSize: '12px', fontWeight: '800', color: theme.muted, marginTop: '2px', background: 'transparent', border: 'none', outline: 'none', padding: 0, width: '100%' }}
                                 />
                               </div>
                             </div>

                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDarkMode ? '#f9731615' : '#f9731608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <MapPin size={18} color="#f97316" />
                               </div>
                               <input type="text" value={p.venue || ''} onChange={(e) => updateProjectProperty(p.id, 'venue', e.target.value)} placeholder="Venue Name" style={{ flex: 1, border: 'none', background: 'transparent', color: theme.text, fontSize: '14px', fontWeight: '900', outline: 'none', padding: 0 }} />
                             </div>
                             
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDarkMode ? '#f9731615' : '#f9731608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Clock size={16} color="#f97316" />
                               </div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                 <input type="time" value={p.startTime || '09:30'} onChange={(e) => updateProjectProperty(p.id, 'startTime', e.target.value)} style={{ border: 'none', background: 'transparent', color: theme.text, fontSize: '14px', fontWeight: '900', outline: 'none', padding: 0 }} />
                                 <div style={{ width: '1px', height: '14px', background: theme.border }} />
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDarkMode ? '#1e293b' : '#ffffff', border: '1px solid ' + theme.border, padding: '6px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'text' }}>
                                   <input 
                                     type="text" 
                                     inputMode="numeric" 
                                     value={p.daysOfProgram !== undefined ? p.daysOfProgram : ''} 
                                     placeholder="1"
                                     onChange={(e) => updateProjectProperty(p.id, 'daysOfProgram', e.target.value.replace(/[^0-9]/g, ''))} 
                                     style={{ width: '32px', border: 'none', background: 'transparent', color: theme.text, fontSize: '15px', fontWeight: '950', outline: 'none', textAlign: 'center', padding: 0 }} 
                                   />
                                   <span style={{ fontSize: '11px', fontWeight: '900', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</span>
                                 </div>
                               </div>
                             </div>
                            </div>
 
                            {/* 1.5 PROJECT SCOPE (UPDATED FOR MODAL) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid ' + theme.border, paddingRight: '24px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>CHOSEN SERVICES</p>
                                 <button 
                                   onClick={() => { setServiceEditingProject(p); setIsServiceModalOpen(true); }}
                                   style={{ 
                                     background: 'transparent', border: 'none', color: '#f97316', fontSize: '10px', fontWeight: '950', cursor: 'pointer', padding: '4px'
                                   }}
                                 >
                                   + EDIT SCOPE
                                 </button>
                               </div>
 
                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {(p.selectedServices || []).length > 0 ? (
                                    p.selectedServices.map(service => (
                                      <div 
                                        key={service}
                                        style={{ 
                                          padding: '8px 14px', 
                                          borderRadius: '12px', 
                                          fontSize: '10px', 
                                          fontWeight: '950', 
                                          background: isDarkMode ? '#f9731630' : '#f9731610',
                                          border: `1px solid #f97316`,
                                          color: '#f97316',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }} />
                                        {service.toUpperCase()}
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: theme.muted, padding: '12px', border: '1px dashed ' + theme.border, borderRadius: '12px', textAlign: 'center', width: '100%', opacity: 0.6 }}>
                                      No services selected yet.
                                    </div>
                                  )}
                               </div>
                            </div>

                           {/* 2. Crew Deployment */}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid ' + theme.border, paddingRight: '24px' }}>
                              <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>CREW DEPLOYMENT ({shootCrew.length})</p>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                 {shootCrew.map(m => (
                                   <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: theme.card, padding: '5px 12px', borderRadius: '12px', border: '1px solid ' + theme.border, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                      <img src={m.image} style={{ width: '18px', height: '18px', borderRadius: '50%' }} alt="" />
                                      <span style={{ fontSize: '11px', fontWeight: '900', color: theme.text }}>{m.name.split(' ')[0]}</span>
                                   </div>
                                 ))}
                                 <button onClick={() => { setEditingProject(p); setIsTeamEditModalOpen(true); }} style={{ background: 'transparent', border: '1px dashed ' + theme.muted, padding: '5px 12px', borderRadius: '12px', cursor: 'pointer', color: theme.muted, display: 'flex', alignItems: 'center', gap: '4px', transition: '0.2s', ':hover': { opacity: 0.8 } }}>
                                   <Plus size={14} color={theme.muted} />
                                   <span style={{ fontSize: '11px', fontWeight: '900', paddingTop: '1px' }}>Add</span>
                                 </button>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#10b98108', borderRadius: '14px', border: '1px solid #10b98115', width: 'fit-content' }}>
                                <span style={{ fontSize: '10px', fontWeight: '950', color: '#10b981' }}>TEAM PAY</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>₹</span>
                                  <input type="number" placeholder="0" value={p.teamPrice || ''} onChange={(e) => updateProjectProperty(p.id, 'teamPrice', e.target.value !== '' ? parseInt(e.target.value, 10) : '')} style={{ width: '80px', border: 'none', background: 'transparent', color: '#10b981', fontSize: '15px', fontWeight: '950', outline: 'none' }} />
                                </div>
                              </div>
                           </div>

                           {/* 3. Automation Triggers */}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {p.status !== 'Delivered' ? (
                                <>
                                  <button onClick={() => sendTeamNotification(p, 'whatsapp')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '18px', background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '950', fontSize: '12px', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)', transition: '0.3s ease' }}>
                                    <MessageCircle size={18} fill="white" color="#25D366" /> WHATSAPP LEADER
                                  </button>
                                  <button onClick={() => sendTeamNotification(p, 'mail')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '18px', background: 'transparent', border: '1px solid ' + theme.border, color: theme.text, cursor: 'pointer', fontWeight: '950', fontSize: '12px', transition: '0.3s ease' }}>
                                    <Mail size={18} color="#6366f1" /> SEND BRIEF
                                  </button>
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                     <button 
                                       onClick={() => regressProjectPipeline(p)} 
                                       style={{ 
                                         flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '20px', 
                                         background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid ' + theme.border, color: theme.muted, 
                                         cursor: 'pointer', fontWeight: '950', fontSize: '13px', transition: '0.3s' 
                                       }}
                                       onMouseOver={(e) => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }}
                                       onMouseOut={(e) => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'; e.currentTarget.style.color = theme.muted; }}
                                     >
                                       <ChevronLeft size={18} /> BACK
                                     </button>
                                     <button 
                                       onClick={() => advanceProjectPipeline(p)} 
                                       style={{ 
                                         flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', borderRadius: '20px', 
                                         background: isDarkMode ? '#1e293b' : '#f8fafc', border: '1px dashed ' + (isDarkMode ? '#f9731650' : '#f97316'), 
                                         color: theme.text, cursor: 'pointer', fontWeight: '950', fontSize: '13px', transition: '0.3s' 
                                       }}
                                       onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                       onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                     >
                                       NEXT STAGE <ChevronRight size={18} />
                                     </button>
                                  </div>
                                </>
                              ) : (
                                <div style={{ background: '#10b98110', border: '1px solid #10b98130', borderRadius: '24px', padding: '20px', textAlign: 'center' }}>
                                   <p style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: '950', color: '#10b981', textTransform: 'uppercase' }}>FINAL STUDIO MARGIN</p>
                                   <h4 style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: '#10b981' }}>₹{profit.toLocaleString()}</h4>
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                    </div>

                    </div>
                );
              })}
            </div>

            {/* 👥 QUICK TEAM EDIT MODAL */}
            {isTeamEditModalOpen && editingProject && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }}>
                <div style={{ background: theme.card, width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '32px', border: '1px solid ' + theme.border, position: 'relative' }}>
                   <button onClick={() => setIsTeamEditModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'transparent', color: theme.muted, cursor: 'pointer' }}><X size={20} /></button>
                   <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900', color: theme.text }}>Manage Crew</h3>
                   <p style={{ margin: '0 0 24px 0', fontSize: '13px', fontWeight: '700', color: theme.muted }}>Assign team for "{editingProject.title}"</p>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                      {teamMembers.map(member => {
                        const isAssigned = editingProject.assignedTeam?.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => {
                              const newTeam = isAssigned 
                                ? editingProject.assignedTeam.filter(id => id !== member.id)
                                : [...(editingProject.assignedTeam || []), member.id];
                              updateProjectProperty(editingProject.id, 'assignedTeam', newTeam);
                              setEditingProject({ ...editingProject, assignedTeam: newTeam });
                            }}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', border: '1px solid ' + (isAssigned ? '#10b981' : theme.border),
                              background: isAssigned ? '#10b98115' : theme.card, color: isAssigned ? '#10b981' : theme.text, fontSize: '13px', fontWeight: '850', cursor: 'pointer', transition: '0.2s'
                            }}
                          >
                             <img src={member.image} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="" />
                             {member.name.split(' ')[0]}
                          </button>
                        );
                      })}
                   </div>
                   
                   <button onClick={() => setIsTeamEditModalOpen(false)} style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '16px', background: '#f97316', color: 'white', border: 'none', fontWeight: '950', fontSize: '14px', cursor: 'pointer' }}>DONE</button>
                </div>
              </div>
            )}
            {/* 🎥 DETAILED SERVICE SELECTION MODAL */}
            {isServiceModalOpen && serviceEditingProject && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }}>
                <div style={{ background: theme.card, width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '32px', border: '1px solid ' + theme.border, position: 'relative' }}>
                    <button onClick={() => setIsServiceModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'transparent', color: theme.muted, cursor: 'pointer' }}><X size={20} /></button>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900', color: theme.text }}>Edit Project Scope</h3>
                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', fontWeight: '700', color: theme.muted }}>Select services for "{serviceEditingProject.title}"</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                       {[
                         'Cinematic Photo', 'Cinematic Video', 
                         'Traditional Video', 'Traditional Photo', 
                         'Reel', 'Drone', 'Pre-Wedding'
                       ].map(service => {
                         const isSelected = (serviceEditingProject.selectedServices || []).includes(service);
                         return (
                           <button
                             key={service}
                             onClick={() => {
                               const current = serviceEditingProject.selectedServices || [];
                               const updated = isSelected 
                                 ? current.filter(s => s !== service)
                                 : [...current, service];
                               updateProjectProperty(serviceEditingProject.id, 'selectedServices', updated);
                               setServiceEditingProject({ ...serviceEditingProject, selectedServices: updated });
                             }}
                             style={{ 
                               display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '18px', border: '1px solid ' + (isSelected ? '#f97316' : theme.border),
                               background: isSelected ? '#f9731615' : theme.card, color: isSelected ? '#f97316' : theme.text, fontSize: '13px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', textAlign: 'left'
                             }}
                           >
                              <div style={{ width: '12px', height: '12px', borderRadius: '4px', border: '2px solid ' + (isSelected ? '#f97316' : theme.muted), background: isSelected ? '#f97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {isSelected && <Check size={10} color="white" strokeWidth={4} />}
                              </div>
                              {service.toUpperCase()}
                           </button>
                         );
                       })}
                    </div>
                    
                    <button onClick={() => setIsServiceModalOpen(false)} style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '20px', background: 'linear-gradient(135deg, #f97316 0%, #ed6205 100%)', color: 'white', border: 'none', fontWeight: '950', fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)' }}>SAVE CHANGES</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📜 SHOOT HISTORY TIMELINE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text }}>Project History</h3>
        </div>

        <div style={{ background: theme.card, borderRadius: '32px', border: '1px solid ' + theme.border, padding: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
          {history.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '900', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 20px' }}>INVOICE</th>
                  <th>EVENT DATE</th>
                  <th>SERVICES RENDERED</th>
                  <th>AMOUNT</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {history.map(inv => (
                  <tr key={inv.id} style={{ background: theme.bg, borderRadius: '16px' }}>
                    <td style={{ padding: '16px 20px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                      <div style={{ fontWeight: '900', color: theme.text }}>{inv.number}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: theme.muted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#f97316" /> 
                        {(() => {
                           const safeDate = (dVal) => {
                             try {
                               if (!dVal) return 'N/A';
                               const dt = new Date(dVal);
                               if (isNaN(dt.getTime())) return 'N/A';
                               return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                             } catch(e) { return 'N/A'; }
                           };

                           const p = projects?.find(cp => inv.items?.some(i => i.description === cp.title)) || projects?.[0];
                           if (!p) return safeDate(inv.date);
                           
                           if (p.shootCustomDates !== undefined) return p.shootCustomDates;
                           
                           if (p.date) {
                              try {
                                const start = new Date(p.date);
                                if (isNaN(start.getTime())) return safeDate(inv.date);
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
                                return safeDate(p.date);
                              } catch(e) { return safeDate(inv.date); }
                           }
                           
                           return safeDate(inv.date);
                        })()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.muted, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.items?.map(i => i.description).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '900', color: '#10b981' }}>₹{(inv.items?.reduce((s, i) => s + (i.rate * i.qty), 0) || 0).toLocaleString()}</div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                      <button onClick={() => onViewInvoice && onViewInvoice(inv)} style={{ border: 'none', background: theme.card, color: '#f97316', padding: '8px', borderRadius: '10px', cursor: 'pointer', border: '1px solid ' + theme.border, transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#f9731620' : '#fff7ed'}
                              onMouseLeave={(e) => e.currentTarget.style.background = theme.card}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: theme.muted }}>
              <Clock size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p style={{ fontSize: '15px', fontWeight: '800' }}>No invoice history found for this client.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientDetails;
