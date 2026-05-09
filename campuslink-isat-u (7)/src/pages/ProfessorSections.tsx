import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Layers, 
  ChevronRight, 
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function ProfessorSections() {
  const { profile } = useAuth();
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      if (!profile) {
        setLoading(false);
        console.log("No profile found");
        return;
      }
      try {
        const college = profile.college || 'College of Arts and Sciences';
        console.log("Fetching sections for college:", college);
        const q = query(collection(db, 'subjects'), where('college', '==', college));
        const snap = await getDocs(q);
        
        const uniqueSections = Array.from(new Set(
          snap.docs
            .map(d => d.data().section)
            .filter(Boolean)
        )).sort();
        
        setSections(uniqueSections);
      } catch (e) {
        console.error("Error fetching sections:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [profile]);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-6 pb-4">
        <Link 
          to="/professor"
          className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-brand-gold/20">Instructional Audit</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Section Overview</p>
          </div>
          <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Assigned Sections</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
          ))
        ) : sections.length > 0 ? (
          sections.map((section, idx) => (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to={`/professor/sections/${encodeURIComponent(section)}`}
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-gold/30 hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-blue group-hover:scale-110 group-hover:rotate-12 transition-transform">
                   <Layers size={80} />
                </div>
                
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/5 flex items-center justify-center mb-10 text-brand-blue group-hover:bg-brand-gold group-hover:text-brand-blue transition-colors relative z-10">
                   <BookOpen size={24} />
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold text-brand-blue mb-2 group-hover:text-brand-gold transition-colors">{section}</h3>
                  <div className="flex items-center justify-between">
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Academic Unit</p>
                     <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 text-center">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Sparkles size={32} />
             </div>
             <p className="text-slate-400 text-sm font-medium">No sections currently assigned to your profile</p>
          </div>
        )}
      </div>
    </div>
  );
}
