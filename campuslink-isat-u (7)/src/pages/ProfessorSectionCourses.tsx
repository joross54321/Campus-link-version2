import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight, 
  Sparkles,
  Users
} from 'lucide-react';
import { Subject } from '../types';

export default function ProfessorSectionCourses() {
  const { sectionName } = useParams();
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!profile || !sectionName) {
        if (!sectionName) setLoading(false);
        return;
      }
      try {
        const college = profile.college || 'College of Arts and Sciences';
        const q = query(
          collection(db, 'subjects'), 
          where('college', '==', college),
          where('section', '==', decodeURIComponent(sectionName))
        );
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [profile, sectionName]);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-6 pb-4">
        <Link 
          to="/professor/sections"
          className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-brand-gold/20">Handling Courses</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{decodeURIComponent(sectionName || '')}</p>
          </div>
          <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Assigned Subjects</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="h-56 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
          ))
        ) : subjects.length > 0 ? (
          subjects.map((sub, idx) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to={`/professor/management/${sub.id}`}
                className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-gold/30 transition-all flex flex-col h-full relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div className="bg-brand-blue/5 text-brand-blue px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                     {sub.code}
                   </div>
                   <Users size={18} className="text-slate-200 group-hover:text-brand-gold transition-colors" />
                </div>

                <div className="relative z-10 mb-8">
                  <h3 className="text-2xl font-display font-bold text-brand-blue mb-2 group-hover:text-brand-gold transition-colors leading-tight">{sub.title}</h3>
                  <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <span>Year {sub.yearLevel}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <span>Sem {sub.semester}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                   <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Manage Students</p>
                   <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                </div>

                <div className="absolute bottom-0 right-0 p-12 opacity-5 text-brand-blue group-hover:scale-125 transition-transform rotate-12">
                   <BookOpen size={120} />
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 text-center">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Sparkles size={32} />
             </div>
             <p className="text-slate-400 text-sm font-medium">No courses found for this section</p>
          </div>
        )}
      </div>
    </div>
  );
}
