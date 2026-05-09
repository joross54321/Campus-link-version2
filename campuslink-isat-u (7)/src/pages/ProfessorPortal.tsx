import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { Subject, Enrollment, Grade } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  FileEdit, 
  Send, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  Sparkles,
  Layers,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Clock,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProfessorPortal() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId) {
      fetchSubjectAndStudents(subjectId);
    }
  }, [subjectId, profile]);

  const fetchSubjectAndStudents = async (id: string) => {
    if (!profile) return;
    setLoading(true);
    try {
      const subSnap = await getDoc(doc(db, 'subjects', id));
      if (subSnap.exists()) {
        const s = { id: subSnap.id, ...subSnap.data() } as Subject;
        setSelectedSubject(s);
        
        const q = query(
          collection(db, 'enrollments'), 
          where('subjectId', '==', s.id),
          where('status', '==', 'approved')
        );
        const snap = await getDocs(q);
        const studentList = await Promise.all(snap.docs.map(async d => {
          const enrollment = d.data() as Enrollment;
          const userSnap = await getDoc(doc(db, 'users', enrollment.userId));
          
          const gradeQ = query(
            collection(db, 'grades'), 
            where('userId', '==', enrollment.userId),
            where('subjectId', '==', s.id)
          );
          const gradeSnap = await getDocs(gradeQ);
          const existingGrade = gradeSnap.empty ? null : gradeSnap.docs[0].data();

          if (existingGrade) {
            setGrades(prev => ({ ...prev, [enrollment.userId]: existingGrade.grade }));
          }

          return {
            id: enrollment.userId,
            enrollmentId: d.id,
            name: userSnap.exists() ? `${userSnap.data().firstName} ${userSnap.data().surname}` : 'Unknown',
            studentId: userSnap.exists() ? userSnap.data().studentId : '---',
            gradeStatus: existingGrade ? existingGrade.status : 'unsubmitted'
          };
        }));
        setStudents(studentList);
      }
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const submitGrades = async () => {
    if (!selectedSubject || !profile) return;
    setLoading(true);
    try {
      for (const studentId of Object.keys(grades)) {
        const gradeData = {
          userId: studentId,
          subjectId: selectedSubject.id,
          professorId: profile.uid,
          grade: grades[studentId],
          status: 'pending', 
          academicYear: '2025-2026', 
          semester: selectedSubject.semester
        };
        
        const gradeId = `${studentId}_${selectedSubject.id}`;
        await setDoc(doc(db, 'grades', gradeId), gradeData);
      }
      toast.success('Grades submitted to Admin Unit for posting');
      if (subjectId) fetchSubjectAndStudents(subjectId);
    } catch (e) {
      toast.error('Grade submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-brand-gold/20">Class Registry</div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Digital Scholastic Ledger</p>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Student Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm group">
          <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center text-brand-blue shadow-lg shadow-brand-gold/20 transition-transform group-hover:rotate-12">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Academic Unit</p>
            <p className="text-sm font-bold text-brand-blue tracking-tight">{profile?.college}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content Area Only (Removed Sidebar) */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {!selectedSubject ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200 text-center p-20 shadow-inner group"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 animate-pulse">
                  <BookOpen size={48} />
                </div>
                <h4 className="text-2xl font-display font-bold text-brand-blue mb-4">Synchronizing Records</h4>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                   Please wait while we establish a secure connection to the academic database and retrieve the current student roster.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="grades"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-10 lg:p-14 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-xl shadow-brand-blue/10">
                       <Users size={30} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-display font-bold text-brand-blue mb-1 leading-none tracking-tight">{selectedSubject.title}</h3>
                      <div className="flex items-center gap-3">
                         <div className="bg-brand-gold text-brand-blue px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{selectedSubject.section}</div>
                         <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">{selectedSubject.code}</p>
                         <div className="w-1 h-1 rounded-full bg-slate-200" />
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Class Capacity: {students.length} Students</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-100/50 text-slate-400 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] flex items-center gap-3 border border-slate-200/50">
                    <ShieldAlert size={14} className="text-brand-gold" />
                    Read-Only Archive
                  </div>
                </div>

                <div className="p-4 lg:p-8">
                  <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-10 py-6">Identity</th>
                          <th className="px-10 py-6">Institutional ID</th>
                          <th className="px-10 py-6">Evaluation Score</th>
                          <th className="px-10 py-6 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map(std => (
                          <tr key={std.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-10 py-6">
                              <p className="font-bold text-brand-ink group-hover:text-brand-blue transition-colors">{std.name}</p>
                            </td>
                            <td className="px-10 py-6">
                              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{std.studentId}</span>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-mono font-bold text-brand-blue shadow-inner flex items-center justify-center">
                                   {grades[std.id]?.toFixed(2) || '0.00'}
                                 </div>
                                <span className={cn(
                                   "text-[9px] font-bold uppercase px-2 py-1 rounded-md",
                                   (grades[std.id] || 0) <= 3.0 && (grades[std.id] || 0) >= 1.0 ? "text-emerald-500 bg-emerald-50" : (grades[std.id] || 0) > 3.0 ? "text-rose-500 bg-rose-50" : "text-slate-200"
                                )}>
                                   {(grades[std.id] || 0) <= 3.0 && (grades[std.id] || 0) >= 1.0 ? 'Passed' : (grades[std.id] || 0) > 3.0 ? 'FAILED' : 'WAITING'}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className={cn(
                                "text-[9px] font-bold uppercase px-4 py-2 rounded-xl inline-flex items-center gap-2 border bg-white",
                                std.gradeStatus === 'posted' ? "text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5" : 
                                std.gradeStatus === 'pending' ? "text-brand-gold border-brand-gold/20 shadow-sm" : "text-slate-300 border-slate-100"
                              )}>
                                {std.gradeStatus === 'posted' ? <CheckCircle2 size={12} /> : std.gradeStatus === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                                {std.gradeStatus === 'posted' ? 'Validated' : std.gradeStatus === 'pending' ? 'Transit' : 'Not Filed'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-10 bg-brand-paper/50 flex flex-col items-center">
                   <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldAlert size={14} className="text-brand-gold" />
                      Institutional Audit Protection
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 text-center max-w-sm leading-relaxed">
                      This roster is a certified replica of the enrollment database. Grade modifications are archived for verification.
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
