import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Users,
  LayoutDashboard,
  FolderKanban,
  Shield,
  Play,
  TrendingUp,
  Activity,
  Sparkles,
  BarChart3,
  Check,
  X,
  Rocket,
  Menu,
  Search,
  Bell,
  Plus,
} from 'lucide-react';
import TaskFlowLogo from '../components/shared/TaskFlowLogo';

// ─── Animated Counter Component ──────────────────────────────────────────────
const Counter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end,
  suffix = '',
  duration = 1500,
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{count.toLocaleString()}{suffix}</>;
};

const Homepage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="min-h-screen text-white select-none overflow-x-hidden font-sans"
      style={{
        background: '#030B24',
      }}
    >
      {/* ─── STICKY GLASS NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8 ${
          scrolled || mobileMenuOpen
            ? 'bg-[#030B24]/80 backdrop-blur-md border-b border-[#286CFC]/15 shadow-[0_4px_30px_rgba(3,11,36,0.6)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <TaskFlowLogo variant="full" iconSize={32} textSize={20} />
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            {[
              { name: 'Home', href: '#' },
              { name: 'Features', href: '#features' },
              { name: 'How It Works', href: '#how-it-works' }
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold tracking-wide transition-all duration-200 text-[#A0AEC0] hover:text-white relative group"
              >
                {link.name}
                <span className="absolute left-0 right-0 bottom-[-4px] h-[2px] bg-gradient-to-r from-[#286CFC] to-[#4CB5D4] scale-x-0 group-hover:scale-x-100 transition-transform duration-250 origin-left" />
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-[#A0AEC0] hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold bg-[#286CFC] hover:bg-[#004ee6] text-white px-6 py-2.5 rounded-xl shadow-lg shadow-[#286CFC]/20 hover:shadow-[#286CFC]/35 transition-all duration-250 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-[#07153D] border border-[#286CFC]/20 text-[#4CB5D4] cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-6 pt-2 flex flex-col gap-4 border-t border-[#286CFC]/10 animate-fade-in">
            {[
              { name: 'Home', href: '#' },
              { name: 'Features', href: '#features' },
              { name: 'How It Works', href: '#how-it-works' }
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold py-2 text-[#A0AEC0] hover:text-[#FFFFFF] border-b border-[#07153D]"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center font-semibold text-[#A0AEC0] hover:text-[#FFFFFF] py-3 rounded-xl bg-[#07153D] border border-[#286CFC]/15"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center font-bold text-white py-3 rounded-xl bg-[#286CFC] hover:bg-[#004ee6] transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-4 md:px-8"
        style={{
          background: 'radial-gradient(circle at top, rgba(40, 108, 252, 0.1) 0%, transparent 65%)',
        }}
      >
        {/* Glow Spheres */}
        <div className="absolute top-1/4 right-0 w-[45%] h-[45%] rounded-full bg-radial from-[#286CFC]/10 to-transparent filter blur-[80px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-10 left-0 w-[40%] h-[40%] rounded-full bg-radial from-[#4CB5D4]/10 to-transparent filter blur-[80px] pointer-events-none" />

        {/* Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #286CFC 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#07153D] border border-[#286CFC]/20 text-xs font-semibold tracking-wider text-[#4CB5D4] mb-8 animate-fade-in">
            <Sparkles size={13} className="text-[#4CB5D4]" />
            Modern Project Management SaaS
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] font-display text-white max-w-4xl animate-fade-in-up">
            Manage Projects, Tasks & Teams
            <span className="block mt-2 bg-gradient-to-r from-[#286CFC] to-[#4CB5D4] bg-clip-text text-transparent">
              From One Powerful Workspace
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-[#A0AEC0] leading-relaxed max-w-2xl mt-6 animate-fade-in-up delay-100">
            Plan projects, assign tasks, collaborate with your team, track progress, and deliver work on time from a centralized workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-fade-in-up delay-200">
            <Link
              to="/register"
              className="bg-[#286CFC] hover:bg-[#004ee6] text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-[#286CFC]/20 hover:shadow-[#286CFC]/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-[#07153D] hover:bg-[#0b1c4f] border border-[#286CFC]/20 text-white font-bold text-base px-7 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Play size={16} className="text-[#4CB5D4] fill-[#4CB5D4]" />
              View Demo
            </a>
          </div>

          {/* ─── PREMIUM DASHBOARD PREVIEW ─── */}
          <div className="w-full max-w-5xl mt-16 relative animate-fade-in-up delay-300">
            {/* Ambient Background Glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#286CFC]/10 to-[#4CB5D4]/10 rounded-2xl filter blur-2xl -z-10" />

            {/* Window Container */}
            <div className="rounded-2xl border border-white/10 bg-[#07153D]/50 backdrop-blur-xl p-1 md:p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="rounded-xl bg-[#030B24]/90 overflow-hidden border border-white/5 flex flex-col md:flex-row h-[480px]">
                
                {/* Mock Sidebar */}
                <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-white/5 bg-[#030B24]/40 p-4 flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-6 shrink-0 overflow-x-auto md:overflow-x-visible">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#286CFC] to-[#4CB5D4] flex items-center justify-center font-bold text-xs text-white">TF</div>
                    <span className="font-bold text-sm text-white hidden md:inline">TaskFlow Pro</span>
                  </div>
                  
                  <nav className="flex flex-row md:flex-col gap-1.5 w-full">
                    {[
                      { name: 'Dashboard', icon: LayoutDashboard, active: true },
                      { name: 'Projects', icon: FolderKanban, active: false },
                      { name: 'Team Members', icon: Users, active: false },
                      { name: 'Progress Analytics', icon: TrendingUp, active: false },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          item.active 
                            ? 'bg-[#286CFC]/10 text-[#286CFC] border-l-2 border-[#286CFC]' 
                            : 'text-[#A0AEC0] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon size={14} className={item.active ? 'text-[#286CFC]' : 'text-[#A0AEC0]'} />
                        <span className="hidden md:inline">{item.name}</span>
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Main Mock Dashboard Workspace */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#030B24]/20 p-5 space-y-5">
                  {/* Top Bar inside dashboard */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#A0AEC0]">Workspace /</span>
                      <span className="text-xs font-bold text-white">Overview</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative hidden sm:block">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                        <input
                          type="text"
                          placeholder="Search workspace..."
                          className="bg-white/5 border border-white/5 rounded-md pl-7 pr-3 py-1 text-[11px] text-white focus:outline-none w-36"
                          disabled
                        />
                      </div>
                      <Bell size={13} className="text-[#A0AEC0]" />
                      <div className="w-5 h-5 rounded-full bg-[#286CFC] flex items-center justify-center text-[10px] font-bold text-white">
                        KC
                      </div>
                    </div>
                  </div>

                  {/* 4 KPIs grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Projects', val: '24', change: '+12% this month', color: '#286CFC', bg: 'rgba(40,108,252,0.1)' },
                      { label: 'Active Tasks', val: '120', change: '+8% vs last week', color: '#4CB5D4', bg: 'rgba(76,181,212,0.1)' },
                      { label: 'Completed Tasks', val: '84', change: '85% total rate', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                      { label: 'Team Members', val: '12', change: '4 teams connected', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#07153D]/60 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">{stat.label}</div>
                          <div className="text-2xl font-black mt-1 font-display" style={{ color: stat.color }}>{stat.val}</div>
                        </div>
                        <div className="text-[9px] text-[#A0AEC0] mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
                          {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 2 columns details section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Column 1: Progress Metrics */}
                    <div className="lg:col-span-7 bg-[#07153D]/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Progress Metrics</span>
                        <TrendingUp size={12} className="text-[#10B981]" />
                      </div>
                      
                      <div className="space-y-4 my-2">
                        {[
                          { name: 'Core Platform Redesign', progress: 85, color: '#286CFC' },
                          { name: 'Client Onboarding Flow', progress: 60, color: '#4CB5D4' },
                          { name: 'Security Firewall Auditing', progress: 100, color: '#10B981' },
                        ].map((item, index) => (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-white truncate">{item.name}</span>
                              <span className="text-[#A0AEC0]">{item.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Recent Activity / Team list */}
                    <div className="lg:col-span-5 bg-[#07153D]/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Team Workload</span>
                        <Users size={12} className="text-[#4CB5D4]" />
                      </div>

                      <div className="space-y-2.5 my-2">
                        {[
                          { name: 'Sarah J.', role: 'Product Lead', color: 'bg-[#286CFC]', initial: 'SJ' },
                          { name: 'Alex M.', role: 'Senior Backend', color: 'bg-[#4CB5D4]', initial: 'AM' },
                          { name: 'Rahul K.', role: 'UX Designer', color: 'bg-[#10B981]', initial: 'RK' },
                        ].map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className={`w-5.5 h-5.5 rounded-full ${member.color} text-white flex items-center justify-center font-bold text-[9px]`}>
                                {member.initial}
                              </div>
                              <span className="text-white truncate font-medium">{member.name}</span>
                            </div>
                            <span className="text-[#A0AEC0] text-[9px] uppercase tracking-wider font-semibold">{member.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="py-24 px-4 md:px-8 border-t border-white/5 bg-[#07153D]/20 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#07153D] border border-[#286CFC]/20 text-[10px] font-extrabold uppercase tracking-widest text-[#4CB5D4]">
              <Zap size={11} className="text-[#4CB5D4]" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight font-display text-white">
              Everything You Need To Manage Work Efficiently
            </h2>
            <p className="text-base text-[#A0AEC0] max-w-lg mx-auto">
              Access a unified, professional environment designed specifically to align your project pipelines.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FolderKanban,
                title: 'Project Management',
                desc: 'Plan, organize, and track your projects from kickoff to successful completion with status and priorities.',
                color: '#286CFC',
              },
              {
                icon: LayoutDashboard,
                title: 'Task Management',
                desc: 'Assign tasks, set due dates, prioritize workloads, and keep items moving seamlessly across visual lanes.',
                color: '#4CB5D4',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Communicate in real-time, invite teammates, chat in channels, and share assets within your workspace.',
                color: '#10B981',
              },
              {
                icon: Activity,
                title: 'Workspace Management',
                desc: 'Create and customize multiple secure workspaces for separate client organizations, cohorts, or departments.',
                color: '#F59E0B',
              },
              {
                icon: BarChart3,
                title: 'Progress Tracking',
                desc: 'Analyze project updates, evaluate velocity metrics, check completed tasks, and optimize workload distribution.',
                color: '#8B5CF6',
              },
              {
                icon: Shield,
                title: 'Role-Based Access Control',
                desc: 'Manage secure workspaces with distinct roles like Owner, Manager, and Member to enforce project security.',
                color: '#EF4444',
              },
            ].map((f, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-white/5 bg-[#07153D]/40 p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#286CFC]/20 hover:shadow-[0_8px_30px_rgba(40,108,252,0.08)]"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${f.color}15`,
                    border: `1px solid ${f.color}25`,
                  }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold font-display text-white mb-2.5 transition-colors group-hover:text-[#4CB5D4]">
                  {f.title}
                </h3>
                <p className="text-sm text-[#A0AEC0] leading-relaxed">{f.desc}</p>
                
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 24px ${f.color}05`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 border-t border-white/5 relative">
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#286CFC]/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07153D] border border-[#286CFC]/20 text-[10px] font-extrabold uppercase tracking-widest text-[#4CB5D4]">
              Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              Launch Your Workspace In Minutes
            </h2>
            <p className="text-sm text-[#A0AEC0]">
              Get onboarded instantly and streamline project cycles.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="relative">
            {/* Center connecting line (Desktop only) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#286CFC]/30 via-[#4CB5D4]/20 to-transparent -translate-x-1/2" />

            <div className="space-y-12 md:space-y-16">
              {[
                {
                  step: '01',
                  title: 'Create Workspace',
                  desc: 'Sign up and initialize your workspace workspace in seconds. Give it a name, write descriptive details, and prepare a secure base for operations.',
                  icon: Rocket,
                  color: '#286CFC',
                  leftAlign: true,
                },
                {
                  step: '02',
                  title: 'Create Projects',
                  desc: 'Split operations into structured project lines. Track progress metrics, set deadlines, and configure dashboard overview priorities.',
                  icon: FolderKanban,
                  color: '#4CB5D4',
                  leftAlign: false,
                },
                {
                  step: '03',
                  title: 'Assign Tasks',
                  desc: 'Create interactive task boards, assign responsibilities to teammates, customize labels, and track due dates dynamically.',
                  icon: Users,
                  color: '#10B981',
                  leftAlign: true,
                },
                {
                  step: '04',
                  title: 'Track Progress',
                  desc: 'Watch tasks move to completion, view activity logs, communicate in team chats, and complete milestones on time.',
                  icon: BarChart3,
                  color: '#F59E0B',
                  leftAlign: false,
                },
              ].map((step, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative">
                  
                  {/* Left Side Card */}
                  <div className={`md:col-span-5 ${step.leftAlign ? 'md:order-1 md:text-right' : 'md:order-3'}`}>
                    {step.leftAlign ? (
                      <div className="bg-[#07153D]/30 border border-white/5 rounded-2xl p-6 shadow-xl hover:border-[#286CFC]/20 transition-all duration-300">
                        <div className="text-sm font-extrabold uppercase tracking-wider mb-2" style={{ color: step.color }}>Step {step.step}</div>
                        <h3 className="text-xl font-bold font-display text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-[#A0AEC0] leading-relaxed">{step.desc}</p>
                      </div>
                    ) : (
                      <div className="hidden md:block" />
                    )}
                  </div>

                  {/* Icon Node (Desktop Center / Mobile Top) */}
                  <div className="md:col-span-2 flex justify-start md:justify-center items-center md:order-2 relative z-10">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg"
                      style={{
                        backgroundColor: '#030B24',
                        borderColor: step.color,
                        boxShadow: `0 0 20px ${step.color}30`,
                      }}
                    >
                      <step.icon size={18} style={{ color: step.color }} />
                    </div>
                  </div>

                  {/* Right Side Card */}
                  <div className={`md:col-span-5 ${step.leftAlign ? 'md:order-3' : 'md:order-1 md:text-left'}`}>
                    {!step.leftAlign ? (
                      <div className="bg-[#07153D]/30 border border-white/5 rounded-2xl p-6 shadow-xl hover:border-[#4CB5D4]/20 transition-all duration-300">
                        <div className="text-sm font-extrabold uppercase tracking-wider mb-2" style={{ color: step.color }}>Step {step.step}</div>
                        <h3 className="text-xl font-bold font-display text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-[#A0AEC0] leading-relaxed">{step.desc}</p>
                      </div>
                    ) : (
                      <div className="md:hidden">
                        {/* Mobile view duplicate of left aligned cards */}
                        <div className="bg-[#07153D]/30 border border-white/5 rounded-2xl p-6 shadow-xl hover:border-[#286CFC]/20 transition-all duration-300">
                          <div className="text-sm font-extrabold uppercase tracking-wider mb-2" style={{ color: step.color }}>Step {step.step}</div>
                          <h3 className="text-xl font-bold font-display text-white mb-2">{step.title}</h3>
                          <p className="text-sm text-[#A0AEC0] leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-4 md:px-8 border-t border-white/5 bg-[#07153D]/10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-radial from-[#286CFC]/5 to-transparent filter blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white">
            Ready to transform your workflow?
          </h2>
          <p className="text-base text-[#A0AEC0] max-w-xl mx-auto leading-relaxed">
            Join productive teams already using TaskFlow to coordinate tasks, assign responsibilities, and deliver milestones on schedule.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="bg-[#286CFC] hover:bg-[#004ee6] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-[#286CFC]/20 transition-all duration-200"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="bg-[#07153D] hover:bg-[#0b1c4f] border border-white/5 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── REDESIGNED FOOTER ─── */}
      <footer className="py-16 px-4 md:px-8 border-t border-white/5 bg-[#030B24] relative z-10 text-center sm:text-left">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 pb-12 border-b border-white/5">
            {/* Logo and brief */}
            <div className="space-y-4 max-w-sm text-center sm:text-left">
              <TaskFlowLogo variant="full" iconSize={26} textSize={16} />
              <p className="text-xs text-[#A0AEC0] leading-relaxed">
                Manage projects, tasks and team collaboration from a single workspace.
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center gap-8 sm:gap-12">
              {[
                { name: 'Home', href: '#' },
                { name: 'Features', href: '#features' },
                { name: 'How It Works', href: '#how-it-works' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold text-[#A0AEC0] hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-[#A0AEC0] font-medium">
            <span>© 2026 TaskFlow. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-glow" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

