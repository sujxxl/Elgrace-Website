import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, loginWithMagicLink, requestPasswordReset, updatePassword, signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'model' | 'client'>('model');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset-request' | 'reset-update'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1' || params.get('type') === 'recovery') {
      setMode('reset-update');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      showToast('👋 Welcome back!');
      onLoginSuccess?.();
      navigate('/talents/onboarding');
    } else {
      setMsg(res.message ?? 'Login failed');
    }
  };

  const handleMagic = async () => {
    setMsg(null);
    setLoading(true);
    const res = await loginWithMagicLink(email);
    setLoading(false);
    setMsg(res.success ? 'Magic link sent — check your inbox' : res.message ?? 'Failed to send magic link');
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await requestPasswordReset(email);
    setLoading(false);
    setMsg(res.success ? 'Password reset link sent. Check your email.' : res.message ?? 'Reset failed');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await updatePassword(newPassword);
    setLoading(false);
    if (res.success) {
      showToast('🔐 Password updated successfully!');
      setMsg('Password updated. You can now log in.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/auth');
    } else {
      setMsg(res.message ?? 'Unable to update password');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await signup(email, password, displayName || undefined, role);
    setLoading(false);
    if (res.success) {
      showToast('✅ Account created. Please log in.');
      setMode('login');
      setPassword('');
    } else {
      setMsg(res.message ?? 'Signup failed');
    }
  };

  const formMode = mode === 'reset-request'
      ? handleResetRequest
      : mode === 'reset-update'
        ? handlePasswordUpdate
        : mode === 'signup'
          ? handleSignup
          : handleLogin;

  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="w-full max-w-4xl px-6">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left - Brand / Intro */}
          <div className="hidden md:flex flex-col justify-center p-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
            <h1 className="text-4xl font-['Syne'] font-bold mb-4">Elgrace Talents</h1>
            <p className="text-zinc-400 leading-relaxed">
              Employee access only. Sign in with your Elgrace staff account to manage models and castings.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-full"><Mail className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm text-zinc-500 uppercase tracking-wider">Support</div>
                  <div className="text-sm">creatives@elgrace.in</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-full"><Key className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm text-zinc-500 uppercase tracking-wider">Security</div>
                  <div className="text-sm">We protect your data</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
            <h2 className="text-2xl font-['Syne'] font-bold mb-2">
              {mode === 'reset-request'
                ? 'Reset password'
                : mode === 'reset-update'
                  ? 'Set a new password'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {mode === 'reset-request'
                ? 'Enter your work email to get a reset link.'
                : mode === 'reset-update'
                  ? 'Set a new password for your account.'
                  : mode === 'signup'
                    ? 'Create a model or client account to manage your profile and castings.'
                    : 'Log in to manage your profile and castings — or request a magic link.'}
            </p>

            <form onSubmit={formMode} className="space-y-4">
              {mode !== 'reset-update' && (
                <label className="block">
                  <div className="flex items-center gap-3 mb-2 text-zinc-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email Address</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                    placeholder="you@email.com"
                  />
                </label>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <label className="block">
                  <div className="flex items-center gap-3 mb-2 text-zinc-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Password</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                    placeholder="••••••••"
                  />
                </label>
              )}

              {mode === 'signup' && (
                <>
                  <label className="block">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                      <span className="text-sm">Full name</span>
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                      <span className="text-sm">Account type</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('model')}
                        className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${role === 'model' ? 'border-[#3d211a] text-white bg-white/10' : 'border-white/10 text-zinc-300'}`}
                      >
                        Model
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('client')}
                        className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium ${role === 'client' ? 'border-[#3d211a] text-white bg-white/10' : 'border-white/10 text-zinc-300'}`}
                      >
                        Client / Brand
                      </button>
                    </div>
                  </label>
                </>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-[#3d211a] hover:underline"
                    onClick={() => {
                      setMode('reset-request');
                      setMsg(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === 'reset-update' && (
                <div className="space-y-4">
                  <label className="block">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">New password</span>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                      placeholder="New password"
                    />
                  </label>
                  <label className="block">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Confirm password</span>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                      placeholder="Re-enter password"
                    />
                  </label>
                </div>
              )}

              {/* Message */}
              {msg && (
                <div className="text-sm text-red-500 mt-4">
                  {msg}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-[#c9a961] text-[#111827] font-semibold transition-colors hover:bg-[#d6bb77] disabled:opacity-50 shadow-[0_12px_26px_rgba(61,33,26,0.18)] border-2 border-[#c9a961]"
              >
                {loading
                  ? 'Loading...'
                  : mode === 'reset-request'
                    ? 'Send reset link'
                    : mode === 'reset-update'
                      ? 'Update password'
                      : mode === 'signup'
                        ? 'Create account'
                        : 'Log in'}
              </button>

              {/* Magic link button: ONLY show for login */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleMagic}
                className="w-full mt-4 px-4 py-3 rounded-2xl bg-transparent text-[#111827] font-semibold transition-colors hover:bg-[#e5d3a3]/50 border-2 border-[#c9a961]"
              >
                Login using link
              </button>
            )}

            {/* Divider with magic link option */}
            {mode === 'login' && (
              <div className="mt-6 relative">
                <div className="h-px bg-zinc-700" />
                
              </div>
            )}
            
              {/* Secondary CTA (same hierarchy/size as submit on login) */}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setMsg(null); }}
                  className="w-full px-4 py-3 rounded-2xl bg-transparent text-[#111827] font-semibold transition-colors hover:bg-[#3d211a]/10 border-2 border-[#3d211a]"
                >
                  Create an account
                </button>
              )}
            </form>


            

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-zinc-400 space-y-1">
              {mode === 'login' && (
                <>
                  <div>
                    Forgot your password?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('reset-request')}
                      className="text-[#3d211a] hover:underline"
                    >
                      Reset here
                    </button>
                  </div>
                </>
              )}
              {mode === 'signup' && (
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setMsg(null); }}
                    className="text-[#3d211a] hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              )}
              {(mode === 'reset-request' || mode === 'reset-update') && (
                <div>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setMsg(null); }}
                    className="text-[#3d211a] hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};