import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, X, Check, 
  Pin, Tag, Calendar, MessageSquare, AlertCircle,
  Camera, User, Lightbulb, Clock, Inbox, RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  { id: 'general', label: 'General', color: '#64748b', bg: '#f1f5f9', icon: Inbox },
  { id: 'creative', label: 'Creative', color: '#6366f1', bg: '#eef2ff', icon: Lightbulb },
  { id: 'client', label: 'Client', color: '#10b981', bg: '#f0fdf4', icon: User },
  { id: 'urgent', label: 'Urgent', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Notes = ({ isDarkMode }) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };

  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false
  });

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/notes`);
      const data = await res.json();
      setNotes(data.map(n => ({ ...n, date: n.created_at }))); // Map created_at to date for UI
    } catch (err) {
      console.error('Notes Load Error:', err);
      setNotes(JSON.parse(localStorage.getItem('studio_notes') || '[]'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const saveNotes = (updated) => {
    setNotes(updated);
    localStorage.setItem('studio_notes', JSON.stringify(updated));
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      const url = editingNote ? `${API_URL}/notes/${editingNote.id}` : `${API_URL}/notes`;
      const method = editingNote ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      fetchNotes();
      closeModal();
    } catch (err) {
      alert('Action failed');
    }
  };

  const deleteNote = async (id) => {
    if (window.confirm('Delete this note?')) {
      try {
        await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
        fetchNotes();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const togglePin = (id) => {
    const updated = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    saveNotes(updated);
  };

  const openModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({ ...note });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', category: 'general', isPinned: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const NoteCard = ({ note }) => {
    const catInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];
    const CatIcon = catInfo.icon;
    
    return (
      <div style={{
        background: theme.card,
        borderRadius: '28px',
        padding: '28px',
        border: '1px solid ' + theme.border,
        boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        animation: 'notePop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
      className="note-card"
      >
        {/* Category Indicator Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: catInfo.color }} />

        {/* Note Actions */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => togglePin(note.id)} 
            style={{ 
              border: 'none', background: note.isPinned ? '#f9731620' : 'transparent', cursor: 'pointer',
              color: note.isPinned ? '#f97316' : theme.muted, padding: '6px', borderRadius: '10px'
            }}
          >
            <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
          <div className="card-controls" style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => openModal(note)} style={{ border: 'none', background: theme.bg, padding: '6px', borderRadius: '10px', cursor: 'pointer', color: theme.muted, border: '1px solid ' + theme.border }}>
              <Edit2 size={16} />
            </button>
            <button onClick={() => deleteNote(note.id)} style={{ border: 'none', background: (isDarkMode ? '#ef444420' : '#fef2f2'), padding: '6px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', border: '1px solid ' + (isDarkMode ? '#ef444440' : '#fee2e2') }}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: catInfo.bg + (isDarkMode ? '20' : ''), color: catInfo.color }}>
            <CatIcon size={18} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: catInfo.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catInfo.label}</p>
            <span style={{ fontSize: '11px', color: theme.muted, fontWeight: '700' }}>
               {new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text, lineHeight: '1.3' }}>{note.title}</h3>
        <p style={{ margin: 0, fontSize: '15px', color: theme.muted, lineHeight: '1.7', flex: 1 }}>{note.content}</p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: theme.text, margin: '0 0 6px 0' }}>Creative Studio Notes</h1>
          <p style={{ color: theme.muted, fontSize: '15px', margin: 0, fontWeight: '500' }}>Manage project checklists, client ideas, and creative thoughts</p>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={20} color={theme.muted} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filter your notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '14px 16px 14px 48px', borderRadius: '20px', border: '1px solid ' + theme.border, width: '100%', fontSize: '15px', outline: 'none', background: theme.inputBg, color: theme.text, transition: '0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
            />
          </div>
          <button 
            onClick={() => openModal()}
            style={{
              background: '#f97316',
              color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '20px', fontWeight: '900', fontSize: '15px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)', transition: '0.3s ease'
            }}
            className="add-note-btn"
          >
            <Plus size={22} strokeWidth={3} /> Create New
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: theme.muted }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Loading Data...</span>
          </div>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: '28px' 
        }}>
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '100px 0' }}>
           <div style={{ background: theme.card, padding: '30px', borderRadius: '40px', color: theme.muted, border: '1px solid ' + theme.border }}>
              <Inbox size={60} />
           </div>
           <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: theme.text, margin: '0 0 8px 0' }}>Your idea shelf is empty</h3>
              <p style={{ color: theme.muted, fontSize: '15px', margin: 0 }}>Start by creating your first creative note</p>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '24px'
        }}>
          <div style={{
            background: theme.card, width: '100%', maxWidth: '750px', padding: '54px', borderRadius: '48px', position: 'relative',
            boxShadow: '0 40px 80px -12px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column',
            animation: 'modalScale 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid ' + theme.border
          }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '32px', right: '32px', border: 'none', background: theme.bg, padding: '12px', borderRadius: '18px', cursor: 'pointer', color: theme.muted, transition: '0.2s', border: '1px solid ' + theme.border }}>
              <X size={26} />
            </button>

            <div style={{ marginBottom: '44px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '34px', fontWeight: '900', color: theme.text, margin: '0 0 12px 0' }}>
                {editingNote ? 'Refine Your Studio Note' : 'Draft a New Creative Idea'}
              </h2>
              <p style={{ color: theme.muted, fontSize: '17px', fontWeight: '500' }}>
                {editingNote ? 'Keep your studio records up to date' : 'Capture your professional creativity before it fades'}
              </p>
            </div>

            <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                 {/* Left Column in Form */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '12px', letterSpacing: '0.05em' }}>NOTE TITLE</label>
                      <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '18px 22px', borderRadius: '22px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '16px', fontWeight: '700' }} placeholder="e.g. Wedding Color Schemes..." />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '16px', letterSpacing: '0.05em' }}>ASSIGN CATEGORY</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {CATEGORIES.map(cat => {
                          const CatIcon = cat.icon;
                          return (
                            <div 
                              key={cat.id}
                              onClick={() => setFormData({ ...formData, category: cat.id })}
                              style={{ 
                                padding: '16px 12px', borderRadius: '22px', cursor: 'pointer', fontSize: '14px', fontWeight: '800',
                                background: formData.category === cat.id ? cat.color : theme.bg,
                                color: formData.category === cat.id ? '#fff' : theme.muted,
                                display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s',
                                border: `2px solid ${formData.category === cat.id ? cat.color : theme.border}`
                              }}
                            >
                              <div style={{ background: formData.category === cat.id ? 'rgba(255,255,255,0.2)' : theme.card, padding: '6px', borderRadius: '10px' }}>
                                <CatIcon size={18} />
                              </div>
                              {cat.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                 </div>

                 {/* Right Column in Form */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: theme.text, marginBottom: '12px', letterSpacing: '0.05em' }}>DETAILED CONTENT</label>
                      <textarea 
                        required
                        rows={7}
                        value={formData.content} 
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                        style={{ width: '100%', padding: '22px', borderRadius: '28px', border: '1px solid ' + theme.border, outline: 'none', resize: 'none', fontFamily: 'inherit', background: theme.bg, color: theme.text, fontSize: '16px', lineHeight: '1.7' }} 
                        placeholder="Share your full professional story here..." 
                      />
                    </div>
                 </div>
              </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div 
                  onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '18px 24px', borderRadius: '24px', background: formData.isPinned ? (isDarkMode ? '#f9731630' : '#fff7ed') : theme.bg, 
                    cursor: 'pointer', transition: '0.3s', border: `1px solid ${formData.isPinned ? '#f97316' : 'transparent'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                     <div style={{ background: formData.isPinned ? '#f97316' : theme.muted, padding: '10px', borderRadius: '14px', color: '#fff' }}>
                        <Pin size={22} fill="currentColor" />
                     </div>
                     <span style={{ fontSize: '16px', fontWeight: '800', color: formData.isPinned ? '#f97316' : theme.muted }}>Pin this to your top shelf</span>
                  </div>
                  <div style={{ width: '50px', height: '26px', background: formData.isPinned ? '#f97316' : (isDarkMode ? '#475569' : '#e2e8f0'), borderRadius: '13px', position: 'relative', transition: '0.3s' }}>
                     <div style={{ position: 'absolute', top: '3.5px', left: formData.isPinned ? '26px' : '4px', width: '19px', height: '19px', background: '#fff', borderRadius: '50%', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>

                <button type="submit" style={{ flex: 1, background: '#f97316', color: '#fff', border: 'none', padding: '20px', borderRadius: '24px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: '0 12px 35px rgba(249, 115, 22, 0.4)', transition: '0.3s ease' }} className="save-btn">
                  {editingNote ? 'Update Note Entry' : 'Initialize Note Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes modalScale {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes notePop {
            from { transform: scale(0.9) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
          .note-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.06);
            border-color: #cbd5e1;
          }
          .note-card .card-controls {
            opacity: 0;
            transition: 0.3s;
          }
          .note-card:hover .card-controls {
            opacity: 1;
          }
          .add-note-btn:hover, .save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(249, 115, 22, 0.5);
          }
        `}
      </style>
    </div>
  );
};

export default Notes;
