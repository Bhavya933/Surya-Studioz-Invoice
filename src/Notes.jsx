import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, X, Check, 
  Pin, Tag, Calendar, MessageSquare, AlertCircle,
  Camera, User, Lightbulb, Clock, Inbox, RefreshCw
} from 'lucide-react';

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

const CATEGORIES = [
  { id: 'general', label: 'General', color: '#64748b', bg: '#f1f5f9', icon: Inbox },
  { id: 'creative', label: 'Creative', color: '#6366f1', bg: '#eef2ff', icon: Lightbulb },
  { id: 'client', label: 'Client', color: '#10b981', bg: '#f0fdf4', icon: User },
  { id: 'urgent', label: 'Urgent', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Notes = ({ isDarkMode, searchQuery: globalSearchQuery }) => {
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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  
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

  const deleteNote = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
      fetchNotes();
      setConfirmDelete({ isOpen: false, id: null });
    } catch (err) {
      alert('Delete failed');
      setConfirmDelete({ isOpen: false, id: null });
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

  const filteredNotes = notes.filter(n => {
    const q = (globalSearchQuery || localSearchQuery).toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

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
      className="note-card hover-lift"
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

        <h3 style={{ 
          margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text, lineHeight: '1.3',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {note.title}
        </h3>
        <p style={{ 
          margin: 0, fontSize: '15px', color: theme.muted, lineHeight: '1.7', flex: 1,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          wordBreak: 'break-word', overflowWrap: 'anywhere'
        }}>
          {note.content}
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%' }}>
      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        isDarkMode={isDarkMode}
        title="Delete Note?"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
      />

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
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
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
        <div className="stagger-list" style={{ 
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
            background: theme.card, width: '100%', maxWidth: '850px', padding: '48px', borderRadius: '32px', position: 'relative',
            boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column',
            animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid ' + theme.border, boxSizing: 'border-box'
          }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '28px', right: '28px', border: 'none', background: 'transparent', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: theme.muted, transition: '0.2s', border: '1px solid ' + theme.border }}>
              <X size={24} />
            </button>

            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.text, margin: '0 0 8px 0' }}>
                {editingNote ? 'Refine Studio Note' : 'Draft New Idea'}
              </h2>
              <p style={{ color: theme.muted, fontSize: '15px', margin: 0, fontWeight: '500' }}>
                {editingNote ? 'Update your note details below' : 'Capture your professional creativity in detail'}
              </p>
            </div>

            <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: theme.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note Title</label>
                    <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '18px 20px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', background: theme.bg, color: theme.text, fontSize: '16px', fontWeight: '700', transition: 'border-color 0.2s', boxSizing: 'border-box' }} placeholder="e.g. Wedding Color Schemes..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: theme.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {CATEGORIES.map(cat => {
                        const CatIcon = cat.icon;
                        const isSelected = formData.category === cat.id;
                        return (
                          <div 
                            key={cat.id}
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            style={{ 
                              padding: '16px 14px', borderRadius: '16px', cursor: 'pointer', fontSize: '14px', fontWeight: '800',
                              background: isSelected ? cat.color : theme.bg,
                              color: isSelected ? '#fff' : theme.muted,
                              display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                              border: `1px solid ${isSelected ? cat.color : theme.border}`, boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : theme.card, padding: '8px', borderRadius: '12px' }}>
                              <CatIcon size={20} />
                            </div>
                            {cat.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: theme.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detailed Content</label>
                  <textarea 
                    required
                    value={formData.content} 
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                    style={{ width: '100%', flex: 1, minHeight: '200px', padding: '20px', borderRadius: '16px', border: '1px solid ' + theme.border, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: theme.bg, color: theme.text, fontSize: '16px', lineHeight: '1.6', boxSizing: 'border-box' }} 
                    placeholder="Share your full professional story here..." 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '32px', borderTop: '1px solid ' + theme.border }}>
                <div 
                  onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                  style={{ 
                    flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '0 24px', borderRadius: '16px', background: formData.isPinned ? '#f97316' : theme.bg, 
                    cursor: 'pointer', transition: '0.2s', border: `1px solid ${formData.isPinned ? '#f97316' : theme.border}`,
                    color: formData.isPinned ? '#fff' : theme.muted
                  }}
                  title="Pin Note"
                >
                  <Pin size={24} fill={formData.isPinned ? "currentColor" : "none"} />
                </div>

                <button type="submit" style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', transition: '0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} className="save-btn">
                  <Check size={22} strokeWidth={3} /> {editingNote ? 'Update Note' : 'Save Note Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print/PDF Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="notes-report-content" style={{ padding: '60px', background: '#ffffff', color: '#000000', width: '1100px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', color: '#0f172a' }}>Creative Studio Notes</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '20px' }}>
            {filteredNotes.map(note => (
              <div key={note.id} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{note.title}</h3>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#f97316', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  {CATEGORIES.find(c => c.id === note.category)?.label || 'General'}
                </div>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                <div style={{ marginTop: '24px', height: '1px', background: '#f1f5f9', width: '100%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

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
