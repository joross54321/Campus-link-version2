import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Building, 
  GraduationCap, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  Award,
  BookOpen,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const ProfileSection = ({ title, items }: { title: string, items: { label: string, value: string | React.ReactNode, icon?: any }[] }) => (
  <div className="space-y-8">
    <div className="flex items-center gap-4">
      <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] font-mono whitespace-nowrap">{title}</h3>
      <div className="h-[1px] bg-slate-100 flex-1" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-brand-blue group-hover:bg-brand-gold group-hover:text-brand-blue transition-all duration-300">
            {item.icon && <item.icon size={18} />}
          </div>
          <div className="flex-1 border-b border-slate-50 pb-4 group-hover:border-brand-gold/30 transition-all">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-sm font-bold text-brand-ink">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Identity Data</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Premium Identity Card */}
      <div className="bg-brand-blue rounded-[3rem] overflow-hidden relative shadow-2xl shadow-brand-blue/20">
         {/* Back Button */}
         <div className="absolute top-8 left-8 z-20">
            <button 
              onClick={() => window.history.back()}
              className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
         </div>

         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Fingerprint size={300} strokeWidth={1} />
         </div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px]" />

         <div className="relative z-10 p-12 lg:p-20 flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-20">
            {/* Avatar Stack */}
            <div className="relative">
               <div className="w-40 h-40 rounded-[3rem] bg-brand-gold flex items-center justify-center text-brand-blue font-display font-bold text-5xl rotate-3 shadow-2xl shadow-brand-gold/20">
                  {profile.firstName[0]}{profile.surname[0]}
               </div>
               <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border-2 border-brand-blue text-brand-blue">
                  <ShieldCheck size={24} />
               </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
               <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 justify-center lg:justify-start">
                  <h1 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">{profile.firstName} {profile.surname}</h1>
                  <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 w-fit self-center lg:self-auto">Active Status</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mb-10 max-w-lg mx-auto lg:mx-0">
                  {[
                    { icon: Fingerprint, label: 'Student Identification', value: profile.studentId },
                    { icon: GraduationCap, label: 'Academic Program', value: profile.program },
                    { icon: Building, label: 'College Faculty', value: profile.college },
                    { icon: Mail, label: 'Official Institution Email', value: `${profile.studentId}@students.isatu.edu.ph` }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                       <item.icon size={16} className="text-brand-gold" />
                       <div className="text-left">
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">{item.label}</p>
                          <p className="text-sm font-bold text-white/90">{item.value}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md px-10 py-6 rounded-[2rem] flex flex-col items-center">
                     <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-1">Academic Year</p>
                     <p className="text-2xl font-mono font-bold text-white leading-none">2026-2</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md px-10 py-6 rounded-[2rem] flex flex-col items-center">
                     <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-1">Total Units</p>
                     <p className="text-2xl font-mono font-bold text-white leading-none">36.0</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md px-10 py-6 rounded-[2rem] flex flex-col items-center">
                     <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-1">Year Level</p>
                     <p className="text-2xl font-mono font-bold text-white leading-none">{profile.yearLevel === 4 ? '4TH' : profile.yearLevel === 3 ? '3RD' : profile.yearLevel === 2 ? '2ND' : '1ST'}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Detailed Sections */}
         <div className="lg:col-span-8 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm space-y-16">
            <ProfileSection 
              title="Scholastic Context"
              items={[
                { label: 'Academic Cycle', value: '2nd Semester, 2025-2026', icon: Calendar },
                { label: 'Registration Status', value: 'Fully Validated', icon: ShieldCheck },
                { label: 'System Access Level', value: 'Student Tier 1', icon: Award },
                { label: 'Current Load', value: 'Regular Full-Time', icon: BookOpen },
              ]}
            />

            <ProfileSection 
              title="Personal Identification"
              items={[
                { label: 'Date of Birth', value: 'May 12, 2004', icon: User },
                { label: 'Primary Residence', value: 'Calitan, Panay, Capiz', icon: MapPin },
                { label: 'Contact Interface', value: '+63 963 391 2832', icon: Phone },
                { label: 'Recovery Email', value: 'personal.alias@email.com', icon: Mail },
              ]}
            />
         </div>

         {/* Sidebar Actions */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-brand-paper p-8 rounded-[2.5rem] border border-brand-gold/20 flex flex-col items-center text-center">
               <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-brand-gold mb-6 shadow-sm">
                  <Award size={32} />
               </div>
               <h4 className="text-xl font-display font-bold text-brand-blue mb-4">Academic Excellence</h4>
               <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Successfully completed 36.0 units without scholastic deficiencies. Eligible for Dean's List consideration.
               </p>
               <button className="w-full bg-white text-brand-blue border border-slate-100 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-brand-gold transition-colors">
                  View Awards Registry
               </button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
               <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-6 text-center">Identity Management</h3>
               <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-brand-blue hover:text-white transition-all">
                     <span className="text-[10px] font-bold uppercase tracking-widest">Update Passcode</span>
                     <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 rounded-xl group hover:bg-rose-500 hover:text-white transition-all"
                  >
                     <div className="flex items-center gap-3">
                        <LogOut size={14} className="text-rose-500 group-hover:text-white" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 group-hover:text-white">Terminate Session</span>
                     </div>
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
