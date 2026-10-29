import React, { useState, useRef, useEffect } from 'react';
import { LinuxTerminal } from '../features/terminal/LinuxTerminal.jsx';
import Navbar from '../components/Navbar.jsx';
import { THEME, MONO } from '../theme/designTokens.js';
import { learningApi } from '../services/learningApi.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  Terminal as TerminalIcon,
  BookOpen,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  ExternalLink,
  Code2,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function LinuxLabPage({ onNavigate }) {
  const { user } = useAuth();
  const terminalRef = useRef(null);
  const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('instructions'); // instructions | verification | progress
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [exerciseFeedback, setExerciseFeedback] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch published plans on mount
  useEffect(() => {
    let mounted = true;
    learningApi.getPlans().then((data) => {
      if (mounted) {
        setPlans(data || []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Quick test helper commands to run inside the terminal
  const runQuickCommand = (cmd) => {
    if (terminalRef.current) {
      if (terminalRef.current.status === 'idle') {
        terminalRef.current.start();
        setTimeout(() => {
          terminalRef.current?.sendInput(cmd + '\n');
        }, 3500);
      } else {
        terminalRef.current.sendInput(cmd + '\n');
      }
    }
  };

  return (
    <div
      className="min-h-screen text-[#F0F4F8]"
      style={{ backgroundColor: THEME.bg, fontFamily: MONO }}
    >
      {!isTerminalFullscreen && <Navbar currentRoute="/lab" onNavigate={onNavigate} />}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#30363D] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E05A38]/15 text-[#E05A38] border border-[#E05A38]/30">
                LIVE ENVIRONMENT
              </span>
              <span className="text-xs text-[#8B949E]">Client-side x86_32 WASM</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <TerminalIcon className="text-[#E05A38]" size={24} />
              Linux Lab
            </h1>
            <p className="text-xs text-[#8B949E] mt-0.5 max-w-2xl">
              A real Linux virtual machine running in your browser. Practice command-line skills,
              explore filesystems, and test utilities in a completely safe, isolated environment.
            </p>
          </div>

          {/* Quick test buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#8B949E] font-medium mr-1">Quick tests:</span>
            {[
              { label: 'neofetch', cmd: 'neofetch' },
              { label: 'pkg list', cmd: 'pkg list' },
              { label: 'cowsay', cmd: 'cowsay "DistroPedia Linux!"' },
              { label: 'tree /etc', cmd: 'tree /etc' },
              { label: 'calc 2^10', cmd: 'calc 2^10' },
              { label: 'uname -a', cmd: 'uname -a' },
            ].map(({ label, cmd }) => (
              <button
                key={label}
                type="button"
                onClick={() => runQuickCommand(cmd)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#161B22] border border-[#30363D] text-[#C9D1D9] hover:text-white hover:border-[#E05A38]/50 hover:bg-[#21262D] transition-all cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Split Layout: Left = Terminal, Right = Reserved Curriculum Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Terminal Viewport */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <LinuxTerminal
              ref={terminalRef}
              height="520px"
              onFullscreenChange={setIsTerminalFullscreen}
            />
          </div>

          {/* Right Column: Reserved Learning & Verification Areas */}
          <div className="lg:col-span-4 flex flex-col rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden shadow-xl min-h-[570px]">
            {/* Panel Tabs */}
            <div className="flex border-b border-[#30363D] bg-[#0D1117]/60 p-1">
              {[
                { id: 'instructions', label: 'Instructions', icon: BookOpen },
                { id: 'verification', label: 'Verification', icon: CheckCircle2 },
                { id: 'progress', label: 'Progress', icon: Award },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === id
                      ? 'bg-[#21262D] text-[#F0F4F8] shadow-sm border border-[#30363D]'
                      : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#161B22]'
                  }`}
                >
                  <Icon size={13} className={activeTab === id ? 'text-[#E05A38]' : ''} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              {/* Tab 1: Lesson Instructions Area */}
              {activeTab === 'instructions' && (
                <div className="flex flex-col h-full">
                  {selectedLesson ? (
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">{selectedLesson.title}</h3>
                      <div className="text-xs text-[#C9D1D9] leading-relaxed whitespace-pre-wrap">
                        {selectedLesson.content || selectedLesson.description}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center my-auto py-10 px-4">
                      <div className="w-12 h-12 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center mb-3 text-[#8B949E]">
                        <BookOpen size={22} className="text-[#E05A38]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#F0F4F8] mb-1">
                        No Active Lesson Selected
                      </h4>
                      <p className="text-xs text-[#8B949E] max-w-xs leading-relaxed mb-6">
                        When learning plans and lessons are published through Django Admin,
                        step-by-step instructions and practical tasks will appear here.
                      </p>
                      <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] w-full text-left">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#C9D1D9] mb-1.5">
                          <Code2 size={13} className="text-[#E05A38]" />
                          <span>Interactive Sandbox & Packages</span>
                        </div>
                        <p className="text-[11px] text-[#8B949E] leading-normal mb-2">
                          Available tools: <code className="text-[#7EE787]">neofetch</code>, <code className="text-[#7EE787]">tree</code>, <code className="text-[#7EE787]">calc</code>, <code className="text-[#7EE787]">cowsay</code>, <code className="text-[#7EE787]">nano</code>, <code className="text-[#7EE787]">curl</code>, and <code className="text-[#7EE787]">pkg list</code>.
                        </p>
                        <p className="text-[11px] text-[#8B949E] leading-normal">
                          Click <strong className="text-white">Save</strong> in the terminal toolbar to persist your files and memory state in your browser, or click <strong className="text-white">Full</strong> for fullscreen mode.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Exercise Verification Area */}
              {activeTab === 'verification' && (
                <div className="flex flex-col h-full">
                  {activeExercise ? (
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">{activeExercise.title}</h3>
                      <p className="text-xs text-[#8B949E] mb-4">{activeExercise.instructions}</p>
                      {/* Exercise submission actions */}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center my-auto py-10 px-4">
                      <div className="w-12 h-12 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center mb-3 text-[#8B949E]">
                        <CheckCircle2 size={22} className="text-[#7EE787]" />
                      </div>
                      <h4 className="text-sm font-bold text-[#F0F4F8] mb-1">
                        Verification Engine Ready
                      </h4>
                      <p className="text-xs text-[#8B949E] max-w-xs leading-relaxed mb-6">
                        The automated guest-verification protocol is standing by. When exercises are
                        assigned, your guest terminal state will be evaluated server-side.
                      </p>
                      <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] w-full text-left">
                        <div className="text-[11px] font-mono text-[#7EE787] flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7EE787]" />
                          <span>Server Verification Service: Online</span>
                        </div>
                        <p className="text-[11px] text-[#8B949E]">
                          Supports file existence, substring matching, exit codes, regex output
                          patterns, and attempt tracking.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Progress Summary Area */}
              {activeTab === 'progress' && (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-center justify-center text-center my-auto py-10 px-4">
                    <div className="w-12 h-12 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center mb-3 text-[#8B949E]">
                      <Award size={22} className="text-[#F2CC60]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#F0F4F8] mb-1">
                      Learning Progress
                    </h4>
                    <p className="text-xs text-[#8B949E] max-w-xs leading-relaxed mb-4">
                      Progress is calculated and saved directly to your account in Django SQLite.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate ? onNavigate('/dashboard') : (window.location.href = '/dashboard')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-[#E05A38] text-white hover:bg-[#c94929] transition-all shadow-md cursor-pointer"
                    >
                      <span>Open Learning Dashboard</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
