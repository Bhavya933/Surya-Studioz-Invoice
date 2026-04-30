import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  DollarSign, ArrowLeft, Plus, ExternalLink, 
  MessageCircle, Star, Clock, FileText, ChevronRight, ChevronLeft, X,
  Trash2, Edit3, Camera, Check, Users, Award, 
  CheckSquare, Square, CalendarDays, PlusCircle, AlertCircle, HardDrive, Film, BookOpen, PartyPopper, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientDetails = ({ client, onBack, onNewInvoice, onViewInvoice, isDarkMode }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#e2e8f0',
    primary: '#f97316'
  };

  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusSteps = ['Upcoming', 'Team Assigned', 'Data Status', 'Editing', 'Delivered'];
  const allServices = ['Traditional Photo', 'Traditional Video', 'Cinematography', 'Candid Photo', 'Drone'];
  const editingServices = ['Cinematic Highlight', 'Traditional Edit', 'Reels', 'Teaser', 'Full Film'];

  const fetchData = async () => {
    if (!client?.name) return;
    const cleanName = client.name.trim();
    setIsLoading(true);
    try {
      const savedTeam = JSON.parse(localStorage.getItem('studio_team') || '[]');
      setTeamMembers(Array.isArray(savedTeam) ? savedTeam : []);
      const res = await fetch(`${API_URL}/projects/${encodeURIComponent(cleanName)}`);
      if (res.ok) {
        let data = await res.json();
        let projectsArray = Array.isArray(data) ? data : [];
        if (projectsArray.length === 0) {
          const allHistory = JSON.parse(localStorage.getItem('invoice_history') || '[]');
          const clientInvoices = allHistory.filter(inv => inv?.client?.name?.trim().toLowerCase() === cleanName.toLowerCase());
          if (clientInvoices.length > 0) {
            const latest = clientInvoices[0];
            const autoP = { clientName: cleanName, title: latest.items?.[0]?.description || 'Project Event', date: latest.date || new Date().toISOString().split('T')[0], status: 'Upcoming', budget: latest.total || '0' };
            await fetch(`${API_URL}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(autoP) });
            const finalRes = await fetch(`${API_URL}/projects/${encodeURIComponent(cleanName)}`);
            projectsArray = await finalRes.json();
          }
        }
        setProjects(Array.isArray(projectsArray) ? projectsArray : []);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [client?.name]);

  const updateStatus = async (id, currentStatus, direction) => {
    const currentIndex = statusSteps.indexOf(currentStatus);
    const newIndex = direction === 'next' ? Math.min(statusSteps.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    updateProjectProperty(id, 'status', statusSteps[newIndex]);
  };

  const updateProjectProperty = async (id, property, value) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [property]: value } : p));
    try {
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [property]: value })
      });
    } catch (err) { console.error(err); }
  };

  const toggleService = (id, currentServices, service) => {
    const updated = (currentServices || []).includes(service) 
      ? currentServices.filter(s => s !== service)
      : [...(currentServices || []), service];
    updateProjectProperty(id, 'selectedServices', updated);
  };

  const toggleEditingService = (id, currentServices, service) => {
    const updated = (currentServices || []).includes(service) 
      ? currentServices.filter(s => s !== service)
      : [...(currentServices || []), service];
    updateProjectProperty(id, 'editingServices', updated);
  };

  const addScheduleDate = (projectId, currentSchedule) => {
    const newDate = { id: Date.now(), date: '', services: [], team: [] };
    const updated = Array.isArray(currentSchedule) ? [...currentSchedule, newDate] : [newDate];
    updateProjectProperty(projectId, 'schedule', updated);
  };

  const updateScheduleItem = (projectId, currentSchedule, itemId, property, value) => {
    const updated = currentSchedule.map(item => item.id === itemId ? { ...item, [property]: value } : item);
    updateProjectProperty(projectId, 'schedule', updated);
  };

  const removeScheduleItem = (projectId, currentSchedule, itemId) => {
    const updated = currentSchedule.filter(item => item.id !== itemId);
    updateProjectProperty(projectId, 'schedule', updated);
  };

  const sendWhatsAppMsg = (p, type) => {
    let leadId = '';
    if (type === 3) leadId = p.assignedEditor?.[0];
    else if (type === 4) leadId = p.assignedDesigner?.[0];
    else if (type === 5 || type === 6) { /* Client Msg */ }
    else leadId = p.assignedTeam?.[0];

    let phone = '';
    let name = '';

    if (type === 5 || type === 6) {
      phone = client.phone;
      name = client.name;
    } else {
      const person = teamMembers.find(m => String(m.id) === String(leadId));
      if (!person || !person.phone) { alert('Please assign a person with a phone number first!'); return; }
      phone = person.phone;
      name = person.name;
    }

    if (!phone) { alert('No phone number available!'); return; }

    const scheduleStr = (p.schedule || []).map(s => `${s.date}: ${s.services.join(', ')}`).join('\n');
    let message = '';

    if (type === 1) {
      message = `*EVENT ASSIGNMENT - SURYA STUDIOZ*\n\nHello ${name}!\nYou are assigned as *LEAD* for:\n📌 *${p.title}*\n📍 Venue: ${p.venue || 'TBA'}\n📅 Dates:\n${scheduleStr || p.date}\n💰 Crew Budget: ₹${p.teamPrice || '0'}\n\nPlease confirm.`;
      updateProjectProperty(p.id, 'msg1Sent', true);
    } else if (type === 2) {
      message = `*URGENT: EVENT COMPLETION*\n\nHello ${name}!\nPlease deliver data and collect payment today. Reminder: Data must be delivered within 2 days. Fine ₹500/day after that.`;
      updateProjectProperty(p.id, 'msg2Sent', true);
    } else if (type === 3) {
      const edServices = (p.editingServices || []).join(', ');
      const deadline = p.deadlineDate ? new Date(p.deadlineDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ASAP';
      message = `*VIDEO EDITING ASSIGNMENT - SURYA STUDIOZ*\n\nHello ${name}!\nYou have been assigned to edit the project: *${p.title}*.\n\n✅ *WORK DETAILS*:\n📌 Tasks: ${edServices || 'All Editing'}\n🎞️ Reels: ${p.reelsCount || '0'}\n📅 *DEADLINE: ${deadline}*\n\n💾 *DATA STATUS*: ${p.dataToEditor || 'PENDING'}\n💰 *YOUR TOTAL FEE: ₹${p.editorPrice || '0'}*\n\nPlease confirm. Thanks!`;
      updateProjectProperty(p.id, 'editorMsgSent', true);
    } else if (type === 4) {
      const deadline = p.albumDeadline ? new Date(p.albumDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ASAP';
      message = `*ALBUM DESIGN ASSIGNMENT - SURYA STUDIOZ*\n\nHello ${name}!\nYou have been assigned to design the Album for: *${p.title}*.\n\n📅 *DEADLINE: ${deadline}*\n💾 Data Status: ${p.dataToDesigner || 'PENDING'}\n💰 Your Fee: ₹${p.albumPrice || '0'}\n\nPlease start the design. Thanks!`;
      updateProjectProperty(p.id, 'designerMsgSent', true);
    } else if (type === 5) {
      const delivery = p.deliveryDeadline ? new Date(p.deliveryDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Soon';
      message = `*PROJECT UPDATE - SURYA STUDIOZ*\n\nHello ${name}!\nWe are happy to inform you that your project *${p.title}* data has been received and sent for editing.\n\n🎥 *Status*: Under Production\n📅 *Expected Delivery*: ${delivery}\n\nWe will notify you once it's ready. Thank you for your patience!`;
      updateProjectProperty(p.id, 'clientMsgSent', true);
    } else if (type === 6) {
      message = `*CONGRATULATIONS! - SURYA STUDIOZ*\n\nHello ${name}!\nWe are thrilled to inform you that your project *${p.title}* is now officially DELIVERED! 🎊🎥\n\nIt was a wonderful experience capturing your special moments. We hope you love the final results! Please let us know your feedback.\n\nBest regards,\nTeam Surya Studioz ✨`;
      updateProjectProperty(p.id, 'happyMsgSent', true);
    }

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const displayProjects = useMemo(() => {
    return projects.filter((p, index, self) =>
      index === self.findIndex((t) => (t.title === p.title && t.date === p.date))
    );
  }, [projects]);

  const renderSlideContent = (p) => {
    const inputStyle = { padding: '10px 14px', borderRadius: '10px', background: theme.bg, color: theme.text, border: '1px solid ' + theme.border, fontSize: '13px', fontWeight: '600' };
    const labelStyle = { fontSize: '10px', fontWeight: '800', color: theme.muted, letterSpacing: '0.5px' };

    switch (p.status) {
      case 'Upcoming':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={labelStyle}>EVENT TITLE</label><input value={p.title} onChange={e => updateProjectProperty(p.id, 'title', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>EVENT DATE</label><input type="date" value={p.date?.split('T')[0]} onChange={e => updateProjectProperty(p.id, 'date', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>LOCATION</label><input value={p.venue || ''} onChange={e => updateProjectProperty(p.id, 'venue', e.target.value)} placeholder="Venue..." style={inputStyle} /></div>
            </div>
            <div>
              <label style={labelStyle}>SERVICES REQUIRED</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                {allServices.map(s => {
                  const isSelected = (p.selectedServices || []).includes(s);
                  return (
                    <div key={s} onClick={() => toggleService(p.id, p.selectedServices, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: isSelected ? theme.primary + '10' : 'transparent', border: '1px solid ' + (isSelected ? theme.primary : theme.border), cursor: 'pointer' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid ' + (isSelected ? theme.primary : theme.muted), background: isSelected ? theme.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <Check size={12} color="white" />}</div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? theme.text : theme.muted }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'Team Assigned':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={labelStyle}>TEAM LEADER & WHATSAPP</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <div onClick={() => sendWhatsAppMsg(p, 1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '8px', background: p.msg1Sent ? '#10b98120' : theme.bg, border: '1px solid ' + (p.msg1Sent ? '#10b981' : theme.border) }}>
                         <MessageCircle size={16} color={p.msg1Sent ? '#10b981' : '#25D366'} />
                         <span style={{ fontSize: '9px', fontWeight: '900', color: p.msg1Sent ? '#10b981' : theme.text }}>MSG 1</span>
                         {p.msg1Sent ? <Check size={10} color="#10b981" /> : null}
                       </div>
                       <div onClick={() => sendWhatsAppMsg(p, 2)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '8px', background: p.msg2Sent ? '#10b98120' : theme.bg, border: '1px solid ' + (p.msg2Sent ? '#10b981' : theme.border) }}>
                         <MessageCircle size={16} color={p.msg2Sent ? '#10b981' : '#25D366'} />
                         <span style={{ fontSize: '9px', fontWeight: '900', color: p.msg2Sent ? '#10b981' : theme.text }}>MSG 2</span>
                         {p.msg2Sent ? <Check size={10} color="#10b981" /> : null}
                       </div>
                    </div>
                  </div>
                  <select value={p.assignedTeam?.[0] || ''} onChange={e => updateProjectProperty(p.id, 'assignedTeam', [e.target.value])} style={{ ...inputStyle, width: '100%', marginTop: '10px' }}>
                    <option value="">Select Team Leader...</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1.5px dashed ' + theme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div><span style={labelStyle}>TOTAL CREW COST</span><div style={{ fontSize: '20px', fontWeight: '900', color: theme.primary }}>₹{Number(p.teamPrice || 0).toLocaleString()}</div></div>
                   <input type="number" placeholder="Total Cost" value={p.teamPrice || ''} onChange={e => updateProjectProperty(p.id, 'teamPrice', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                </div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={labelStyle}>EVENT SCHEDULE</span>
                <button onClick={() => addScheduleDate(p.id, p.schedule)} style={{ background: theme.primary, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>+ Add Day</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(p.schedule || []).map((item) => (
                   <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px', gap: '20px', alignItems: 'center', background: theme.bg, padding: '14px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                      <input type="date" value={item.date} onChange={e => updateScheduleItem(p.id, p.schedule, item.id, 'date', e.target.value)} style={inputStyle} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {allServices.map(s => {
                          const isSel = (item.services || []).includes(s);
                          return <div key={s} onClick={() => {
                            const newS = isSel ? item.services.filter(x => x !== s) : [...(item.services || []), s];
                            updateScheduleItem(p.id, p.schedule, item.id, 'services', newS);
                          }} style={{ fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '8px', background: isSel ? theme.primary : 'transparent', color: isSel ? 'white' : theme.muted, border: '1px solid ' + (isSel ? theme.primary : theme.border), cursor: 'pointer' }}>{s}</div>
                        })}
                      </div>
                      <Trash2 size={18} color="#ef4444" onClick={() => removeScheduleItem(p.id, p.schedule, item.id)} style={{ cursor: 'pointer' }} />
                   </div>
                ))}
             </div>
          </div>
        );
      case 'Data Status':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: theme.bg, padding: '24px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                    <span style={labelStyle}>INITIAL DATA RECEIVED FROM TEAM</span>
                    <div onClick={() => updateProjectProperty(p.id, 'dataFromClient', p.dataFromClient === 'Received' ? 'Pending' : 'Received')} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <div style={{ width: '44px', height: '22px', borderRadius: '12px', background: p.dataFromClient === 'Received' ? '#22c55e' : theme.muted + '40', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '3px', left: p.dataFromClient === 'Received' ? '25px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '900' }}>{p.dataFromClient || 'PENDING'}</span>
                    </div>
                </div>
                <div style={{ background: theme.bg, padding: '24px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                    <span style={labelStyle}>DATA SENT TO STUDIO FOR EDITING</span>
                    <div onClick={() => updateProjectProperty(p.id, 'dataToStudio', p.dataToStudio === 'Sent' ? 'In Studio' : 'Sent')} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <div style={{ width: '44px', height: '22px', borderRadius: '12px', background: p.dataToStudio === 'Sent' ? '#f97316' : theme.muted + '40', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '3px', left: p.dataToStudio === 'Sent' ? '25px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '900' }}>{p.dataToStudio || 'IN STUDIO'}</span>
                    </div>
                </div>
             </div>

             <div style={{ background: theme.card, padding: '24px', borderRadius: '20px', border: '1px solid ' + theme.border, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={labelStyle}>NOTIFY CLIENT ABOUT PRODUCTION</span>
                      <div onClick={() => sendWhatsAppMsg(p, 5)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '10px', background: p.clientMsgSent ? '#10b98120' : theme.primary + '10', border: '1px solid ' + (p.clientMsgSent ? '#10b981' : theme.primary) }}>
                         <MessageCircle size={18} color={p.clientMsgSent ? '#10b981' : '#25D366'} />
                         <span style={{ fontSize: '11px', fontWeight: '900', color: p.clientMsgSent ? '#10b981' : theme.text }}>{p.clientMsgSent ? 'MESSAGE SENT ✅' : 'NOTIFY CLIENT'}</span>
                      </div>
                   </div>
                   <p style={{ fontSize: '12px', color: client.phone ? theme.muted : '#ef4444', marginTop: '10px', fontWeight: '800' }}>
                      {client.phone ? `Sends a professional update to ${client.name} via WhatsApp.` : `⚠️ Phone number for ${client.name} is missing!`}
                   </p>
                </div>
                <div>
                   <label style={labelStyle}>EXPECTED DELIVERY DATE</label>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <CalendarDays size={20} color={theme.primary} />
                      <input type="date" value={p.deliveryDeadline || ''} onChange={e => updateProjectProperty(p.id, 'deliveryDeadline', e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                   </div>
                </div>
             </div>
          </div>
        );
      case 'Editing':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={labelStyle}>ASSIGN EDITOR & NOTIFY</span>
                    <div onClick={() => sendWhatsAppMsg(p, 3)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '8px', background: p.editorMsgSent ? '#10b98120' : theme.bg, border: '1px solid ' + (p.editorMsgSent ? '#10b981' : theme.border) }}>
                       <MessageCircle size={16} color="#25D366" />
                       <span style={{ fontSize: '9px', fontWeight: '900', color: p.editorMsgSent ? '#10b981' : theme.text }}>{p.editorMsgSent ? 'SENT' : 'NOTIFY'}</span>
                       {p.editorMsgSent ? <Check size={10} color="#10b981" /> : null}
                    </div>
                  </div>
                  <select value={p.assignedEditor?.[0] || ''} onChange={e => updateProjectProperty(p.id, 'assignedEditor', [e.target.value])} style={{ ...inputStyle, width: '100%', marginTop: '10px' }}>
                    <option value="">Select Editor...</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                   <span style={labelStyle}>DATA TRANSFER STATUS (EDITOR)</span>
                   <div onClick={() => updateProjectProperty(p.id, 'dataToEditor', p.dataToEditor === 'Sent' ? 'Pending' : 'Sent')} style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <div style={{ width: '40px', height: '20px', borderRadius: '10px', background: p.dataToEditor === 'Sent' ? '#22c55e' : theme.muted + '40', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '2px', left: p.dataToEditor === 'Sent' ? '22px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800' }}>{p.dataToEditor || 'PENDING'}</span>
                   </div>
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border }}>
                  <label style={labelStyle}>EDITING REQUIREMENTS</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {editingServices.map(s => {
                      const isSel = (p.editingServices || []).includes(s);
                      return <div key={s} onClick={() => toggleEditingService(p.id, p.editingServices, s)} style={{ fontSize: '10px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', background: isSel ? theme.primary + '10' : 'transparent', border: '1px solid ' + (isSel ? theme.primary : theme.border), color: isSel ? theme.primary : theme.muted, cursor: 'pointer' }}>{s}</div>
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                     {(p.editingServices || []).includes('Reels') && (
                        <div>
                           <label style={labelStyle}>REELS COUNT</label>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                              <Film size={16} color={theme.primary} />
                              <input type="number" placeholder="0" value={p.reelsCount || ''} onChange={e => updateProjectProperty(p.id, 'reelsCount', e.target.value)} style={{ ...inputStyle, padding: '6px 10px', width: '100%' }} />
                           </div>
                        </div>
                     )}
                     <div style={{ gridColumn: (p.editingServices || []).includes('Reels') ? 'auto' : 'span 2' }}>
                        <label style={labelStyle}>FINISH DEADLINE</label>
                        <input type="date" value={p.deadlineDate || ''} onChange={e => updateProjectProperty(p.id, 'deadlineDate', e.target.value)} style={{ ...inputStyle, padding: '6px 10px', width: '100%', marginTop: '6px' }} />
                     </div>
                  </div>
                </div>
                <div style={{ background: theme.bg, padding: '20px', borderRadius: '16px', border: '1.5px dashed ' + theme.border, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <span style={labelStyle}>EDITOR TOTAL FEE</span>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: theme.primary }}>₹{Number(p.editorPrice || 0).toLocaleString()}</div>
                      <input type="number" placeholder="Fee ₹" value={p.editorPrice || ''} onChange={e => updateProjectProperty(p.id, 'editorPrice', e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                   </div>
                </div>
             </div>
             <div style={{ background: theme.card, padding: '20px', borderRadius: '20px', border: '1px solid ' + theme.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={20} color={theme.primary} />
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900' }}>ALBUM DESIGN SYSTEM</h3>
                   </div>
                   <div onClick={() => updateProjectProperty(p.id, 'albumRequired', !p.albumRequired)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', background: p.albumRequired ? theme.primary + '20' : theme.bg, border: '1px solid ' + (p.albumRequired ? theme.primary : theme.border) }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid ' + theme.primary, background: p.albumRequired ? theme.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.albumRequired ? <Check size={12} color="white" /> : null}</div>
                      <span style={{ fontSize: '11px', fontWeight: '800' }}>{p.albumRequired ? 'REQUIRED' : 'NOT REQUIRED'}</span>
                   </div>
                </div>
                {p.albumRequired ? (
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                      <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={labelStyle}>ASSIGN DESIGNER</label>
                            <div onClick={() => sendWhatsAppMsg(p, 4)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '6px', background: p.designerMsgSent ? '#10b98115' : 'transparent', border: '1px solid ' + (p.designerMsgSent ? '#10b981' : 'transparent') }}>
                               <MessageCircle size={15} color={p.designerMsgSent ? '#10b981' : '#25D366'} />
                               {p.designerMsgSent ? <span style={{ fontSize: '8px', fontWeight: '900', color: '#10b981' }}>SENT ✅</span> : null}
                            </div>
                         </div>
                         <select value={p.assignedDesigner?.[0] || ''} onChange={e => updateProjectProperty(p.id, 'assignedDesigner', [e.target.value])} style={{ ...inputStyle, width: '100%', marginTop: '8px' }}>
                            <option value="">Select Designer...</option>
                            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label style={labelStyle}>DATA TO DESIGNER</label>
                         <div onClick={() => updateProjectProperty(p.id, 'dataToDesigner', p.dataToDesigner === 'Sent' ? 'Pending' : 'Sent')} style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div style={{ width: '36px', height: '18px', borderRadius: '10px', background: p.dataToDesigner === 'Sent' ? '#22c55e' : theme.muted + '40', position: 'relative' }}>
                               <div style={{ position: 'absolute', top: '2px', left: p.dataToDesigner === 'Sent' ? '20px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '800' }}>{p.dataToDesigner || 'PENDING'}</span>
                         </div>
                      </div>
                      <div>
                         <label style={labelStyle}>ALBUM DEADLINE</label>
                         <input type="date" value={p.albumDeadline || ''} onChange={e => updateProjectProperty(p.id, 'albumDeadline', e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: '8px' }} />
                      </div>
                      <div>
                         <label style={labelStyle}>DESIGNER FEE</label>
                         <input type="number" placeholder="₹ Fee" value={p.albumPrice || ''} onChange={e => updateProjectProperty(p.id, 'albumPrice', e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: '8px' }} />
                      </div>
                   </div>
                ) : null}
             </div>
          </div>
        );
      case 'Delivered':
        return (
          <div style={{ textAlign: 'center', padding: '40px', position: 'relative', overflow: 'hidden' }}>
             {/* Crackers Animation Effect */}
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                {[...Array(20)].map((_, i) => (
                   <div key={i} className="confetti" style={{ 
                      position: 'absolute', 
                      width: '10px', height: '10px', 
                      background: ['#f97316', '#22c55e', '#3b82f6', '#e879f9', '#facc15'][i % 5],
                      top: '-10%', left: Math.random() * 100 + '%',
                      borderRadius: i % 2 === 0 ? '50%' : '2px',
                      animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                      animationDelay: Math.random() * 5 + 's'
                   }} />
                ))}
             </div>
             <style>{`
                @keyframes fall {
                   to { transform: translateY(110vh) rotate(720deg); }
                }
             `}</style>

             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#22c55e15', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'bounce 2s infinite' }}><Award size={40} /></div>
             <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', color: theme.text }}>PROJECT DELIVERED!</h2>
             <p style={{ color: theme.muted, marginTop: '8px', fontSize: '15px', fontWeight: '600' }}>Congratulations! All tasks have been successfully completed.</p>
             
             <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => sendWhatsAppMsg(p, 6)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', boxShadow: '0 10px 25px rgba(37, 211, 102, 0.3)' }}>
                   <PartyPopper size={22} />
                   {p.happyMsgSent ? 'HAPPY MESSAGE SENT ✅' : 'SEND HAPPY MESSAGE TO CLIENT'}
                </button>
                <span style={{ fontSize: '12px', color: theme.muted, fontWeight: '700' }}>Celebrate the completion with a personalized WhatsApp message!</span>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ padding: '20px 0', minHeight: '100%', color: theme.text, background: theme.bg }}>
      <style>{`
        @keyframes slideFade {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', color: theme.muted, cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}><ArrowLeft size={16} /> Back</button>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>Logistics Analyzer</h2>
        <div style={{ width: '40px' }} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: theme.muted }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Loading Details...</span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : (
        <>
      {displayProjects.map(p => (
        <div key={p.id} style={{ background: theme.card, borderRadius: '24px', border: '1px solid ' + theme.border, overflow: 'hidden', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '18px 32px', borderBottom: '1px solid ' + theme.border, background: theme.bg + '30' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '750px', margin: '0 auto' }}>
              {statusSteps.map((s, i) => {
                const isActive = p.status === s;
                const isDone = statusSteps.indexOf(p.status) > i;
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: isActive || isDone ? 1 : 0.4 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDone ? '#22c55e' : (isActive ? theme.primary : theme.border), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>{isDone ? <Check size={14} /> : i + 1}</div>
                    <span style={{ fontSize: '9px', fontWeight: '800' }}>{s.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
               <div>
                 <span style={{ background: theme.primary + '10', color: theme.primary, padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>STEP {statusSteps.indexOf(p.status) + 1}</span>
                 <h2 style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: '950' }}>{p.status} Details</h2>
               </div>
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => updateStatus(p.id, p.status, 'prev')} disabled={p.status === 'Upcoming'} style={{ padding: '10px', borderRadius: '50%', border: '1px solid ' + theme.border, background: theme.card, color: theme.text, cursor: 'pointer', opacity: p.status === 'Upcoming' ? 0.3 : 1 }}><ChevronLeft size={20} /></button>
                 <button onClick={() => updateStatus(p.id, p.status, 'next')} disabled={p.status === 'Delivered'} style={{ padding: '10px 24px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', opacity: p.status === 'Delivered' ? 0.3 : 1 }}>Next Phase <ChevronRight size={18} /></button>
               </div>
            </div>
            <div key={p.status} style={{ animation: 'slideFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {renderSlideContent(p)}
            </div>
          </div>

          <div style={{ padding: '16px 40px', background: theme.bg + '50', borderTop: '1px solid ' + theme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ fontSize: '15px', fontWeight: '900' }}>₹{Number(p.budget || 0).toLocaleString()}</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: theme.muted }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
             </div>
             <button onClick={() => { if(window.confirm('Delete project?')) { fetch(`${API_URL}/projects/delete/${p.id}`).then(() => fetchData()); } }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={18} /></button>
          </div>
        </div>
      ))}
      </>
      )}
    </div>
  );
};

export default ClientDetails;
