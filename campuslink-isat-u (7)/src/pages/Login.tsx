import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithId, seedInitialData } from '../services/authService';
import { db } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { LogIn, GraduationCap, ShieldCheck, Database, Menu, X, Info, ChevronRight, LayoutDashboard, UserCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Login() {
  const [role, setRole] = useState<'student' | 'professor' | 'registrar'>('student');
  const [studentId, setStudentId] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const checkEmpty = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        setIsEmpty(snap.empty);
      } catch (e) {
        console.error(e);
      }
    };
    checkEmpty();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialData();
      setIsEmpty(false);
      toast.success('System initialized successfully!');
      setRole('registrar');
      setStudentId('REG-2026-001');
      setSurname('Admin');
      setIsMenuOpen(false);
    } catch (error: any) {
      toast.error(`Initialization failed: ${error.message || 'Unknown error'}`);
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  const roleConfig = {
    student: { label: 'Student ID', placeholder: '22-003' },
    professor: { label: 'Faculty ID', placeholder: 'FAC-2026-001' },
    registrar: { label: 'Admin ID', placeholder: 'REG-2026-001' }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Standardize ID to uppercase for matching
    const standardizedId = studentId.toUpperCase().trim();
    const cleanSurname = surname.trim();
    
    try {
      await loginWithId(standardizedId, cleanSurname);
      toast.success('Successfully logged in!');
      if (role === 'registrar') {
        navigate('/admin');
      } else if (role === 'professor') {
        navigate('/professor');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (isEmpty) {
        toast.error('The system is not yet initialized. Please click the Sparkles icon at the bottom right.');
      } else {
        toast.error('Invalid ID or password. Please check your credentials.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-paper flex overflow-hidden font-sans">
      {/* Left side: Branding & Hero */}
      <div className="hidden lg:flex w-1/2 bg-brand-blue relative items-center justify-center p-20 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold rounded-full filter blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold rounded-full filter blur-[100px] translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-brand-gold flex items-center justify-center shadow-2xl shadow-brand-gold/20">
                <GraduationCap size={32} className="text-brand-blue" />
              </div>
              <div>
                <h2 className="text-brand-gold font-display font-bold text-3xl tracking-tight leading-none">CampusLink</h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">ISAT U Portal</p>
              </div>
            </div>

            <h1 className="text-white text-7xl font-display font-medium leading-[0.9] tracking-tight mb-8">
              Empowering <br />
              <span className="text-brand-gold italic">Tomorrow's</span> <br />
              Leaders.
            </h1>

            <p className="text-white/60 text-lg font-light leading-relaxed mb-12 max-w-sm">
              Integrated University Management System for seamless academic operations and student success.
            </p>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
              <div>
                <p className="text-brand-gold font-mono text-2xl font-bold">15,000+</p>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Active Students</p>
              </div>
              <div>
                <p className="text-brand-gold font-mono text-2xl font-bold">100%</p>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Digital Process</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Rail Text */}
        <div className="absolute left-8 bottom-8 text-white/10 font-mono text-[10px] uppercase tracking-[0.5em] [writing-mode:vertical-rl] rotate-180">
          Innovation & Excellence • 2026
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-12 left-12 right-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center">
              <GraduationCap size={20} className="text-brand-gold" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-brand-blue">CampusLink</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-brand-blue"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Desktop Role Switcher */}
        <div className="hidden lg:flex absolute top-12 right-12 gap-2 bg-slate-100 p-1 rounded-xl">
          {(['student', 'professor', 'registrar'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                role === r 
                  ? "bg-white text-brand-blue shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {r === 'registrar' ? 'admin' : r}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="mb-12">
            {isEmpty && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-start gap-3"
              >
                <Sparkles className="text-brand-gold shrink-0 mt-0.5" size={16} />
                <div>
                   <p className="text-[11px] font-bold text-brand-blue uppercase tracking-tight">System Initialization Required</p>
                   <p className="text-[10px] text-brand-blue/60 mt-1">Please click the "Initialize" button at the bottom right to set up the default accounts.</p>
                </div>
              </motion.div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-brand-gold/20 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-gold animate-pulse" />
                {role === 'registrar' ? 'ADMIN' : role.toUpperCase()} ACCESS
              </div>
            </div>
            <h2 className="text-4xl font-display font-bold text-brand-blue tracking-tight mb-2">Welcome Back.</h2>
            <p className="text-slate-400 font-light">Please enter your credentials to access the portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-brand-blue transition-colors">
                  {roleConfig[role].label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder={roleConfig[role].placeholder}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all font-medium text-brand-ink outline-none"
                    required
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <UserCheck size={18} />
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-brand-blue transition-colors">
                    Password
                  </label>
                  <button type="button" className="text-[10px] font-bold text-slate-300 hover:text-brand-blue transition-colors uppercase tracking-widest">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all font-medium text-brand-ink outline-none"
                    required
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <ShieldCheck size={18} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue text-white py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#002d5a] active:scale-[0.98] transition-all shadow-xl shadow-brand-blue/10 flex items-center justify-center gap-3 group px-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Authorize Session
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-16 pt-8 border-t border-slate-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <Info size={16} className="text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Authorized personnel only. Access is monitored and logged in compliance with the Data Privacy Act of 2012.
            </p>
          </div>
        </motion.div>

        {/* Developer / Seed Button (Discreet) */}
        <button 
          onClick={handleSeed}
          disabled={seeding}
          className="absolute bottom-8 right-8 p-3 text-slate-300 hover:text-brand-gold transition-colors group flex items-center gap-2"
        >
          <Sparkles size={14} className={seeding ? "animate-spin" : ""} />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Initialize</span>
        </button>
      </div>

      {/* Floating Menu for Mobile Roles */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-10 z-[70] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold text-brand-blue">Access Role</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-3">
                {(['student', 'professor', 'registrar'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      role === r 
                        ? "bg-brand-blue border-brand-blue text-white" 
                        : "bg-slate-50 border-transparent text-slate-400"
                    )}
                  >
                    <span className="font-bold uppercase tracking-widest text-xs">
                      {r === 'registrar' ? 'admin' : r}
                    </span>
                    {role === r && <UserCheck size={18} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
