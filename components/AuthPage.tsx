import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, loginWithMagicLink, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState(''); // only used for signup
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'model' | 'client'>('model'); // NEW
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

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
    const res = await signup(email, password, displayName, role); // pass role
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
              {isSignup
                ? 'Create an account to manage your profile, view castings, and apply for gigs.'
                : 'Sign in to manage your profile, view castings and apply for gigs.'}
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-full"><Mail className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm text-zinc-500 uppercase tracking-wider">Support</div>
                  <div className="text-sm">info@elgrace.in</div>
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
              {isSignup ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {isSignup ? 'Sign up to get started.' : 'Log in to continue — or request a magic link.'}
            </p>

            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
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
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                  placeholder="you@domain.com"
                />
              </label>

              {/* Display name field: ONLY show during signup */}
              {isSignup && (
                <label className="block">
                  <div className="flex items-center gap-3 mb-2 text-zinc-400">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Display name</span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                    placeholder="Your public name"
                  />
                </label>
              )}

              {/* Password */}
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

              {/* Role selector: ONLY show during signup */}
              {isSignup && (
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
                {loading ? 'Loading...' : isSignup ? 'Sign up' : 'Log in'}
              </button>
            </form>

            {/* Divider with magic link option */}
            {!isSignup && (
              <div className="mt-6 relative">
                <div className="h-px bg-zinc-700" />
                
              </div>
            )}

            {/* Magic link button: ONLY show for login */}
            {!isSignup && (
              <button
                onClick={handleMagic}
                className="w-full mt-4 px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-semibold transition-all hover:from-zinc-700 hover:to-zinc-500 shadow-xl shadow-black/30 border-2 border-[#dfcda5] backdrop-blur-md"
              >
                Send magic link
              </button>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-zinc-400">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsSignup(false)}
                    className="text-[#dfcda5] hover:underline"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don’t have an account yet?{' '}
                  <button
                    onClick={() => setIsSignup(true)}
                    className="text-[#dfcda5] hover:underline"
                  >
                    Sign up
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