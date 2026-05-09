import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  getDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { Subject, Grade, Enrollment } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  Info,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function EnrollmentWizard() {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    college: '',
    program: '',
    semester: '1',
    yearLevel: 1,
    status: 'Regular'
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userGrades, setUserGrades] = useState<string[]>([]); 
  const [enrolledCodes, setEnrolledCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const subjectsSnap = await getDocs(collection(db, 'subjects'));
        const subjectsData = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
        setSubjects(subjectsData);

        if (profile) {
          const gradesQ = query(
            collection(db, 'grades'), 
            where('userId', '==', profile.uid),
            where('status', '==', 'posted')
          );
          const gradesSnap = await getDocs(gradesQ);
          const passedCodes = gradesSnap.docs
            .filter(d => d.data().grade <= 3.0) 
            .map(d => d.data().subjectCode || ''); 
          setUserGrades(passedCodes);

          const enrollQ = query(collection(db, 'enrollments'), where('userId', '==', profile.uid));
          const enrollSnap = await getDocs(enrollQ);
          const enrolled = enrollSnap.docs.map(d => d.data().subjectId);
          setEnrolledCodes(enrolled);
        }
      } catch (error) {
        toast.error('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const toggleSubject = (s: Subject) => {
    const missing = s.prerequisites.filter(p => !userGrades.includes(p));
    if (missing.length > 0) {
      toast.error(`Prerequisites not met: ${missing.join(', ')}`);
      return;
    }

    if (selectedIds.includes(s.id)) {
      setSelectedIds(prev => prev.filter(id => id !== s.id));
    } else {
      const currentUnits = subjects
        .filter(sub => selectedIds.includes(sub.id))
        .reduce((acc, curr) => acc + curr.units, 0);
      
      if (currentUnits + s.units > (profile?.maxUnits || 30)) {
        toast.error(`You have reached the maximum unit capacity (${profile?.maxUnits} units)`);
        return;
      }

      setSelectedIds(prev => [...prev, s.id]);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    if (config.college && s.college !== config.college) return false;
    if (config.semester && s.semester !== config.semester) return false;
    if (config.yearLevel && s.yearLevel !== config.yearLevel) return false;
    return !enrolledCodes.includes(s.id);
  });

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      const config = configSnap.data();

      for (const sid of selectedIds) {
        await addDoc(collection(db, 'enrollments'), {
          userId: profile?.uid,
          subjectId: sid,
          status: 'pending',
          academicYear: config?.currentAcademicYear,
          semester: config?.currentSemester,
          requestedAt: new Date().toISOString()
        });
      }
      toast.success('Enrollment sent for approval!');
      setStep(4);
    } catch (e) {
      toast.error('Enrollment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelectedUnits = subjects
    .filter(s => selectedIds.includes(s.id))
    .reduce((acc, curr) => acc + curr.units, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Enrollment Engine</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Dynamic Progress Stepper */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-brand-gold/10 text-brand-gold px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-brand-gold/20">Step {step} of 3</div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">AY 2026 Academic Transition</p>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Academic Enrollment</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative">
           {[1, 2, 3, 4].map((s) => (
             <div key={s} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm transition-all duration-500",
                  step === s ? "bg-brand-blue text-white shadow-xl shadow-brand-blue/20" : step > s ? "bg-brand-gold text-brand-blue" : "bg-slate-50 text-slate-300"
                )}>
                  {step > s ? <CheckCircle2 size={18} /> : s}
                </div>
                {s < 4 && <div className={cn("w-12 h-1 mx-2 rounded-full", step > s ? "bg-brand-gold" : "bg-slate-100")} />}
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }} 
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 lg:p-20 border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <GraduationCap size={400} />
               </div>
               
               <div className="relative z-10">
                 <h2 className="text-3xl font-display font-bold text-brand-blue mb-10 tracking-tight">Eligibility Verification</h2>
                 <p className="text-slate-500 mb-12 max-w-lg leading-relaxed">
                   Before proceeding to subject selection, please verify that your system profile reflects the correct academic standing for the upcoming semester.
                 </p>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                   {[
                     { label: 'Academic Program', value: profile?.program, icon: BookOpen },
                     { label: 'Year Classification', value: `Year ${profile?.yearLevel}`, icon: Layers },
                     { label: 'College Faculty', value: profile?.college, icon: GraduationCap },
                     { label: 'Max Load Capacity', value: `${profile?.maxUnits} Units`, icon: Sparkles }
                   ].map((item, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-gold/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-4 text-brand-blue shadow-sm">
                           <item.icon size={16} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-brand-ink">{item.value}</p>
                      </div>
                   ))}
                 </div>

                 <div className="flex items-center gap-6">
                    <div className="flex-1 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enrollment Status</p>
                        <p className="font-display font-bold text-emerald-900">Cleared for Registration</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setStep(2)} 
                      className="bg-brand-blue text-white px-10 py-6 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-blue/20 hover:bg-brand-blue/90 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center gap-3"
                    >
                      Start Selection
                      <ArrowRight size={18} />
                    </button>
                 </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-brand-blue p-10 rounded-[2.5rem] text-white overflow-hidden relative">
                  <div className="relative z-10">
                    <h4 className="text-xl font-display font-bold mb-4">Enrollment Guidelines</h4>
                    <p className="text-white/40 text-xs leading-relaxed mb-6 font-light">
                      Students are advised to select courses strictly following the prescribed curriculum. Prerequisite validation is real-time.
                    </p>
                    <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-brand-gold/80">
                       <li className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-brand-gold" />
                         Check PREREQUISITES
                       </li>
                       <li className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-brand-gold" />
                         Verify SLOT AVAILABILITY
                       </li>
                       <li className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-brand-gold" />
                         Submit FOR APPROVAL
                       </li>
                    </ul>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-[40px]" />
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 italic font-light text-slate-400 text-xs leading-relaxed text-center">
                  "The root of education is bitter, but the fruit is sweet. Manage your academic journey with precision."
               </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2-config" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="space-y-12"
          >
            <div className="bg-white rounded-[3rem] p-12 lg:p-20 border border-slate-100 shadow-sm relative overflow-hidden">
               <h2 className="text-3xl font-display font-bold text-brand-blue mb-10 tracking-tight">Pre-Enrollment Configuration</h2>
               
               <div className="space-y-12">
                 {/* College Selection */}
                 {!config.college ? (
                   <div className="space-y-6">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Select Academic Unit</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[
                         { id: 'CCI', name: 'College of Computing and Informatics', icon: '💻', desc: 'Computer Science, Information Technology, Data Science' },
                         { id: 'CAS', name: 'College of Arts and Sciences', icon: '🎨', desc: 'Natural Sciences, Mathematics, Humanities' },
                         { id: 'COE', name: 'College of Engineering', icon: '⚙️', desc: 'Civil, Mechanical, Electrical Engineering' },
                         { id: 'CBM', name: 'College of Business Management', icon: '🏢', desc: 'Accountancy, Business Admin, Marketing' }
                       ].map(c => (
                         <button 
                           key={c.id} 
                           onClick={() => setConfig(prev => ({ ...prev, college: c.id }))}
                           className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-brand-gold hover:shadow-xl hover:shadow-brand-gold/10 transition-all text-left flex items-start gap-6 group"
                         >
                           <span className="text-4xl group-hover:scale-110 transition-transform">{c.icon}</span>
                           <div>
                             <p className="font-display font-bold text-brand-ink mb-1">{c.name}</p>
                             <p className="text-xs text-slate-400 font-medium">{c.desc}</p>
                           </div>
                         </button>
                       ))}
                     </div>
                   </div>
                 ) : !config.program ? (
                   <div className="space-y-6">
                     <div className="flex items-center justify-between px-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Program in {config.college}</p>
                       <button onClick={() => setConfig(prev => ({ ...prev, college: '' }))} className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Change Unit</button>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                       {['BS Computer Science', 'BS Information Technology', 'BS Data Science'].map(p => (
                         <button 
                           key={p} 
                           onClick={() => setConfig(prev => ({ ...prev, program: p }))}
                           className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-brand-gold transition-all text-left flex items-center justify-between group"
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-brand-gold flex items-center justify-center transition-colors">
                                 <div className="w-1.5 h-1.5 bg-brand-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="font-bold text-brand-blue">{p}</span>
                           </div>
                           <span className="text-[10px] font-mono text-slate-300">4-Year Track • 143 Units</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-12">
                     <div className="flex items-center justify-between bg-brand-paper p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">🎓</div>
                           <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selected Program</p>
                              <p className="text-sm font-bold text-brand-blue">{config.program}</p>
                           </div>
                        </div>
                        <button onClick={() => setConfig(prev => ({ ...prev, program: '' }))} className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Change</button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year Level</p>
                           <div className="grid grid-cols-2 gap-4">
                              {[1, 2, 3, 4].map(y => (
                                 <button 
                                    key={y} 
                                    onClick={() => setConfig(prev => ({ ...prev, yearLevel: y }))}
                                    className={cn(
                                       "p-6 rounded-2xl border transition-all font-display font-bold text-center",
                                       config.yearLevel === y ? "bg-brand-blue text-white border-transparent shadow-lg shadow-brand-blue/20" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                    )}
                                 >
                                    <span className="text-xl mb-1 block">{y === 1 ? '🥇' : y === 2 ? '🥈' : y === 3 ? '🥉' : '🎓'}</span>
                                    {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-6">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester Choice</p>
                           <div className="space-y-4">
                              {[
                                 { id: '1', name: '1st Semester', desc: 'Fall Academic Term' },
                                 { id: '2', name: '2nd Semester', desc: 'Spring Academic Term' },
                                 { id: 'Summer', name: 'Summer Term', desc: 'Inter-semester intensive' }
                              ].map(s => (
                                 <button 
                                    key={s.id} 
                                    onClick={() => setConfig(prev => ({ ...prev, semester: s.id as any }))}
                                    className={cn(
                                       "w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between",
                                       config.semester === s.id ? "bg-brand-gold text-brand-blue border-transparent shadow-lg shadow-brand-gold/20" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                    )}
                                 >
                                    <div>
                                       <p className="font-bold leading-none mb-1">{s.name}</p>
                                       <p className={cn("text-[9px] font-medium", config.semester === s.id ? "text-brand-blue/60" : "text-slate-300")}>{s.desc}</p>
                                    </div>
                                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.semester === s.id ? "border-brand-blue/30" : "border-slate-200")}>
                                       <div className={cn("w-1.5 h-1.5 rounded-full", config.semester === s.id ? "bg-brand-blue" : "bg-transparent")} />
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-end pt-8">
                        <button 
                           onClick={() => setStep(3)}
                           className="bg-brand-blue text-white px-12 py-6 rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-2xl shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                        >
                           Proceed to Courses
                           <ArrowRight size={20} />
                        </button>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Load Analyzer Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-8">
                  <h3 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] mb-10 text-center">Load Analyzer</h3>
                  
                  <div className="space-y-8">
                    <div className="flex flex-col items-center">
                      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                           <motion.circle 
                              cx="80" cy="80" r="70" 
                              stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray={440}
                              strokeDashoffset={440 - (440 * (totalSelectedUnits / (profile?.maxUnits || 30)))}
                              strokeLinecap="round"
                              className="text-brand-gold transition-all duration-1000"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-mono font-bold text-brand-blue leading-none">{totalSelectedUnits}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Units Total</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">Capacity: {profile?.maxUnits}u</p>
                    </div>
                    
                    <div className="h-[1px] bg-slate-50" />

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Active Selection</p>
                      {selectedIds.length === 0 ? (
                        <div className="flex flex-col items-center py-6 border-2 border-dashed border-slate-50 rounded-2xl">
                           <p className="text-[9px] text-slate-300 font-bold uppercase italic">Select courses</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {subjects.filter(s => selectedIds.includes(s.id)).map(s => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={s.id} 
                              className="text-[11px] font-bold text-brand-blue flex justify-between bg-brand-paper p-4 rounded-xl border border-slate-100 group"
                            >
                              <div className="flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-brand-gold" />
                                 <span>{s.code}</span>
                              </div>
                              <span className="text-slate-400 group-hover:text-brand-gold transition-colors">{s.units}u</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-4">
                      <button 
                        disabled={selectedIds.length === 0 || submitting}
                        onClick={handleConfirm}
                        className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-blue/90 disabled:grayscale disabled:opacity-50 transition-all shadow-xl shadow-brand-blue/20 active:scale-95"
                      >
                        {submitting ? 'Authenticating...' : 'Submit Enrollment'}
                      </button>
                      <button onClick={() => setStep(1)} className="w-full text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:text-brand-blue flex items-center justify-center gap-2 transition-all">
                        <ArrowLeft size={12} />
                        Back to Identity
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Grid */}
              <div className="lg:col-span-3 space-y-8">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl flex-1 flex items-center gap-4 border border-slate-100 focus-within:border-brand-gold focus-within:bg-white transition-all">
                    <Search className="text-slate-300" size={20} />
                    <input type="text" placeholder="Search Academic Catalog..." className="bg-transparent border-none focus:ring-0 text-sm font-bold text-brand-blue flex-1 placeholder:text-slate-300 placeholder:font-medium" />
                  </div>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    {['All', 'OPEN', 'FULL'].map(filter => (
                      <button key={filter} className={cn("px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", filter === 'All' ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-brand-blue")}>{filter}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pb-20">
                  {filteredSubjects.map((s) => {
                    const isSelected = selectedIds.includes(s.id);
                    const missingPrereqs = s.prerequisites.filter(p => !userGrades.includes(p));
                    const isLocked = missingPrereqs.length > 0;

                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={s.id}
                        onClick={() => !isLocked && toggleSubject(s)}
                        className={cn(
                          "bg-white p-8 rounded-[2.5rem] border border-slate-100 transition-all cursor-pointer group flex flex-col md:flex-row items-stretch gap-8 relative overflow-hidden",
                          isSelected ? "border-brand-gold bg-brand-gold/[0.02] shadow-xl" : "hover:border-slate-300 hover:translate-x-1",
                          isLocked && "opacity-40 grayscale"
                        )}
                      >
                        <div className="w-1 md:w-2 bg-slate-50 group-hover:bg-brand-gold absolute left-0 inset-y-0 transition-colors" />
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-sm font-bold text-brand-gold uppercase tracking-[0.2em]">{s.code}</span>
                              <div className="flex gap-3">
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                                  isLocked ? "bg-rose-50 text-rose-500" : s.availableSlots > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}>
                                  {isLocked ? 'Locked' : s.availableSlots > 0 ? `${s.availableSlots} Slots Available` : 'Full Capacity'}
                                </div>
                                <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-bold uppercase tracking-widest border border-slate-100">
                                   Section {s.section || 'A'}
                                </div>
                              </div>
                            </div>
                            <h4 className="text-2xl font-display font-bold text-brand-ink mb-6 tracking-tight leading-none group-hover:text-brand-blue transition-colors">{s.title}</h4>
                          </div>

                          <div className="flex flex-wrap gap-3">
                             <div className="flex items-center gap-2 px-4 py-2 bg-brand-paper rounded-xl border border-slate-100 text-[11px] font-bold text-brand-blue">
                                <Calendar size={14} className="text-brand-gold" />
                                <span>MWF 08:00 - 10:00</span>
                             </div>
                             <div className="flex items-center gap-2 px-4 py-2 bg-brand-paper rounded-xl border border-slate-100 text-[11px] font-bold text-brand-blue">
                                <GraduationCap size={14} className="text-brand-gold" />
                                <span>L-524 Lab</span>
                             </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end gap-6 md:min-w-[140px] border-l border-slate-50 md:pl-8">
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic Weight</p>
                              <p className="text-2xl font-mono font-bold text-brand-ink leading-none">{s.units}.0u</p>
                           </div>

                           {isLocked ? (
                             <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-3 rounded-2xl w-full justify-center">
                               <Lock size={16} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Prereq Required</span>
                             </div>
                           ) : (
                             <button className={cn(
                               "w-full py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95",
                               isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-brand-gold text-brand-blue hover:shadow-xl hover:shadow-brand-gold/20"
                             )}>
                               {isSelected ? 'Selected' : 'Enroll Now'}
                             </button>
                           )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-brand-blue rounded-[4rem] p-16 lg:p-24 shadow-2xl text-center max-w-4xl mx-auto overflow-hidden relative border border-white/5"
          >
            <div className="absolute inset-0 pointer-events-none opacity-20">
               <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold rounded-full filter blur-[120px]" />
               <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-400 rounded-full filter blur-[120px]" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mb-10 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-5xl font-display font-bold text-white mb-6 tracking-tight">Records Transmitted</h2>
              <p className="text-white/50 text-lg lg:text-xl font-light mb-12 max-w-xl leading-relaxed">
                Your pre-enrollment request is now queued for secondary verification. You will be notified via the student portal once the registrar confirms your load.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                <button 
                  onClick={() => window.location.href = '/dashboard'} 
                  className="flex-1 bg-brand-gold text-brand-blue py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:-translate-y-1 transition-all"
                >
                  Return to Dashboard
                </button>
                <button 
                  onClick={() => window.location.href = '/study-load'} 
                  className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
                >
                  View Queue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
