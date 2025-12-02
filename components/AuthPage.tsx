import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Mail, Lock, ArrowRight, User, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'model' | 'client'>('model');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (!isLogin) {
      if (!formData.name) newErrors.name = "Full Name is required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAuthError(null);
    setIsLoading(true);
    
    try {
        let result;
        if (isLogin) {
            result = await login(formData.email, formData.password);
        } else {
            result = await register(role, formData.name, formData.email, formData.password);
        }

        if (result.success) {
            onLoginSuccess();
        } else {
            setAuthError(result.message || "Authentication failed");
        }
    } catch (err) {
        setAuthError("An unexpected error occurred. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 relative z-10">
        
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-800 relative overflow-hidden">
           <img 
             src={role === 'model' ? "https://picsum.photos/800/1200?grayscale&random=88" : "https://picsum.photos/800/1200?grayscale&random=99"} 
             alt="Auth visual" 
             className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-700"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
           
           <div className="relative z-10">
             <h2 className="text-3xl font-['Syne'] font-bold text-white mb-2">ELGRACE TALENTS</h2>
             <p className="text-zinc-400 text-sm uppercase tracking-widest">Premier Management Platform</p>
           </div>

           <div className="relative z-10">
             <h3 className="text-2xl font-bold text-white mb-4">
               {isLogin ? "Welcome Back." : "Join the Elite."}
             </h3>
             <p className="text-zinc-300 leading-relaxed max-w-sm">
               {isLogin 
                 ? "Access your dashboard to manage bookings, view castings, and update your portfolio." 
                 : "Create your profile today and connect with world-class brands and top-tier talent."}
             </p>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-end mb-8">
            <button 
              onClick={() => { setIsLogin(!isLogin); setErrors({}); setAuthError(null); }}
              className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-['Syne'] font-bold text-white mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-zinc-500">Enter your details to proceed.</p>
          </div>

          {authError && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {authError}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection (Only for Signup) */}
            <AnimatePresence>
                {!isLogin && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setRole('model')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                            role === 'model' 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500'
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">I am a Model</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('client')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                            role === 'client' 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500'
                            }`}
                        >
                            <Briefcase className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">I am a Client</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-zinc-400">Full Name</label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full bg-zinc-950 border ${errors.name ? 'border-red-500' : 'border-zinc-800'} p-3 pl-10 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full bg-zinc-950 border ${errors.email ? 'border-red-500' : 'border-zinc-800'} p-3 pl-10 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full bg-zinc-950 border ${errors.password ? 'border-red-500' : 'border-zinc-800'} p-3 pl-10 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors`}
                  placeholder="Min 6 characters"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                   <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className={`w-full bg-zinc-950 border ${errors.confirmPassword ? 'border-red-500' : 'border-zinc-800'} p-3 pl-10 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors`}
                        placeholder="Repeat password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </section>
  );
};