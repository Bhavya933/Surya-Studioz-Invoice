import React, { useState } from 'react';
import { 
  Lock, User, Eye, EyeOff, ArrowRight, 
  Camera, Loader2, AlertCircle, ShieldCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Login = ({ onLoginSuccess, isDarkMode }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    text: isDarkMode ? '#f8fafc' : '#1e293b',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#f97316',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store in localStorage for persistence
      localStorage.setItem('studio_token', data.token);
      localStorage.setItem('studio_user', JSON.stringify(data.user));
      
      // Notify parent app
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Dynamic Background Elements */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)', zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        padding: '20px',
        zIndex: 1,
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* Branding Area */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '20px',
            background: theme.accent, color: '#fff', marginBottom: '20px',
            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
            animation: 'float 4s ease-in-out infinite'
          }}>
            <Camera size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: theme.text, margin: 0, letterSpacing: '-0.03em' }}>
            Surya Studio
          </h1>
          <p style={{ color: theme.muted, fontSize: '15px', marginTop: '8px', fontWeight: '500' }}>
            Management Intelligence Portal
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: theme.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '48px',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              padding: '12px 16px', borderRadius: '16px', marginBottom: '24px',
              fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px',
              animation: 'shake 0.4s ease-in-out'
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Username Input */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.muted }} />
                <input
                  type="text" required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px',
                    border: `1px solid ${theme.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
                    color: theme.text, fontSize: '15px', fontWeight: '600', outline: 'none', transition: '0.2s'
                  }}
                  className="login-input"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: theme.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.muted }} />
                <input
                  type={showPassword ? "text" : "password"} required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 48px 14px 48px', borderRadius: '16px',
                    border: `1px solid ${theme.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
                    color: theme.text, fontSize: '15px', fontWeight: '600', outline: 'none', transition: '0.2s'
                  }}
                  className="login-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              style={{
                background: theme.accent, color: '#fff', border: 'none', padding: '16px',
                borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 10px 20px rgba(249, 115, 22, 0.25)', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="login-btn"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Access Dashboard <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div style={{ 
            marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            gap: '8px', color: theme.muted, fontSize: '12px', fontWeight: '600' 
          }}>
            <ShieldCheck size={14} color="#10b981" /> End-to-end encrypted session
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-input:focus { border-color: #f97316 !important; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(249, 115, 22, 0.35); }
        .login-btn:active { transform: translateY(0); }
      `}</style>
    </div>
  );
};

export default Login;
