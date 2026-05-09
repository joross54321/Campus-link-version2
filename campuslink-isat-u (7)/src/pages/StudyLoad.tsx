import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { Enrollment, Subject, SystemConfig } from '../types';
import { toast } from 'react-hot-toast';
import { 
  BookMarked, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Download,
  AlertTriangle,
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { isBefore, subDays, format } from 'date-fns';

const EnrolledCard = ({ enrollment, onDrop }: { enrollment: any, onDrop: (id: string) => void, key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between group transition-all hover:shadow-xl hover:shadow-brand-blue/5 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none" />
    
    <div className="flex-1 space-y-6 relative z-10">
      <div className="flex items-center gap-4">
        <div className="bg-brand-paper px-3 py-1 rounded-full text-[10px] font-bold text-brand-gold uppercase tracking-widest border border-brand-gold/20">
          SEC {enrollment.subject?.section || 'A'}
        </div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">{enrollment.subject?.code}</p>
      </div>
      
      <div>
        <h4 className="text-2xl font-display font-bold text-brand-blue tracking-tight mb-2 group-hover:text-brand-ink transition-colors">{enrollment.subject?.title}</h4>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Calendar size={14} className="text-brand-gold" />
              <span>Mon / Wed / Fri 09:00 - 10:00 AM</span>
           </div>
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <MapPin size={14} className="text-brand-gold" />
              <span>{enrollment.subject?.room || 'Academic Wing L-302'}</span>
           </div>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-8 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 md:border-l border-slate-50 md:pl-12">
      <div className="text-right">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
         <p className="text-2xl font-mono font-bold text-brand-blue">{enrollment.subject?.units}.0u</p>
      </div>
      <button
        onClick={() => onDrop(enrollment.id)}
        disabled={enrollment.status === 'pending_drop'}
        className={cn(
          "px-8 py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2",
          enrollment.status === 'pending_drop' 
            ? "border-amber-100 bg-amber-50 text-amber-600 grayscale opacity-70"
            : "border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white"
        )}
      >
        {enrollment.status === 'pending_drop' ? <Clock size={14} /> : <Trash2 size={14} />}
        {enrollment.status === 'pending_drop' ? 'Drop Pending' : 'Request Drop'}
      </button>
    </div>
  </motion.div>
);

export default function StudyLoad() {
  const { profile } = useAuth();
  const [load, setLoad] = useState<any[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoad();
  }, [profile]);

  const fetchLoad = async () => {
    if (!profile) return;
    try {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      const sysConfig = configSnap.data() as SystemConfig;
      setConfig(sysConfig);

      const q1 = query(
        collection(db, 'enrollments'), 
        where('userId', '==', profile.uid),
        where('status', '==', 'approved')
      );
      const q2 = query(
        collection(db, 'enrollments'), 
        where('userId', '==', profile.uid),
        where('status', '==', 'pending_drop')
      );
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const combined = [...snap1.docs, ...snap2.docs];
      
      const data = await Promise.all(combined.map(async d => {
        const enrollment = { id: d.id, ...d.data() } as Enrollment;
        const subjectSnap = await getDoc(doc(db, 'subjects', enrollment.subjectId));
        return {
          ...enrollment,
          subject: subjectSnap.exists() ? subjectSnap.data() as Subject : null
        };
      }));
      setLoad(data);
    } catch (e) {
      toast.error('Failed to load study load');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (enrollmentId: string) => {
    if (!config) return;
    
    // Lock logic: midtermDate - 7 days
    const midterm = new Date(config.midtermDate);
    const lockoutDate = subDays(midterm, 7);
    
    if (isBefore(lockoutDate, new Date())) {
      toast.error('Dropping is currently LOCKED (1 week before midterm)');
      return;
    }

    if (!confirm('Are you sure you want to request to DROP this subject?')) return;

    try {
      await updateDoc(doc(db, 'enrollments', enrollmentId), { status: 'pending_drop' });
      toast.success('Drop request submitted for review');
      fetchLoad();
    } catch (e) {
      toast.error('Failed to submit drop request');
    }
  };

  const totalUnits = load.reduce((acc, curr) => acc + (curr.subject?.units || 0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Academic Load</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20">Verified Load</div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">AY 2026 Academic Records</p>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Official Certificate of Matriculation</h1>
          </div>
        </div>

        <div className="flex gap-4">
           <button className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all shadow-sm">
             <Download size={20} />
           </button>
           <button className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-brand-blue/20 hover:-translate-y-1 transition-all active:translate-y-0">
             <Printer size={16} />
             Print Certificate
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          {load.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8">
                  <BookMarked size={40} />
               </div>
               <h3 className="text-xl font-display font-bold text-brand-blue mb-2">No Enrollment Records Found</h3>
               <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                 You haven't been officially enrolled in any courses for the current semester yet.
               </p>
            </div>
          ) : (
            load.map((item) => (
              <EnrolledCard key={item.id} enrollment={item} onDrop={handleDrop} />
            ))
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-brand-blue p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-brand-blue/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                 <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-8">Load Summary</p>
                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/10 pb-6">
                       <span className="text-white/40 text-xs font-bold uppercase">Total Units</span>
                       <span className="text-4xl font-mono font-bold">{totalUnits}.0</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-6">
                       <span className="text-white/40 text-xs font-bold uppercase">Course Count</span>
                       <span className="text-2xl font-mono font-bold">{load.length}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-white/40 text-xs font-bold uppercase">Classification</span>
                       <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">Regular Static</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 text-brand-gold">
                <ShieldAlert size={20} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">System Constraints</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic mb-8">
                "Subject dropping is governed by institutional policy. Electronic filing must be completed 7 days prior to midterm examinations."
              </p>
              <div className="space-y-4">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-2">Midterm Lockout</p>
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-brand-blue">
                          {config?.midtermDate ? format(subDays(new Date(config.midtermDate), 7), 'MMMM dd, yyyy') : 'TBA'}
                       </p>
                       <Clock size={16} className="text-brand-gold" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
