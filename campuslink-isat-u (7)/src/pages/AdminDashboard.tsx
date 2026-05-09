import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { Enrollment, UserProfile, Subject } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Database,
  UserPlus,
  ArrowUpRight,
  ClipboardCheck,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'grades' | 'system'>('approvals');
  const [navPath, setNavPath] = useState<any[]>([{ id: 'root', label: 'Colleges' }]);
  const [drillDown, setDrillDown] = useState<{
    level: 'colleges' | 'subRole' | 'faculty' | 'programs' | 'sections' | 'students' | 'detail';
    collegeId?: string;
    subRole?: 'student' | 'professor';
    program?: string;
    section?: string;
    selectedUserId?: string;
  }>({ level: 'colleges' });

  const COLLEGES = [
    { id: 'CCI', name: 'College of Computing and Informatics', icon: '💻', programs: ['BS Computer Science', 'BS Information Technology', 'BS Data Science'] },
    { id: 'CEA', name: 'College of Engineering and Architecture', icon: '🏗️', programs: ['BS Civil Engineering', 'BS Architecture', 'BS Electrical Engineering'] },
    { id: 'CED', name: 'College of Education', icon: '📖', programs: ['BE Elementary Education', 'BS Secondary Education'] },
    { id: 'CIT', name: 'College of Industrial Technology', icon: '🛠️', programs: ['BS Industrial Technology', 'BS Automotive Technology'] },
    { id: 'CAS', name: 'College of Arts and Sciences', icon: '🔬', programs: ['BS Biology', 'BS Mathematics', 'BA English'] }
  ];

  const goBack = () => {
    if (drillDown.level === 'detail') setDrillDown(prev => ({ ...prev, level: prev.subRole === 'professor' ? 'faculty' : 'students' }));
    else if (drillDown.level === 'students') setDrillDown(prev => ({ ...prev, level: 'sections' }));
    else if (drillDown.level === 'sections') setDrillDown(prev => ({ ...prev, level: 'programs' }));
    else if (drillDown.level === 'programs') setDrillDown(prev => ({ ...prev, level: 'subRole' }));
    else if (drillDown.level === 'faculty') setDrillDown(prev => ({ ...prev, level: 'subRole' }));
    else if (drillDown.level === 'subRole') setDrillDown({ level: 'colleges' });
  };

  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [pendingGrades, setPendingGrades] = useState<any[]>([]);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [userFilter, setUserFilter] = useState<'student' | 'professor'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State for New User
  const [newUser, setNewUser] = useState({
    studentId: '',
    surname: '',
    firstName: '',
    role: 'student' as 'student' | 'professor',
    college: 'College of Arts and Sciences',
    program: 'BS Computer Science',
    yearLevel: 1
  });

  useEffect(() => {
    fetchPendingApprovals();
    fetchPendingGrades();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setUserList(data);
    } catch (e) {
      toast.error('Failed to fetch user index');
    }
  };

  const fetchPendingGrades = async () => {
    try {
      const q = query(collection(db, 'grades'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const data = await Promise.all(snap.docs.map(async d => {
        const grade = { id: d.id, ...d.data() } as any;
        const userSnap = await getDoc(doc(db, 'users', grade.userId));
        const subSnap = await getDoc(doc(db, 'subjects', grade.subjectId));
        return {
          ...grade,
          studentName: userSnap.exists() ? `${userSnap.data().firstName} ${userSnap.data().surname}` : 'Unknown',
          subjectTitle: subSnap.exists() ? subSnap.data().title : 'Unknown'
        };
      }));
      setPendingGrades(data);
    } catch (e) {
      toast.error('Failed to fetch grades');
    }
  };

  const handlePostGrade = async (id: string) => {
    try {
      await updateDoc(doc(db, 'grades', id), { status: 'posted' });
      toast.success('Grade Officialy Posted');
      fetchPendingGrades();
    } catch (e) {
      toast.error('Posting failed');
    }
  };

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const q1 = query(collection(db, 'enrollments'), where('status', '==', 'pending'));
      const q2 = query(collection(db, 'enrollments'), where('status', '==', 'pending_drop'));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const combined = [...snap1.docs, ...snap2.docs];

      const data = await Promise.all(combined.map(async d => {
        const enrollment = { id: d.id, ...d.data() } as any;
        const userSnap = await getDoc(doc(db, 'users', enrollment.userId));
        const subjectSnap = await getDoc(doc(db, 'subjects', enrollment.subjectId));
        return {
          ...enrollment,
          studentName: userSnap.exists() ? `${userSnap.data().firstName} ${userSnap.data().surname}` : 'Unknown',
          subjectTitle: subjectSnap.exists() ? subjectSnap.data().title : 'Unknown',
          subjectCode: subjectSnap.exists() ? subjectSnap.data().code : '---'
        };
      }));
      setPendingEnrollments(data);
    } catch (error) {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'pending_drop' ? 'dropped' : 'approved';
      await updateDoc(doc(db, 'enrollments', id), { status: nextStatus });
      toast.success(currentStatus === 'pending_drop' ? 'Drop Approved' : 'Enrollment Approved');
      fetchPendingApprovals();
    } catch (e) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id: string, currentStatus: string) => {
    try {
      // If it was a pending drop, rejecting it means keeping it as approved
      const nextStatus = currentStatus === 'pending_drop' ? 'approved' : 'rejected';
      await updateDoc(doc(db, 'enrollments', id), { status: nextStatus });
      toast.success('Request Rejected');
      fetchPendingApprovals();
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = newUser.studentId; 
      await setDoc(doc(db, 'users', userId), {
        ...newUser,
        maxUnits: 30,
        createdAt: serverTimestamp()
      });

      toast.success(`${newUser.role} provisioned successfully!`);
      setNewUser({
        studentId: '',
        surname: '',
        firstName: '',
        role: 'student',
        college: 'College of Arts and Sciences',
        program: 'BS Computer Science',
        yearLevel: 1
      });
    } catch (error: any) {
      toast.error('Provisioning failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const seedFoundationData = async () => {
    setLoading(true);
    const sampleSubjects: any[] = [
      { id: 'CS101', code: 'CS 101', title: 'Introduction to Computing', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'CCI', availableSlots: 35, section: 'A' },
      { id: 'CS102', code: 'CS 102', title: 'Computer Programming 1', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'CCI', availableSlots: 40, section: 'A' },
      { id: 'CS103', code: 'CS 103', title: 'Computer Programming 2', units: 3, prerequisites: ['CS102'], yearLevel: 1, semester: '2', status: 'open', college: 'CCI', availableSlots: 35, section: 'B' },
      { id: 'CS201', code: 'CS 201', title: 'Data Structures and Algorithms', units: 3, prerequisites: ['CS103'], yearLevel: 2, semester: '1', status: 'open', college: 'CCI', availableSlots: 30, section: 'A' },
      { id: 'CS202', code: 'CS 202', title: 'Database Management Systems', units: 3, prerequisites: ['CS201'], yearLevel: 2, semester: '2', status: 'open', college: 'CCI', availableSlots: 30, section: 'A' },
      { id: 'DS101', code: 'DS 101', title: 'Data Science 1', units: 3, prerequisites: ['CS103'], yearLevel: 2, semester: '2', status: 'open', college: 'CCI', availableSlots: 30, section: 'A' },
      { id: 'MATH101', code: 'MATH 101', title: 'Calculus 1', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'CAS', availableSlots: 50, section: 'C' },
    ];

    const sampleUsers: any[] = [
      { studentId: '2026-CS-001', firstName: 'Julian', surname: 'De Vera', role: 'student', college: 'CCI', program: 'BS Computer Science', section: '1-A', credits: 142, gpa: 1.25 },
      { studentId: '2026-CS-002', firstName: 'Isabela', surname: 'Santos', role: 'student', college: 'CCI', program: 'BS Computer Science', section: '1-A', credits: 120, gpa: 1.45 },
      { studentId: '2026-IT-001', firstName: 'Mark', surname: 'Reyes', role: 'student', college: 'CCI', program: 'BS Information Technology', section: '2-B', credits: 90, gpa: 1.75 },
      { studentId: '2026-EE-001', firstName: 'Roberto', surname: 'Gomez', role: 'student', college: 'CEA', program: 'BS Electrical Engineering', section: '1-A', credits: 32, gpa: 1.85 },
      { studentId: 'FAC-CCI-001', firstName: 'Dr. Alan', surname: 'Turing', role: 'professor', college: 'CCI', department: 'Artificial Intelligence', handlingSections: ['BSCS 1-A', 'BSCS 4-A'] },
      { studentId: 'FAC-CAS-001', firstName: 'Prof. Marie', surname: 'Curie', role: 'professor', college: 'CAS', department: 'Physics', handlingSections: ['BS Phys 2-A'] }
    ];

    try {
      for (const subject of sampleSubjects) {
        await setDoc(doc(db, 'subjects', subject.id), subject);
      }
      for (const user of sampleUsers) {
        await setDoc(doc(db, 'users', user.studentId), user);
      }
      toast.success('Foundation data (Users & Subjects) seeded!');
      fetchUsers();
    } catch (e) {
      toast.error('Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header with Glass Morphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-brand-blue hover:text-brand-gold hover:border-brand-gold/30 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(255,204,0,0.5)]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Operational Readiness: Alpha</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-brand-blue tracking-tight">Administrative Operations</h1>
          </div>
        </div>

        <div className="flex p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm gap-1">
          {(['approvals', 'grades', 'users', 'system'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-brand-blue text-white shadow-xl shadow-brand-blue/20" 
                  : "text-slate-400 hover:text-brand-blue hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'grades' && (
          <motion.div 
            key="grades" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-brand-blue tracking-tight">Scholastic Validation Queue</h3>
                <p className="text-xs text-slate-400 font-medium">Secondary review for official numeric mark posting</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
                  <p className="text-sm font-bold text-brand-blue">{pendingGrades.length} Records Pending</p>
                </div>
                <button onClick={fetchPendingGrades} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-blue transition-colors">
                   <RefreshCw size={18} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400">
                  <tr>
                    <th className="px-10 py-6">Identity</th>
                    <th className="px-10 py-6">Academic Course</th>
                    <th className="px-10 py-6">Mark Value</th>
                    <th className="px-10 py-6 text-right">Commit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingGrades.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <ClipboardCheck size={64} className="mb-4" />
                          <p className="text-sm font-bold uppercase tracking-widest">No validation required</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingGrades.map(g => (
                      <tr key={g.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6 font-display font-bold text-brand-ink">{g.studentName}</td>
                        <td className="px-10 py-6 text-sm font-medium text-slate-500">{g.subjectTitle}</td>
                        <td className="px-10 py-6">
                           <div className="w-14 h-14 rounded-xl bg-brand-gold/10 flex items-center justify-center font-mono font-bold text-brand-gold text-lg">
                             {g.grade.toFixed(1)}
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => handlePostGrade(g.id)} 
                            className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold uppercase text-[9px] tracking-[0.2em] hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/10 transition-all active:scale-95"
                          >
                            Execute Post
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-brand-blue p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <Database size={500} className="absolute -bottom-20 -left-20" />
               </div>
               
               <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-brand-gold flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-brand-gold/40 hover:rotate-6 transition-transform cursor-pointer">
                    <RefreshCw size={32} className="text-brand-blue" />
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-6">Semester Transition Matrix</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-12 max-w-md mx-auto">
                    Initiating a global sync will batch-update all student records to the subsequent academic period. This action is terminal and cannot be rolled back.
                  </p>
                  
                  <div className="space-y-6">
                    <button 
                      onClick={seedFoundationData}
                      disabled={loading}
                      className="w-full bg-brand-gold text-brand-blue py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-brand-gold/20 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      <Database size={18} />
                      {loading ? 'Processing...' : 'Seed Foundation Data'}
                    </button>
                    <button className="w-full bg-white/10 text-white border border-white/10 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                      <ArrowRight size={18} />
                      Commit Automated Pipeline
                    </button>
                    <div className="flex items-center justify-center gap-2 text-rose-400">
                       <ShieldAlert size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Auth Level III Required</span>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div 
            key="approvals" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xl font-display font-bold text-brand-blue tracking-tight">Active Enrollment Requests</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time queue for student study load adjustments</p>
              </div>
              <button 
                onClick={fetchPendingApprovals}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition-colors text-brand-blue group"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-10 py-6">Entity Identity</th>
                    <th className="px-10 py-6">Academic Resource</th>
                    <th className="px-10 py-6">Request Classification</th>
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6 text-right">Commit Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center opacity-10">
                          <Search size={80} className="mb-6" />
                          <p className="text-xl font-display font-bold uppercase tracking-[0.3em]">Queue Terminal is Empty</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingEnrollments.map((req) => (
                      <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-brand-blue/5 flex items-center justify-center font-bold text-brand-blue text-xs">
                                {req.studentName[0]}
                              </div>
                              <div>
                                <p className="font-display font-bold text-brand-ink text-sm">{req.studentName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.userId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-3">
                              <div className="px-2 py-1 bg-brand-blue text-brand-gold text-[9px] font-black rounded uppercase tracking-tighter shadow-sm">
                                {req.subjectCode}
                              </div>
                              <p className="font-medium text-slate-600 text-sm">{req.subjectTitle}</p>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={cn(
                             "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                             req.status === 'pending_drop' 
                               ? "bg-rose-50 text-rose-500 border-rose-100" 
                               : "bg-emerald-50 text-emerald-500 border-emerald-100"
                           )}>
                             {req.status === 'pending_drop' ? 'Drop Request' : 'Pre-Enrollment'}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-slate-400 font-mono text-[10px]">
                          {req.requestedAt ? new Date(req.requestedAt).toISOString().split('T')[0] : 'SYSTEM'}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                            <button 
                              onClick={() => handleReject(req.id, req.status)}
                              className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            >
                              <XCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleApprove(req.id, req.status)}
                              className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Form */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm lg:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <UserPlus size={120} />
              </div>
              
              <h3 className="text-2xl font-display font-bold text-brand-blue mb-8 flex items-center gap-3 relative z-10">
                <UserPlus size={28} className="text-brand-gold" />
                Provision Identity
              </h3>
              
              <form onSubmit={handleAddUser} className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Deployment Role</label>
                    <select 
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold transition-all cursor-pointer appearance-none outline-none"
                    >
                      <option value="student">Student Account</option>
                      <option value="professor">Faculty Member</option>
                      <option value="registrar">System Administrator</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Academic Unit (College)</label>
                    <select 
                      value={newUser.college || ''}
                      onChange={e => setNewUser({...newUser, college: e.target.value})}
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold transition-all cursor-pointer appearance-none outline-none"
                    >
                      <option value="">Select College...</option>
                      {COLLEGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Assignment ID</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        value={newUser.studentId}
                        onChange={e => setNewUser({...newUser, studentId: e.target.value})}
                        placeholder="e.g. 2026-XQ-01"
                        className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-12 pr-5 py-4 font-mono text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                      />
                    </div>
                  </div>

                  {newUser.role === 'student' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Degree Program</label>
                        <select 
                          value={newUser.program || ''}
                          onChange={e => setNewUser({...newUser, program: e.target.value})}
                          className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                        >
                          <option value="">Select Program...</option>
                          {COLLEGES.find(c => c.id === newUser.college)?.programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Assigned Section</label>
                        <input 
                          type="text" 
                          value={newUser.section || ''}
                          onChange={e => setNewUser({...newUser, section: e.target.value})}
                          placeholder="e.g. 1-A"
                          className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  {newUser.role === 'professor' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Academic Department</label>
                      <input 
                        type="text" 
                        value={newUser.department || ''}
                        onChange={e => setNewUser({...newUser, department: e.target.value})}
                        placeholder="e.g. Software Engineering"
                        className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Given Name</label>
                    <input 
                      type="text" 
                      required
                      value={newUser.firstName}
                      onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-[0.2em]">Surname / Auth</label>
                    <input 
                      type="text" 
                      required
                      value={newUser.surname}
                      onChange={e => setNewUser({...newUser, surname: e.target.value})}
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-gold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-blue/90 shadow-2xl shadow-brand-blue/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:grayscale"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                    <span>Submit to Database</span>
                  </button>
                  <p className="text-[9px] text-center text-slate-300 font-bold uppercase mt-6 tracking-[0.3em]">Identity integrity verification active</p>
                </div>
              </form>
            </div>

            {/* List Placeholder with Aesthetic Card */}
            <div className="lg:col-span-3 space-y-8">
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                  {/* Drill-down Header */}
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        {drillDown.level !== 'colleges' && (
                          <button 
                            onClick={goBack}
                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors"
                          >
                             <ArrowLeft size={18} />
                          </button>
                        )}
                        <div>
                           <h4 className="font-display font-bold text-brand-blue text-sm uppercase tracking-widest">
                              {drillDown.level === 'colleges' ? 'Colleges' : 
                               drillDown.level === 'subRole' ? COLLEGES.find(c => c.id === drillDown.collegeId)?.name :
                               drillDown.level === 'programs' ? 'Select Program' :
                               drillDown.level === 'sections' ? drillDown.program :
                               drillDown.level === 'students' ? `${drillDown.program} - ${drillDown.section}` :
                               drillDown.level === 'faculty' ? 'Faculty Directory' :
                               'Profile Detail'}
                           </h4>
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                              Administrative Authority Index
                           </p>
                        </div>
                     </div>
                     <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold outline-none w-48" placeholder="Quick Filter..." />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    {drillDown.level === 'colleges' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {COLLEGES.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => setDrillDown({ level: 'subRole', collegeId: c.id })}
                            className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-brand-gold hover:shadow-xl hover:shadow-brand-gold/10 transition-all text-left flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-6">
                              <span className="text-4xl group-hover:scale-110 transition-transform">{c.icon}</span>
                              <div>
                                <p className="font-display font-bold text-brand-blue">{c.name}</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{c.id} Department</p>
                              </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-100 group-hover:text-brand-gold transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}

                    {drillDown.level === 'subRole' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto py-12">
                        <button 
                          onClick={() => setDrillDown(prev => ({ ...prev, level: 'faculty', subRole: 'professor' }))}
                          className="flex flex-col items-center p-12 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-gold transition-all group"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">👨‍🏫</div>
                          <span className="font-display font-bold text-brand-blue uppercase tracking-widest text-xs">Faculty / Professors</span>
                        </button>
                        <button 
                          onClick={() => setDrillDown(prev => ({ ...prev, level: 'programs', subRole: 'student' }))}
                          className="flex flex-col items-center p-12 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-gold transition-all group"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">🎓</div>
                          <span className="font-display font-bold text-brand-blue uppercase tracking-widest text-xs">Student Directory</span>
                        </button>
                      </div>
                    )}

                    {drillDown.level === 'programs' && (
                      <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
                        {COLLEGES.find(c => c.id === drillDown.collegeId)?.programs.map(p => (
                          <button 
                            key={p}
                            onClick={() => setDrillDown(prev => ({ ...prev, level: 'sections', program: p }))}
                            className="p-6 rounded-2xl border border-slate-100 hover:border-brand-gold text-left flex items-center justify-between group transition-all"
                          >
                            <span className="font-bold text-brand-blue text-sm">{p}</span>
                            <ArrowRight size={16} className="text-slate-200 group-hover:text-brand-gold" />
                          </button>
                        ))}
                      </div>
                    )}

                    {drillDown.level === 'sections' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B'].map(s => (
                           <button 
                            key={s}
                            onClick={() => setDrillDown(prev => ({ ...prev, level: 'students', section: s }))}
                            className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-gold font-display font-bold text-brand-blue transition-all"
                           >
                              {s}
                           </button>
                        ))}
                      </div>
                    )}

                    {drillDown.level === 'students' && (
                      <div className="divide-y divide-slate-50">
                        {userList.filter(u => u.role === 'student' && u.college === drillDown.collegeId).map(u => (
                          <button 
                            key={u.uid}
                            onClick={() => setDrillDown(prev => ({ ...prev, level: 'detail', selectedUserId: u.uid }))}
                            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-brand-paper flex items-center justify-center text-lg">🎓</div>
                              <div className="text-left">
                                <p className="font-bold text-brand-blue mb-0.5">{u.firstName} {u.surname}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">{u.studentId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <p className="text-[9px] font-bold text-brand-gold uppercase tracking-widest leading-none">Enrolled Courses</p>
                                  <p className="text-xs font-bold text-brand-blue mt-1">21 Credits</p>
                               </div>
                               <ArrowRight size={18} className="text-slate-200 group-hover:text-brand-gold" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {drillDown.level === 'faculty' && (
                      <div className="divide-y divide-slate-50">
                        {userList.filter(u => u.role === 'professor' && u.college === drillDown.collegeId).map(u => (
                          <button 
                            key={u.uid}
                            onClick={() => setDrillDown(prev => ({ ...prev, level: 'detail', selectedUserId: u.uid }))}
                            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                          >
                             <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-brand-paper flex items-center justify-center text-lg">👨‍🏫</div>
                              <div className="text-left">
                                <p className="font-bold text-brand-blue mb-0.5">{u.firstName} {u.surname}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Faculty ID: {u.uid.slice(0, 8)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                  {u.department || 'General Faculty'}
                               </span>
                               <ArrowRight size={18} className="text-slate-200 group-hover:text-brand-gold" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {drillDown.level === 'detail' && (
                      <div className="space-y-12">
                         {/* User Bio Header */}
                         {userList.find(u => u.uid === drillDown.selectedUserId) && (
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-brand-paper p-10 rounded-[3rem] border border-slate-100">
                              <div className="flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-5xl shadow-sm border border-slate-50">
                                  {drillDown.subRole === 'student' ? '🎓' : '👨‍🏫'}
                                </div>
                                <div>
                                  <h3 className="text-3xl font-display font-bold text-brand-blue leading-none mb-2">
                                    {userList.find(u => u.uid === drillDown.selectedUserId)?.firstName} {userList.find(u => u.uid === drillDown.selectedUserId)?.surname}
                                  </h3>
                                  <p className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-bold text-brand-gold uppercase tracking-widest">
                                      {userList.find(u => u.uid === drillDown.selectedUserId)?.studentId || drillDown.selectedUserId?.slice(0, 10)}
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                      {COLLEGES.find(c => c.id === drillDown.collegeId)?.name}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-4">
                                 <button className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-brand-blue/20">Edit Dossier</button>
                                 <button className="bg-white border border-slate-200 text-brand-blue px-6 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Restrict</button>
                              </div>
                           </div>
                         )}

                         {drillDown.subRole === 'student' ? (
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              <div className="lg:col-span-2 space-y-8">
                                 <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-slate-50 font-display font-bold text-brand-blue text-xs uppercase tracking-widest flex items-center justify-between">
                                      Academic Subjects Taken
                                      <span className="text-brand-gold">3 Subjects</span>
                                    </div>
                                    <div className="divide-y divide-slate-50 p-6">
                                      {[
                                        { title: 'Computer Programming 1', code: 'CS 101', grade: '1.25', units: '3.0' },
                                        { title: 'Data Structures', code: 'CS 201', grade: '1.50', units: '3.0' },
                                        { title: 'Database Systems', code: 'CS 202', grade: '1.00', units: '3.0' }
                                      ].map(s => (
                                        <div key={s.code} className="py-4 flex items-center justify-between">
                                          <div>
                                            <p className="font-bold text-brand-blue text-sm">{s.title}</p>
                                            <p className="text-[10px] font-mono text-slate-300">{s.code}</p>
                                          </div>
                                          <div className="flex items-center gap-6">
                                            <div className="text-center">
                                              <p className="text-[9px] font-bold text-slate-300 uppercase mb-0.5">Grade</p>
                                              <p className="text-xs font-bold text-emerald-500">{s.grade}</p>
                                            </div>
                                            <div className="text-center">
                                              <p className="text-[9px] font-bold text-slate-300 uppercase mb-0.5">Units</p>
                                              <p className="text-xs font-bold text-brand-blue">{s.units}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-8">
                                 <div className="bg-brand-blue p-8 rounded-3xl text-white">
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Cumulative GPA</p>
                                    <div className="flex items-end gap-3">
                                       <span className="text-5xl font-display font-bold">
                                         {userList.find(u => u.uid === drillDown.selectedUserId)?.gpa || '1.00'}
                                       </span>
                                       <span className="text-xs font-bold text-white/40 mb-1.5">Top 5%</span>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                                       <div>
                                          <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Earned Units</p>
                                          <p className="text-sm font-bold">
                                            {userList.find(u => u.uid === drillDown.selectedUserId)?.credits || '0'} / 165
                                          </p>
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Section</p>
                                          <p className="text-sm font-bold">{userList.find(u => u.uid === drillDown.selectedUserId)?.section || 'N/A'}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">
                                 <h4 className="font-display font-bold text-brand-blue text-xs uppercase tracking-widest mb-4">Handling Sections</h4>
                                 {(userList.find(u => u.uid === drillDown.selectedUserId)?.handlingSections || ['General Load']).map(sec => (
                                    <div key={sec} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                       <span className="font-bold text-brand-blue">{sec}</span>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Link</span>
                                    </div>
                                 ))}
                              </div>
                              <div className="bg-white rounded-3xl border border-slate-100 p-8">
                                 <h4 className="font-display font-bold text-brand-blue text-xs uppercase tracking-widest mb-4">Department Info</h4>
                                 <div className="space-y-4">
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">Department</p>
                                       <p className="font-bold text-brand-blue">
                                         {userList.find(u => u.uid === drillDown.selectedUserId)?.department || 'Instructional Office'}
                                       </p>
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">Office</p>
                                       <p className="font-bold text-brand-blue">Academic Bldg, Rm 204</p>
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">Teaching Status</p>
                                       <p className="font-bold text-emerald-500">Regular Faculty</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-default shadow-sm">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Verified Students</p>
                        <p className="text-3xl font-display font-bold text-brand-blue">{userList.filter(u => u.role === 'student').length}</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap size={24} />
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-default shadow-sm">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Faculty Access</p>
                        <p className="text-3xl font-display font-bold text-brand-blue">{userList.filter(u => u.role === 'professor').length}</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={24} />
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
