import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  BookOpen, 
  GraduationCap, 
  ClipboardList, 
  Settings, 
  LogOut,
  ChevronRight,
  Home,
  Bell,
  Search,
  BookMarked,
  ArrowLeft
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean, key?: string }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
      active 
        ? "bg-brand-paper text-brand-blue shadow-sm" 
        : "text-white/60 hover:text-white hover:bg-white/5"
    )}
  >
    <div className={cn(
      "transition-transform duration-300",
      active ? "scale-110" : "group-hover:translate-x-0.5"
    )}>
      <Icon size={18} />
    </div>
    <span className="tracking-wide">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-nav"
        className="ml-auto w-1 h-4 rounded-full bg-brand-gold" 
      />
    )}
  </Link>
);

export default function Shell() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { 
      to: profile?.role === 'registrar' ? '/admin' : profile?.role === 'professor' ? '/professor' : '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      roles: ['student', 'professor', 'registrar'] 
    },
    { to: '/enrollment', icon: BookMarked, label: 'Enrollment', roles: ['student'] },
    { to: '/professor/management', icon: GraduationCap, label: 'Instructional Management', roles: ['professor'] },
    { to: '/grades', icon: GraduationCap, label: 'Academic Records', roles: ['registrar'] },
    { to: '/profile', icon: User, label: 'My Profile', roles: ['student', 'professor', 'registrar'] },
  ];

  const filteredNav = navItems.filter(item => profile && item.roles.includes(profile.role));
  const initials = profile ? `${profile.firstName[0]}${profile.surname[0]}`.toUpperCase() : '??';

  return (
    <div className="flex h-screen bg-brand-paper font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-brand-blue flex flex-col relative z-20 shrink-0">
        {/* Sidebar Background Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
           <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-gold rounded-full blur-[80px]" />
           <div className="absolute top-1/2 -right-32 w-64 h-64 bg-brand-gold rounded-full blur-[80px]" />
        </div>

        <div className="p-8 relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center shadow-lg shadow-brand-gold/20">
              <GraduationCap size={20} className="text-brand-blue" />
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-xl tracking-tight leading-none">CampusLink</h1>
              <p className="text-white/30 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">Innovation Unit</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] mb-4 ml-4">Main Menu</p>
            <nav className="space-y-1">
              {filteredNav.map((item) => (
                <SidebarItem 
                  key={item.to} 
                  to={item.to} 
                  icon={item.icon} 
                  label={item.label} 
                  active={location.pathname === item.to} 
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-1">
             <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] mb-4 ml-4">System</p>
             <Link
              to="/settings"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all mt-4"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 relative z-10">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full max-w-md">
            <Search size={16} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Search academic resources..." 
              className="bg-transparent border-none outline-none text-sm w-full text-brand-ink placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-brand-blue transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-gold rounded-full border-2 border-white" />
            </button>

            <div className="h-8 w-[1px] bg-slate-100 ml-2" />

            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-brand-ink leading-none">{profile?.firstName} {profile?.surname}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 capitalize">
                  {profile?.role === 'registrar' ? 'Admin' : profile?.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center font-bold text-brand-gold border border-brand-gold/20 transition-transform group-hover:scale-105">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Global Alert / Status Bar */}
        <div className="bg-brand-blue/5 py-3 px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
             <p className="text-[10px] text-brand-blue font-bold uppercase tracking-widest">
               Enrollment Status: <span className="text-brand-gold">Active for Academic Year 2026</span>
             </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Server Time: 05:45:29Z</p>
        </div>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
