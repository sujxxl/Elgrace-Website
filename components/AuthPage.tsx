import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, loginWithMagicLink, signup, requestPasswordReset, updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/profile');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await signup(email, password, displayName, role);
    setLoading(false);
    if (res.success) {
      showToast('🎉 Account created! Check your email to confirm.');
      setMsg(
        'We\'ve sent a confirmation link to your email. Please open it to verify your account and you will be logged in automatically.'
      );
      // Do not auto-navigate; user will come back logged in after confirming via email.
      setPassword('');
    } else {
      setMsg(res.message ?? 'Signup failed');
    }
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

  const formMode = mode === 'signup'
    ? handleSignup
    : mode === 'reset-request'
      ? handleResetRequest
      : mode === 'reset-update'
        ? handlePasswordUpdate
        : handleLogin;

  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="w-full max-w-4xl px-6">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left - Brand / Intro */}
          <div className="hidden md:flex flex-col justify-center p-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
            <h1 className="text-4xl font-['Syne'] font-bold mb-4">Elgrace Talents</h1>
            <p className="text-zinc-400 leading-relaxed">
              {mode === 'signup'
                ? 'Create an account to manage your profile, view castings, and apply for castings.'
                : 'Sign in to manage your profile, view castings and apply for castings.'}
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
              {mode === 'signup'
                ? 'Create account'
                : mode === 'reset-request'
                  ? 'Reset password'
                  : mode === 'reset-update'
                    ? 'Set a new password'
                    : 'Welcome back'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {mode === 'signup'
                ? 'Sign up to get started.'
                : mode === 'reset-request'
                  ? 'Enter your email to get a reset link.'
                  : mode === 'reset-update'
                    ? 'Set a new password for your account.'
                    : 'Log in to continue — or request a magic link.'}
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

              {/* Full name field: ONLY show during signup */}
              {mode === 'signup' && (
                <label className="block">
                  <div className="flex items-center gap-3 mb-2 text-zinc-400">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Full Name</span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                    placeholder="Your full name"
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

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-[#dfcda5] hover:underline"
                    onClick={() => {
                      setMode('reset-request');
                      setMsg(null);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Role selector: ONLY show during signup */}
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('model')}
                    className={`px-4 py-3 rounded-xl font-medium border transition-all backdrop-blur-md ${
                      role === 'model'
                        ? 'bg-white/10 border-[#dfcda5] text-white shadow-lg shadow-black/30'
                        : 'bg-white/5 border-white/10 text-white hover:border-[#dfcda5]'
                    }`}
                  >
                    I’m a model
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`px-4 py-3 rounded-xl font-medium border transition-all backdrop-blur-md ${
                      role === 'client'
                        ? 'bg-white/10 border-[#dfcda5] text-white shadow-lg shadow-black/30'
                        : 'bg-white/5 border-white/10 text-white hover:border-[#dfcda5]'
                    }`}
                  >
                    I’m a client
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
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-semibold transition-all hover:from-zinc-700 hover:to-zinc-500 disabled:opacity-50 shadow-xl shadow-black/30 border-2 border-[#dfcda5] backdrop-blur-md"
              >
                {loading
                  ? 'Loading...'
                  : mode === 'signup'
                    ? 'Sign up'
                    : mode === 'reset-request'
                      ? 'Send reset link'
                      : mode === 'reset-update'
                        ? 'Update password'
                        : 'Log in'}
              </button>
            </form>

            {/* Divider with magic link option */}
            {mode === 'login' && (
              <div className="mt-6 relative">
                <div className="h-px bg-zinc-700" />
                
              </div>
            )}

            {/* Magic link button: ONLY show for login */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleMagic}
                className="w-full mt-4 px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-semibold transition-all hover:from-zinc-700 hover:to-zinc-500 shadow-xl shadow-black/30 border-2 border-[#dfcda5] backdrop-blur-md"
              >
                Send magic link
              </button>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-zinc-400">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#dfcda5] hover:underline"
                  >
                    Log in
                  </button>
                </>
              ) : mode === 'login' ? (
                <>
                  Don’t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-[#dfcda5] hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#dfcda5] hover:underline"
                  >
                    Back to login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};