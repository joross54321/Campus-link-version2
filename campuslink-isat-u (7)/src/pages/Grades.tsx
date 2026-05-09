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
  orderBy
} from 'firebase/firestore';
import { Grade, Subject } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  GraduationCap, 
  Search, 
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Share2,
  TrendingDown,
  TrendingUp,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const GradeCard = ({ grade }: { grade: any, key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-gold/30 hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-6 flex-1">
      <div className="w-12 h-12 rounded-xl bg-brand-blue/5 flex items-center justify-center font-display font-bold text-brand-blue group-hover:scale-110 transition-transform">
        {grade.subject?.units || 3}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">{grade.subject?.code}</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{grade.professorName}</span>
        </div>
        <h4 className="text-lg font-display font-bold text-brand-ink leading-tight">{grade.subject?.title || 'Subject Title'}</h4>
      </div>
    </div>
    
    <div className="flex items-center gap-12">
      <div className="text-right hidden sm:block">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Semester</p>
        <p className="text-sm font-bold text-brand-ink">II - 2026</p>
      </div>

      <div className="bg-brand-paper w-16 h-16 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-brand-blue border border-slate-100">
        <span className="text-[9px] uppercase tracking-tighter opacity-40 leading-none mb-1">Grade</span>
        <span className="text-xl leading-none">{grade.grade.toFixed(1)}</span>
      </div>
    </div>
  </motion.div>
);

export default function Grades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [profile]);

  const fetchGrades = async () => {
    if (!profile) return;
    try {
      const q = query(
        collection(db, 'grades'), 
        where('userId', '==', profile.uid),
        where('status', '==', 'posted')
      );
      const snap = await getDocs(q);
      const data = await Promise.all(snap.docs.map(async d => {
        const grade = d.data() as Grade;
        const subjectSnap = await getDoc(doc(db, 'subjects', grade.subjectId));
        const profSnap = await getDoc(doc(db, 'users', grade.professorId));
        return {
          ...grade,
          subject: subjectSnap.exists() ? subjectSnap.data() as Subject : null,
          professorName: profSnap.exists() ? `${profSnap.data().firstName} ${profSnap.data().surname}` : 'N/A'
        };
      }));
      setGrades(data);
    } catch (e) {
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((acc, curr) => acc + curr.grade, 0);
    return (total / grades.length).toFixed(2);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Academic Records</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Academic History</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Scholastic Records</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
             <Printer size={16} />
             Print Load
           </button>
           <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue/90 transition-colors uppercase tracking-widest shadow-xl shadow-brand-blue/10">
             <Download size={16} />
             Certificate
           </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-brand-blue rounded-[2.5rem] p-10 lg:p-14 text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
               <GraduationCap size={400} className="absolute -bottom-20 -right-20" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12">
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-4">Cumulative Weighted Average</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl lg:text-9xl font-display font-bold tracking-tighter leading-none">{calculateGPA()}</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm bg-white/5 px-3 py-1 rounded-full mb-4">
                    <TrendingUp size={16} />
                    <span>0.15</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="text-right">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Standing</p>
                    <p className="text-xl font-display font-bold text-brand-gold">DEAN'S LISTER</p>
                 </div>
                 <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-brand-gold" />
                 </div>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Units Earned</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-mono font-bold text-brand-blue">48.0</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Passed all</span>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Failed/Incomplete</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-mono font-bold text-slate-300">0</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">Clear Records</span>
              </div>
           </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-display font-bold text-brand-blue tracking-tight">Active Semester Performance</h3>
            <div className="flex items-center gap-2 text-slate-400">
               <Calendar size={16} />
               <span className="text-xs font-bold uppercase tracking-widest italic">SY 2025-2026, 2ND SEM</span>
            </div>
         </div>
         
         <div className="grid grid-cols-1 gap-4">
            {grades.length === 0 ? (
              <div className="bg-white py-24 rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <FileText size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-light text-lg">No results have been officially posted for this semester yet.</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase mt-2 tracking-widest">Office of Administration</p>
              </div>
            ) : (
              grades.map((g) => <GradeCard key={g.id} grade={g} />)
            )}
         </div>
      </div>
    </div>
  );
}
