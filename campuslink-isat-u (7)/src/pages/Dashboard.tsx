import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SystemConfig } from '../types';
import { 
  Trophy, 
  BookMarked, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Sparkles,
  Search,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const DashboardCard = ({ to, icon: Icon, title, desc, delay = 0 }: { to: string, icon: any, title: string, desc: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Link 
      to={to}
      className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-gold/30 hover:-translate-y-1 transition-all group flex flex-col h-full overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-colors" />
      
      <div className="w-12 h-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center mb-10 transition-transform group-hover:scale-110 relative z-10">
        <Icon size={24} className="text-brand-blue" />
      </div>
      
      <div className="relative z-10 mt-auto">
        <h3 className="text-xl font-display font-bold text-brand-blue mb-2 group-hover:text-brand-gold transition-colors">{title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{desc}</p>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const SummaryCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:rotate-12", color)}>
      <Icon size={24} className="text-brand-blue" />
    </div>
    <div className="relative z-10">
      <p className="text-3xl font-mono font-bold text-brand-ink leading-none mb-1">{value}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
    </div>
    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-150">
       <Icon size={120} />
    </div>
  </div>
);

export default function Dashboard() {
  const { profile, isStudent } = useAuth();
  const [stats, setStats] = useState({
    enrolledUnits: 0,
    enrolledSubjects: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (isStudent && profile) {
        const q = query(
          collection(db, 'enrollments'), 
          where('userId', '==', profile.uid),
          where('status', '==', 'approved')
        );
        const querySnap = await getDocs(q);
        let units = 0;
        const docs = querySnap.docs;
        for (const d of docs) {
          const subSnap = await getDoc(doc(db, 'subjects', d.data().subjectId));
          if (subSnap.exists()) {
            units += subSnap.data().units;
          }
        }
        setStats({
          enrolledUnits: units,
          enrolledSubjects: querySnap.size
        });
      }
    };
    fetchData();
  }, [isStudent, profile]);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Welcome Hero */}
      <section className="relative rounded-[3rem] overflow-hidden bg-brand-blue p-12 lg:p-20 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold rounded-full filter blur-[100px]" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-brand-gold text-brand-blue px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-brand-gold/20">
                 Session Active
               </div>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">AY 2026 • Semester II</p>
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight mb-4">
              Hello, <span className="text-brand-gold">{profile?.firstName}</span>
            </h1>
            <p className="text-white/60 text-lg lg:text-xl font-light max-w-lg leading-relaxed">
              Secure your academic future. Complete your enrollment, manage your course selections, and prepare for the upcoming term.
            </p>
          </div>

          <div className="flex gap-4">
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
              Academic Calendar
            </button>
            <Link 
              to="/profile"
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-gold/10"
            >
              System Profile
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-bold text-brand-blue tracking-tight">University Services</h2>
              <Link to="/profile" className="text-xs font-bold text-brand-gold uppercase tracking-[0.2em] hover:underline underline-offset-4 flex items-center gap-2 group">
                All Services <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DashboardCard 
                to="/enrollment" 
                icon={BookMarked} 
                title="Course Enrollment" 
                desc="Manage your study load"
                delay={0.1}
              />
              <DashboardCard 
                to="/profile" 
                icon={ClipboardList} 
                title="Prerequisites" 
                desc="View curriculum data"
                delay={0.2}
              />
           </div>
        </div>

        {/* Status Sidebars */}
        <div className="space-y-8">
           <h2 className="text-2xl font-display font-bold text-brand-blue tracking-tight">System Summary</h2>
           <div className="space-y-4">
              <SummaryCard 
                label="Enrolled Courses" 
                value={stats.enrolledSubjects || '--'} 
                icon={BookOpen} 
                color="bg-brand-gold/10"
              />
              <SummaryCard 
                label="Total Units Enrolled" 
                value={stats.enrolledUnits || '--'} 
                icon={Award} 
                color="bg-emerald-50"
              />
           </div>

           {/* Announcement Card */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <Sparkles size={18} className="text-brand-gold" />
                 </div>
                 <h4 className="font-display font-bold text-xl mb-2">New Feature Active</h4>
                 <p className="text-white/40 text-sm leading-relaxed mb-6 font-light">
                   The new automated prerequisite checking system is now live. Check your profile for updates.
                 </p>
                 <button className="text-brand-gold text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4">
                   Read Update Notes
                 </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-[40px]" />
           </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
