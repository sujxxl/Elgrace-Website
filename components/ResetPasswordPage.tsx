import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await updatePassword(newPassword);
    setLoading(false);
    if (res.success) {
      showToast('🔐 Password updated successfully!');
      navigate('/auth');
    } else {
      setError(res.message ?? 'Unable to update password');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="w-full max-w-md px-6">
        <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
          <h2 className="text-2xl font-['Syne'] font-bold mb-2">Set a new password</h2>
          <p className="text-zinc-400 mb-6 text-sm">
            This link was sent to your email by Elgrace Talents. Enter a new password to secure your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <div className="flex items-center gap-3 mb-2 text-zinc-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm">New password</span>
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-zinc-300/60 text-white placeholder:text-zinc-400"
                placeholder="Re-enter password"
              />
            </label>

            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-semibold transition-all hover:from-zinc-700 hover:to-zinc-500 disabled:opacity-50 shadow-xl shadow-black/30 border-2 border-[#dfcda5] backdrop-blur-md"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500 flex items-center gap-2">
            <Mail className="w-3 h-3" />
            If you didn&apos;t request this change, you can safely ignore this page.
          </p>
        </div>
      </div>
    </section>
  );
};
