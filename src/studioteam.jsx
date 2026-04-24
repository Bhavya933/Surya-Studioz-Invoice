import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Mail, Phone, MoreHorizontal, 
  Trash2, Edit2, X, Camera, Palette, Video, PenTool, Star, Check
} from 'lucide-react';

const ROLES = [
  { id: 'photographer', label: 'Photographer', icon: Camera, color: '#6366f1' },
  { id: 'videographer', label: 'Videographer', icon: Video, color: '#f97316' },
  { id: 'editor', label: 'Editor', icon: PenTool, color: '#10b981' },
  { id: 'assistant', label: 'Assistant', icon: Users, color: '#64748b' },
  { id: 'makeup', label: 'Makeup Artist', icon: Palette, color: '#ec4899' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const StudioTeam = ({ isDarkMode }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };

  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'photographer',
    email: '',
    phone: '',
    image: '',
    leaderId: '', // ID of the team leader
    isLeader: false, // Whether THIS person is a team leader
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/team`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Team Fetch Error:', err);
      // Fallback
      setMembers(JSON.parse(localStorage.getItem('studio_team') || '[]'));
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const saveToStorage = (updated) => {
    setMembers(updated);
    localStorage.setItem('studio_team', JSON.stringify(updated));
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    const dataToSave = { 
      ...formData, 
      leaderId: formData.isLeader ? '' : formData.leaderId,
      image_url: formData.image || `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    
    try {
      const url = editingMember ? `${API_URL}/team/${editingMember.id}` : `${API_URL}/team`;
      const method = editingMember ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      fetchMembers();
      closeModal();
    } catch (err) {
      alert('Action failed');
    }
  };

  const deleteMember = async (id) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await fetch(`${API_URL}/team/${id}`, { method: 'DELETE' });
        fetchMembers();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const openModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({ ...member });
    } else {
      setEditingMember(null);
      setFormData({ name: '', role: 'photographer', email: '', phone: '', image: '', leaderId: '', isLeader: false, bankName: '', accountNumber: '', ifscCode: '', upiId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const searchingMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const teamLeaders = members.filter(m => m.isLeader);

  const MemberCard = ({ member }) => {
    const roleInfo = ROLES.find(r => r.id === member.role) || ROLES[0];
    const RoleIcon = roleInfo.icon;
    
    return (
      <div style={{
        background: member.isLeader ? theme.card : (isDarkMode ? '#33415580' : '#ffffff80'),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${member.isLeader ? (isDarkMode ? '#f59e0b40' : '#f1f5f9') : theme.border}`,
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        boxShadow: member.isLeader ? '0 8px 30px rgba(245, 158, 11, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
        transition: 'all 0.3s ease',
      }}>
        {/* Actions */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
          <button onClick={() => openModal(member)} style={{ border: 'none', background: theme.bg, padding: '5px', borderRadius: '8px', cursor: 'pointer', color: theme.muted, border: '1px solid ' + theme.border }}>
            <Edit2 size={12} />
          </button>
          <button onClick={() => deleteMember(member.id)} style={{ border: 'none', background: isDarkMode ? '#ef444420' : '#fef2f2', padding: '5px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', border: '1px solid ' + (isDarkMode ? '#ef444440' : '#fee2e2') }}>
            <Trash2 size={12} />
          </button>
        </div>

        {/* Leader Badge */}
        {member.isLeader && (
          <div style={{ 
            position: 'absolute', 
            top: '12px', 
            left: '12px', 
            background: '#fef3c7', 
            color: '#d97706', 
            fontSize: '9px', 
            fontWeight: '900', 
            padding: '3px 6px', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            border: '1px solid #fde68a'
          }}>
            <Star size={9} fill="#d97706" /> LEAD
          </div>
        )}

        {/* Profile Image */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <img 
            src={member.image} 
            alt={member.name} 
            style={{ width: '60px', height: '60px', borderRadius: '18px', objectFit: 'cover', border: member.isLeader ? '3px solid #f59e0b' : `3px solid ${theme.card}`, boxShadow: '0 6px 15px rgba(0,0,0,0.1)' }} 
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '-4px', 
            right: '-4px', 
            background: roleInfo.color, 
            padding: '5px', 
            borderRadius: '10px', 
            color: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            border: '2px solid ' + theme.card
          }}>
            <RoleIcon size={12} />
          </div>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: '800', color: theme.text, margin: '0 0 2px 0' }}>{member.name}</h3>
        <p style={{ 
          fontSize: '11px', 
          fontWeight: '700', 
          color: roleInfo.color, 
          background: `${roleInfo.color}${isDarkMode ? '30' : '15'}`, 
          padding: '2px 10px', 
          borderRadius: '20px',
          marginBottom: '16px'
        }}>
          {roleInfo.label}
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.muted, fontSize: '12px' }}>
            <Mail size={12} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.muted, fontSize: '12px' }}>
            <Phone size={12} /> <span>{member.phone}</span>
          </div>
        </div>

        {/* Account Details for Leaders */}
        {member.isLeader && (
          <div style={{ 
            width: '100%', 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid ' + theme.border,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: theme.muted, letterSpacing: '0.05em' }}>ACCOUNT DETAILS</p>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>
              <span style={{ color: theme.muted }}>Bank:</span> {member.bankName || 'N/A'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>
              <span style={{ color: theme.muted }}>Acc:</span> {member.accountNumber || 'N/A'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>
              <span style={{ color: theme.muted }}>IFSC:</span> {member.ifscCode || 'N/A'}
            </div>
            {member.upiId && (
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1' }}>
                <span style={{ color: theme.muted }}>UPI:</span> {member.upiId}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: theme.text, margin: '0 0 4px 0' }}>Studio Team</h1>
          <p style={{ color: theme.muted, fontSize: '14px', margin: 0 }}>Manage leads and their associated team members</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={20} color={theme.muted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '12px 14px 12px 42px', borderRadius: '16px', border: '1px solid ' + theme.border, width: '100%', fontSize: '14px', outline: 'none', background: theme.inputBg, color: theme.text, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            />
          </div>
          <button 
            onClick={() => openModal()}
            style={{
              background: '#f97316',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '16px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
            }}
          >
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      {/* Render Teams */}
      {teamLeaders.map(leader => (
        <div key={leader.id} style={{
          background: theme.card,
          borderRadius: '32px',
          padding: '32px',
          border: '1px solid ' + theme.border,
          boxShadow: '0 4px 30px rgba(0,0,0,0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#f59e0b', color: '#fff', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text }}>Team {leader.name.split(' ')[0]}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: theme.muted }}>Lead by {leader.name} ({ROLES.find(r => r.id === leader.role)?.label})</p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            paddingBottom: '12px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div style={{ flexShrink: 0, width: '220px' }}>
              <MemberCard member={leader} />
            </div>
            {searchingMembers
              .filter(m => m.leaderId === leader.id && !m.isLeader)
              .map(member => (
                <div key={member.id} style={{ flexShrink: 0, width: '220px' }}>
                  <MemberCard member={member} />
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Independent Members Section */}
      {searchingMembers.filter(m => !m.leaderId && !m.isLeader).length > 0 && (
        <div style={{ padding: '0 12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '24px', color: theme.muted, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Independent / Unassigned
            <div style={{ height: '2px', flex: 1, background: theme.border }} />
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            paddingBottom: '12px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {searchingMembers
              .filter(m => !m.leaderId && !m.isLeader)
              .map(member => (
                <div key={member.id} style={{ flexShrink: 0, width: '220px' }}>
                  <MemberCard member={member} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {members.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px', background: theme.card, borderRadius: '32px', border: '1px dashed ' + theme.border }}>
          <Users size={64} color={theme.muted} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: theme.text, fontWeight: '800' }}>Build Your Team</h2>
          <p style={{ color: theme.muted, maxWidth: '300px', margin: '0 auto 24px auto' }}>Start by adding team leaders and assign members to them.</p>
          <button onClick={() => openModal()} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' }}>Add First Member</button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: theme.card,
            borderRadius: '32px',
            width: '100%',
            maxWidth: '520px',
            padding: '40px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid ' + theme.border
          }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: theme.bg, padding: '8px', borderRadius: '12px', cursor: 'pointer', color: theme.muted, border: '1px solid ' + theme.border }}>
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.text, marginBottom: '32px' }}>
              {editingMember ? 'Edit Team Profile' : 'New Team Member'}
            </h2>

            <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Leader Toggle */}
              <div 
                onClick={() => setFormData({ ...formData, isLeader: !formData.isLeader, leaderId: !formData.isLeader ? '' : formData.leaderId })}
                style={{ 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: `2px solid ${formData.isLeader ? '#f59e0b' : theme.border}`,
                  background: formData.isLeader ? (isDarkMode ? '#f59e0b20' : '#fffbeb') : theme.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: formData.isLeader ? '#f59e0b' : theme.card, color: formData.isLeader ? '#fff' : theme.muted, padding: '8px', borderRadius: '10px', border: '1px solid ' + theme.border }}>
                    <Star size={18} fill={formData.isLeader ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: formData.isLeader ? '#f59e0b' : theme.text }}>Team Leader</p>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.muted }}>Allows other members to be grouped under them</p>
                  </div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '8px', border: '2px solid ' + theme.muted, background: formData.isLeader ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {formData.isLeader && <Check size={16} strokeWidth={4} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Full Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="Rahul Kumar" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Primary Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }}>
                    {ROLES.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
                  </select>
                </div>
              </div>

              {!formData.isLeader && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Assign Team Leader</label>
                  <select value={formData.leaderId} onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }}>
                    <option value="">Independent / Not Assigned</option>
                    {teamLeaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Email</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="rahul@host.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Phone</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="+91 ..." />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: theme.muted, marginBottom: '8px' }}>Profile Photo URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '14px', border: '1px solid ' + theme.border, fontSize: '14px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="https://unsplash..." />
              </div>

              {/* Account Details Section for Leaders */}
              {formData.isLeader && (
                <div style={{ background: isDarkMode ? '#1e293b50' : '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid ' + theme.border, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#f59e0b', letterSpacing: '0.05em' }}>PAYMENT & BANKING DETAILS</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '6px' }}>Bank Name</label>
                      <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '13px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="HDFC, SBI, etc." />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '6px' }}>UPI ID</label>
                      <input type="text" value={formData.upiId} onChange={(e) => setFormData({ ...formData, upiId: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '13px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="name@upi" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '6px' }}>Account Number</label>
                      <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '13px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="0000 0000 0000" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '6px' }}>IFSC Code</label>
                      <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid ' + theme.border, fontSize: '13px', outline: 'none', background: theme.bg, color: theme.text }} placeholder="HDFC0001234" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" style={{ background: '#f97316', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: '12px', boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)' }}>
                {editingMember ? 'Save Changes' : 'Create Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioTeam;
