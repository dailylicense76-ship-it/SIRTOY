import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import dashboard3DIcon from '../assets/images/dashboard_3d_icon_1791390001310.jpg';
import borrowers3DIcon from '../assets/images/borrowers_3d_icon_1791390015615.jpg';
import loans3DIcon from '../assets/images/loans_3d_icon_1791390029321.jpg';
import collections3DIcon from '../assets/images/collections_3d_icon_1791390046309.jpg';
import reconciliation3DIcon from '../assets/images/reconciliation_3d_icon_1791390064307.jpg';
import reports3DIcon from '../assets/images/reports_3d_icon_1791390085222.jpg';
import mascot3DLogo from '../assets/images/3d_mascot_logo_1791389838102.jpg';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Receipt,
  Building2,
  ReceiptText,
  UserCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  FileBarChart,
  ShieldCheck,
  Settings,
  ClipboardList,
  CheckCircle2,
  Layers,
  LogOut,
  ChevronRight,
  Menu,
  MessageCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { user, db, activePage, go, logout, isMobileSidebarOpen, toggleMobileSidebar } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Listen to mouse position for left edge proximity trigger (auto-hide sidebar)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 25) {
        setIsHovered(true);
      } else if (e.clientX > 255 && !isPinned && !isMobileSidebarOpen) {
        setIsHovered(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPinned, isMobileSidebarOpen]);

  if (!user) return null;

  // Pending counts for live notification badges
  const pendingLoansCount = db.loans.filter(l => l.approvalStatus === 'Pending').length;
  const pendingExpensesCount = db.expenses.filter(x => x.approvalStatus === 'Pending').length;
  const totalPendingApprovals = pendingLoansCount + pendingExpensesCount;

  // 3D Mascot / Rendered Icon Helper Component
  const render3DIcon = (imagePath: string, fallbackLucide: React.ReactNode, isActive: boolean) => {
    return (
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden flex-none shadow-sm border transition-transform ${
        isActive ? 'border-amber-400 ring-2 ring-amber-500/30 scale-105' : 'border-slate-700/60 opacity-90 group-hover:scale-105 group-hover:opacity-100'
      }`}>
        <img src={imagePath} alt="3D Icon" className="w-full h-full object-cover" />
      </div>
    );
  };

  // Categorized Navigation Architecture with 3D Mascot Icons
  const getNavCategories = (role: string): NavCategory[] => {
    const isStaff = role === 'Staff';
    const isDeveloper = role === 'Developer';

    const categories: NavCategory[] = [];

    if (isDeveloper) {
      categories.push({
        title: '👑 Developer Portal',
        items: [
          {
            id: 'developer',
            label: 'Developer Master Control',
            icon: <Sparkles className="w-4 h-4 text-amber-400 font-black" />
          }
        ]
      });
      return categories; // Hide all other business logic categories for the Developer role
    }

    categories.push({
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: render3DIcon(dashboard3DIcon, <LayoutDashboard className="w-4 h-4" />, activePage === 'dashboard')
        }
      ]
    });

    categories.push({
      title: 'Pautang & Kliyente',
      items: [
        {
          id: 'borrowers',
          label: 'Borrowers Directory',
          icon: render3DIcon(borrowers3DIcon, <Users className="w-4 h-4" />, activePage === 'borrowers')
        },
        {
          id: 'loans',
          label: 'Loans Management',
          icon: render3DIcon(loans3DIcon, <Banknote className="w-4 h-4" />, activePage === 'loans')
        },
        ...(!isStaff ? [
          { id: 'restructure', label: 'Loan Restructuring', icon: <RefreshCw className="w-4 h-4 text-sky-400" /> },
          {
            id: 'approvals',
            label: 'Approvals & Requests',
            icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
            badge: totalPendingApprovals > 0 ? totalPendingApprovals : undefined
          }
        ] : [])
      ]
    });

    categories.push({
      title: 'Koleksyon & Field Work',
      items: [
        {
          id: 'collections',
          label: 'Collections History',
          icon: render3DIcon(collections3DIcon, <Receipt className="w-4 h-4" />, activePage === 'collections')
        },
        { id: 'bulkPayment', label: 'Bulk Daily Encoder', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
        { id: 'collectorPerformance', label: 'Collector Performance', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> }
      ]
    });

    categories.push({
      title: 'Pananalapi & Vault',
      items: [
        {
          id: 'reconciliation',
          label: 'Daily Turn-Over & Audit',
          icon: render3DIcon(reconciliation3DIcon, <ShieldCheck className="w-4 h-4" />, activePage === 'reconciliation')
        },
        { id: 'expenses', label: 'Expenses Tracker', icon: <ReceiptText className="w-4 h-4 text-rose-400" /> },
        { id: 'capital', label: 'Capital Management', icon: <Building2 className="w-4 h-4 text-blue-400" /> }
      ]
    });

    categories.push({
      title: 'Pamamahala & Ulat',
      items: [
        ...(!isStaff ? [
          { id: 'collectors', label: 'Collectors Directory', icon: <UserCheck className="w-4 h-4 text-purple-400" /> },
          { id: 'areas', label: 'Areas & Routes', icon: <MapPin className="w-4 h-4 text-emerald-400" /> }
        ] : []),
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: render3DIcon(reports3DIcon, <FileBarChart className="w-4 h-4" />, activePage === 'reports')
        }
      ]
    });

    if (!isStaff) {
      categories.push({
        title: 'Sistema & Seguridad',
        items: [
          { id: 'users', label: 'Users & Roles', icon: <Users className="w-4 h-4 text-cyan-400" /> },
          { id: 'settings', label: 'Settings & Rules', icon: <Settings className="w-4 h-4 text-slate-400" /> },
          { id: 'audit', label: 'Audit Trail Logs', icon: <ClipboardList className="w-4 h-4 text-amber-400" /> }
        ]
      });
    }

    return categories;
  };

  const navCategories = getNavCategories(user.role);
  const showSidebar = isHovered || isPinned || isMobileSidebarOpen;

  return (
    <>
      {/* Mobile / Small-screen backdrop overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => toggleMobileSidebar(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left edge proximity hover trigger strip */}
      {!showSidebar && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          className="fixed left-0 top-0 w-4 h-screen z-40 bg-gradient-to-r from-sky-500/20 to-transparent cursor-pointer flex items-center justify-center group"
          title="Ilapit ang cursor sa gilid para lumabas ang sidebar"
        >
          <div className="w-1.5 h-12 rounded-full bg-sky-500/60 shadow-lg group-hover:bg-sky-400 group-hover:scale-y-125 transition-all"></div>
        </div>
      )}

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isPinned) setIsHovered(false);
        }}
        style={{
          backgroundColor: '#090d16',
          backgroundImage: 'linear-gradient(180deg, #0b1120 0%, #080d1a 50%, #030712 100%)'
        }}
        className={`sidebar fixed top-0 bottom-0 left-0 z-50 w-[240px] p-3.5 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-800/80 overflow-hidden ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Watermark 3D Mascot Background Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 z-0">
          <img
            src={mascot3DLogo}
            alt="3D Mascot Background Watermark"
            className="w-full h-full object-cover object-center filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#0b1120]/80"></div>
        </div>

        {/* Top: Brand Header & Categorized Navigation */}
        <div className="flex flex-col min-h-0 flex-1 relative z-10">
          {/* Brand Header with 3D Mascot Logo & Pin Toggle */}
          <div className="brand flex items-center justify-between pb-3.5 mb-2 border-b border-slate-800/80 flex-none px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="logo w-9 h-9 rounded-xl flex items-center justify-center shadow-md border border-slate-700/60 overflow-hidden bg-white/95 flex-none">
                <img src={db.settings.logoUrl && !db.settings.logoUrl.startsWith('/src/assets/') ? db.settings.logoUrl : mascot3DLogo} alt="3D Mascot Logo" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <strong 
                  style={{
                    textShadow: '1px 1px 0px #b45309, 2px 2px 0px #78350f, 3px 3px 0px #451a03'
                  }}
                  className="text-amber-400 text-[12px] font-extrabold block leading-tight tracking-wide truncate uppercase"
                >
                  {db.settings.company || 'SIRTOY LENDING'}
                </strong>
                <span className="text-slate-400 text-[9.5px] font-medium block tracking-wide">
                  Lending System
                </span>
              </div>
            </div>

            {/* Pin / Unpin button */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin Sidebar (Auto-Hide)' : 'Pin Sidebar (Keep Open)'}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                isPinned 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-200'
              }`}
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Categorized Navigation Menu with Smooth Dark Scrollbar */}
          <nav className="nav flex-1 overflow-y-auto pr-1 space-y-3.5 custom-sidebar-scroll">
            {navCategories.map((category, catIdx) => (
              <div key={catIdx} className="space-y-1">
                {/* Category Header */}
                <div 
                  style={{
                    textShadow: '1px 1px 0px #78350f, 2px 2px 0px #451a03'
                  }}
                  className="px-2.5 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400"
                >
                  {category.title}
                </div>

                {/* Category Items */}
                <div className="space-y-0.5">
                  {category.items.map(item => {
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          go(item.id);
                          if (isMobileSidebarOpen) toggleMobileSidebar(false);
                        }}
                        className={`group mx-1 flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-200 font-bold border border-amber-500/30 shadow-md scale-105'
                            : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800/60 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex-none">
                            {item.icon}
                          </span>
                          <span 
                            style={isActive ? { textShadow: '1px 1px 0px #78350f, 2px 2px 0px #451a03' } : {}}
                            className={`truncate leading-tight text-[11.5px] ${isActive ? 'text-amber-300 font-extrabold' : ''}`}
                          >
                            {item.label}
                          </span>
                        </div>

                        {/* Notification Badge or Active Indicator */}
                        {item.badge !== undefined && item.badge > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black font-mono">
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-none opacity-90" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom: User Card & Clean Logout Button */}
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex-none space-y-2 relative z-10">
          {/* User Profile Card */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-black flex items-center justify-center text-xs flex-none shadow-inner">
              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block text-slate-200 text-xs font-black truncate leading-tight">{user.name}</b>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none"></span>
                <span className="text-[10px] text-slate-400 font-semibold truncate capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Developer Contact Link */}
          <a
            href="https://www.facebook.com/profile.php?id=61595073996579"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20 border border-blue-400/40 transition-all group"
            title="Contact System Developer on Facebook"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-3.5 h-3.5 fill-current text-white flex-none" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="truncate">Contact Developer (FB)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-100 group-hover:text-white flex-none" />
          </a>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
