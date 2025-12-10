import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, loginWithMagicLink, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onLoginSuccess?.();
      navigate('/');
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
    const res = await signup(email, password);
    setLoading(false);
    if (res.success) {
      onLoginSuccess?.();
      navigate('/');
    } else {
      setMsg(res.message ?? 'Signup failed');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="w-full max-w-4xl px-6">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left - Brand / Intro */}
          <div className="hidden md:flex flex-col justify-center p-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
            <h1 className="text-4xl font-['Syne'] font-bold mb-4">Elgrace Talents</h1>
            <p className="text-zinc-400 leading-relaxed">
              Sign in to manage your profile, view castings and apply for gigs. New here? Create an account
              with email and password or request a magic link.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-full"><Mail className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm text-zinc-500 uppercase tracking-wider">Support</div>
                  <div className="text-sm">hardik@elgrace.in</div>
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
            <h2 className="text-2xl font-['Syne'] font-bold mb-2">Welcome back</h2>
            <p className="text-zinc-400 mb-6">Log in to continue — or request a magic link.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <div className="flex items-center gap-3 mb-2 text-zinc-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-800/50 border border-zinc-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="you@domain.com"
                />
              </label>

              <label className="block">
                <div className="flex items-center gap-3 mb-2 text-zinc-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Password</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-semibold"
                >
                  {loading ? 'Working…' : 'Login'}
                </button>

                <button
                  type="button"
                  onClick={handleMagic}
                  disabled={loading || !email}
                  className="px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium"
                >
                  Magic link
                </button>

                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={loading}
                  className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium"
                >
                  Sign up
                </button>
              </div>

              {msg && <p className="text-sm text-zinc-300 mt-2">{msg}</p>}
            </form>

            <div className="mt-6 text-xs text-zinc-500">
              By continuing you agree to our <a className="underline" href="#">terms</a> &amp; <a className="underline" href="#">privacy</a>.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};