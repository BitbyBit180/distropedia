import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '../components/Navbar.jsx';
import { LinuxTerminal } from '../features/terminal/LinuxTerminal.jsx';
import {
  buildProbeScript,
  parseProbeEvidence,
  PROBE_END,
} from '../features/terminal/guestProbe.js';
import { GUEST_UNAVAILABLE_COMMANDS } from '../features/terminal/guestPackages.js';
import { learningApi } from '../services/learningApi.js';
import { LEARNING_CURRICULUM } from '../features/learning/learningData.js';
import { THEME, SANS } from '../theme/designTokens.js';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Award,
  Clock,
  Terminal as TerminalIcon,
  Lightbulb,
  Check,
  Copy,
  Layers,
  Shield,
  X,
  Move,
} from 'lucide-react';

// Invisible hit areas on every edge and corner of the terminal popup.
// The bottom-right corner uses the visible grip instead.
const RESIZE_HANDLES = [
  { edges: 'n', cls: 'top-0 left-4 right-4 h-2 cursor-ns-resize' },
  { edges: 's', cls: 'bottom-0 left-4 right-4 h-2 cursor-ns-resize' },
  { edges: 'e', cls: 'right-0 top-4 bottom-4 w-2 cursor-ew-resize' },
  { edges: 'w', cls: 'left-0 top-4 bottom-4 w-2 cursor-ew-resize' },
  { edges: 'nw', cls: 'top-0 left-0 w-4 h-4 cursor-nwse-resize' },
  { edges: 'ne', cls: 'top-0 right-0 w-4 h-4 cursor-nesw-resize' },
  { edges: 'sw', cls: 'bottom-0 left-0 w-4 h-4 cursor-nesw-resize' },
];

// Flatten a hast subtree back to plain text (used to rebuild fenced code blocks)
const hastText = (node) => {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  return (node.children || []).map(hastText).join('');
};

export default function LearnLinuxPage({ onNavigate }) {
  const terminalRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [activePlanSlug, setActivePlanSlug] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null); // null = Roadmap view
  const [activeLessonData, setActiveLessonData] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [verifiedIndex, setVerifiedIndex] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalMounted, setTerminalMounted] = useState(false);
  const pendingCommandRef = useRef(null);
  const [popPos, setPopPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [popSize, setPopSize] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef(null);
  const popupRef = useRef(null);

  const POP_W = 660;
  const POP_H = 640;
  const POP_MIN_W = 400;
  const POP_MIN_H = 300;

  const defaultPopPos = () => ({
    x: Math.max(8, window.innerWidth - POP_W - 16),
    y: 80,
  });

  const defaultPopSize = () => ({
    w: Math.min(POP_W, window.innerWidth - 16),
    h: Math.min(POP_H, window.innerHeight - 96),
  });

  // Load plans and completed status
  useEffect(() => {
    let mounted = true;
    learningApi.getPlans().then((data) => {
      if (mounted) {
        setPlans(data || LEARNING_CURRICULUM.plans);
      }
    });

    try {
      const raw = localStorage.getItem('distropedia_completed_lessons_tlcl');
      if (raw) {
        setCompletedLessonIds(new Set(JSON.parse(raw)));
      }
    } catch {}

    return () => {
      mounted = false;
    };
  }, []);

  // When activeLessonId changes, load lesson detail
  useEffect(() => {
    if (!activeLessonId) {
      setActiveLessonData(null);
      setVerificationFeedback(null);
      setShowHint(false);
      setVerifiedIndex(null);
      return;
    }

    let mounted = true;
    learningApi.getLesson(activeLessonId).then((data) => {
      if (mounted && data) {
        setActiveLessonData(data);
        if (data.is_completed) {
          setCompletedLessonIds((prev) => new Set([...prev, data.id]));
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [activeLessonId]);

  // Compute all lessons flat list for roadmap and next/prev navigation
  const allLessons = useMemo(() => {
    const list = [];
    const sourcePlans = plans.length > 0 ? plans : LEARNING_CURRICULUM.plans;
    for (const plan of sourcePlans) {
      const planLessons = plan.lessons || [];
      for (const lesson of planLessons) {
        list.push({
          ...lesson,
          planTitle: plan.title,
          planSlug: plan.slug,
        });
      }
    }
    return list;
  }, [plans]);

  // Progress metrics
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const sourcePlans = plans.length > 0 ? plans : LEARNING_CURRICULUM.plans;
  const visiblePlans = [...sourcePlans].sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentPlanSlug =
    activePlanSlug && visiblePlans.some((plan) => plan.slug === activePlanSlug)
      ? activePlanSlug
      : visiblePlans[0]?.slug ?? null;
  const totalHours = visiblePlans.reduce((sum, plan) => sum + (plan.estimated_hours || 0), 0);
  const totalExercises = allLessons.reduce((sum, lesson) => sum + (lesson.exercises || []).length, 0);

  // Next unfinished lesson for "Resume Learning"
  const nextUnfinishedLesson = useMemo(() => {
    return allLessons.find((l) => !completedLessonIds.has(l.id)) || allLessons[0];
  }, [allLessons, completedLessonIds]);

  // Navigation handlers
  const handleSelectLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setVerificationFeedback(null);
    setShowHint(false);
    setVerifiedIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToRoadmap = () => {
    setActiveLessonId(null);
    setActiveLessonData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkCompleted = async () => {
    if (!activeLessonId) return;
    try {
      await learningApi.completeLesson(activeLessonId);
      setCompletedLessonIds((prev) => new Set([...prev, activeLessonId]));
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  // Find next and previous lesson in order
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const openTerminal = (command = null) => {
    if (command) pendingCommandRef.current = command;
    setPopPos((prev) => prev ?? defaultPopPos());
    setPopSize((prev) => prev ?? defaultPopSize());
    setTerminalMounted(true);
    setIsTerminalOpen(true);
  };

  // Drag the terminal popup by its top bar
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      setPopPos(() => ({
        x: Math.min(Math.max(8, e.clientX - dragOffsetRef.current.x), window.innerWidth - (popSize?.w ?? POP_W) - 8),
        y: Math.min(Math.max(8, e.clientY - dragOffsetRef.current.y), window.innerHeight - 120),
      }));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  const startDrag = (e) => {
    if (e.target.closest('button')) return;
    const box = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - box.left, y: e.clientY - box.top };
    setIsDragging(true);
  };

  // Resize the terminal popup from any edge or corner
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e) => {
      const s = resizeStartRef.current;
      if (!s) return;

      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const { edges, left, top, w, h } = s;

      let nextLeft = left;
      let nextTop = top;
      let nextW = w;
      let nextH = h;

      if (edges.includes('e')) nextW = Math.min(Math.max(POP_MIN_W, w + dx), window.innerWidth - left - 8);
      if (edges.includes('s')) nextH = Math.min(Math.max(POP_MIN_H, h + dy), window.innerHeight - top - 8);
      if (edges.includes('w')) {
        nextLeft = Math.min(Math.max(8, left + dx), left + w - POP_MIN_W);
        nextW = left + w - nextLeft;
      }
      if (edges.includes('n')) {
        nextTop = Math.min(Math.max(8, top + dy), top + h - POP_MIN_H);
        nextH = top + h - nextTop;
      }

      setPopPos({ x: nextLeft, y: nextTop });
      setPopSize({ w: nextW, h: nextH });
    };
    const onUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isResizing]);

  const startResize = (e, edges) => {
    const box = popupRef.current?.getBoundingClientRect();
    if (!box) return;
    resizeStartRef.current = {
      edges,
      x: e.clientX,
      y: e.clientY,
      left: box.left,
      top: box.top,
      w: box.width,
      h: box.height,
    };
    e.preventDefault();
    setIsResizing(true);
  };

  // Flush a command queued before the terminal popup existed
  useEffect(() => {
    if (terminalMounted && pendingCommandRef.current) {
      const cmd = pendingCommandRef.current;
      pendingCommandRef.current = null;
      handleRunCommand(cmd);
    }
  }, [terminalMounted]);

  // Esc closes the terminal popup
  useEffect(() => {
    if (!isTerminalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsTerminalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTerminalOpen]);

  // Send command into the v86 terminal (opening the popup first if needed)
  const handleRunCommand = (command) => {
    if (!terminalRef.current) {
      openTerminal(command);
      return;
    }
    if (terminalRef.current.status === 'idle') {
      terminalRef.current.start();
      setTimeout(() => {
        terminalRef.current?.sendInput(command + '\n');
      }, 2200);
    } else {
      terminalRef.current.sendInput(command + '\n');
    }
  };

  // Copy snippet
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Practical exercise verification
  const handleVerifyExercise = async (exercise) => {
    if (!exercise) return;
    setIsVerifying(true);
    setVerificationFeedback(null);

    const rules = exercise.verification_rules || [];
    const term = terminalRef.current;

    if (!term || term.status !== 'ready') {
      setVerificationFeedback({
        passed: false,
        message:
          'Open the Linux terminal and let it finish booting first — verification re-runs this task\'s commands inside the guest.',
      });
      setIsVerifying(false);
      return;
    }

    try {
      const script = buildProbeScript(rules);
      if (!script) throw new Error('This task has no checkable conditions.');

      const raw = await term.runProbe(script, PROBE_END, 30000);
      const evidence = parseProbeEvidence(raw, rules);
      const res = await learningApi.submitExercise(exercise.id, evidence);

      setVerificationFeedback({
        passed: res.passed,
        message: res.feedback || (res.passed ? 'Objective verified successfully! Great job.' : 'Verification could not confirm the required conditions. Review instructions and try again.'),
      });

      if (res.passed) {
        setCompletedLessonIds((prev) => new Set([...prev, activeLessonId]));
        await learningApi.completeLesson(activeLessonId);
      }
    } catch (err) {
      setVerificationFeedback({
        passed: false,
        message: err.message || 'Verification failed. Make sure your command was executed in the terminal.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Command chips pulled from the lesson's own exercise data, so the strip
  // always reflects the chapter being read and is hidden when there are none
  const quickActions = useMemo(() => {
    const seen = new Set();
    const chips = [];

    // Only lines the guest can actually run. Chapter snippets are mixed with
    // script bodies (HTML output, case labels, function definitions) that
    // would type garbage into the terminal if offered as a chip.
    const isRunnable = (line) => {
      if (!line || line.startsWith('#')) return false;
      if (/<[a-zA-Z/][a-zA-Z0-9-]*>/.test(line)) return false;
      if (line.includes('()') || line.endsWith('{') || line.endsWith('(')) return false;
      if (/^(?:EOF|_EOF_|[)}\]]|;;|\d+\)|[*.?()\w-]+\))\s?/.test(line)) return false;
      if (/^(?:if|then|else|elif|fi|do|done|case|esac|while|until|for|in|local|return|export|set|trap|shift|wait)\b/.test(line)) return false;
      if (/^[A-Za-z_][A-Za-z0-9_]*(\[\d+\])?=[^=]/.test(line)) return false;
      const head = (line.match(/^[a-z0-9._/@-]+/) || [''])[0];
      if (!head) return false;
      if (GUEST_UNAVAILABLE_COMMANDS.has(head)) return false;
      if (head.startsWith('/') || head.startsWith('./')) return true;
      return !head.includes('.');
    };

    const add = (raw, label) => {
      const cmd = String(raw || '').trim();
      if (!cmd || seen.has(cmd)) return;
      seen.add(cmd);
      chips.push({ cmd, label: String(label || cmd) });
    };

    for (const exercise of activeLessonData?.exercises || []) {
      const fenced = String(exercise.instructions || '').match(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g) || [];
      if (fenced.length > 0) {
        for (const block of fenced) {
          const body = block.replace(/^```(?:bash|sh|shell)?\n/, '').replace(/```$/, '');
          body
            .split('\n')
            .map((line) => line.replace(/^\$\s*/, '').trim())
            .filter(isRunnable)
            .forEach((line) => add(line, line));
        }
      }
      for (const rule of exercise.verification_rules || []) {
        if (rule.rule_type === 'command_exit_zero' || rule.rule_type === 'output_matches') {
          if (isRunnable(rule.target)) add(rule.target, rule.target);
        }
      }
    }

    add('clear', 'clear');
    return chips.slice(0, 8);
  }, [activeLessonData]);

  // One markdown renderer shared by the chapter body and the task instructions.
  // The chapter's own `#` title is skipped because the header already shows it.
  const mdComponents = {
    h1: () => null,
    h2: ({ node, ...props }) => (
      <h2 className="text-lg sm:text-xl font-bold text-white mt-7 mb-2.5" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-base font-bold text-[#F0F4F8] mt-5 mb-2" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-sm font-bold text-[#F0F4F8] mt-4 mb-1.5" {...props} />
    ),
    p: ({ node, ...props }) => <p className="leading-relaxed mb-3" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-[#30363D]">
        <table className="w-full text-left text-[13px] border-collapse" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="px-2.5 py-1.5 bg-[#161B22] border-b border-[#30363D] font-bold text-white" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-2.5 py-1.5 border-b border-[#30363D]/50 align-top" {...props} />
    ),
    blockquote: ({ node, children, ...props }) => (
      <div
        className="my-4 rounded-r-lg border-l-2 border-[#E05A38] bg-[#161B22] px-4 py-2.5 text-sm leading-relaxed"
        {...props}
      >
        {children}
      </div>
    ),
    hr: () => null,
    a: ({ node, href, children, ...props }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-[#58A6FF] underline underline-offset-2">
        {children}
      </a>
    ),
    // react-markdown 10 dropped the `inline` flag, so `code` is only the inline
    // chip and fenced blocks are built by `pre` from the hast node.
    code: ({ node, className, children, ...props }) => (
      <code className="px-1 py-0.5 rounded bg-[#21262D] text-[#FFA198] text-[13px] font-mono" {...props}>
        {children}
      </code>
    ),
    pre: ({ node }) => {
      const codeNode = node?.children?.[0];
      const classes = (codeNode?.properties?.className || []).join(' ');
      const langMatch = /language-([\w-]+)/.exec(classes);
      const lang = langMatch ? langMatch[1] : '';
      const codeString = hastText(codeNode).replace(/\n$/, '');
      const runnable =
        codeString.length > 0 &&
        (['bash', 'sh', 'shell', 'console', 'zsh'].includes(lang) ||
          codeString.split('\n').every((line) => !line.trim() || line.trim().startsWith('$')));

      return (
        <div className="group relative my-3 rounded-lg border border-[#30363D] bg-[#0D1117]">
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => handleCopy(codeString)}
              className="p-1 rounded bg-[#21262D]/90 border border-[#30363D] text-[#8B949E] hover:text-white cursor-pointer"
              title={copiedCode === codeString ? 'Copied' : 'Copy code'}
              aria-label="Copy code"
            >
              {copiedCode === codeString ? <Check size={12} className="text-[#7EE787]" /> : <Copy size={12} />}
            </button>
            {runnable && (
              <button
                type="button"
                onClick={() => handleRunCommand(codeString.replace(/^\$\s*/gm, ''))}
                className="p-1 rounded bg-[#21262D]/90 border border-[#30363D] text-[#E05A38] hover:text-[#FFA198] cursor-pointer"
                title="Run this command in the terminal"
                aria-label="Run in terminal"
              >
                <Play size={11} fill="currentColor" />
              </button>
            )}
          </div>
          <pre className="p-3 text-[13px] text-[#C9D1D9] font-mono overflow-x-auto leading-relaxed whitespace-pre">
            <code>{codeString}</code>
          </pre>
        </div>
      );
    },
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F4F8] selection:bg-[#E05A38]/30">
      <Navbar currentRoute="/learn" onNavigate={onNavigate} />

      {/* Main Container with Navbar padding */}
      <main className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ fontFamily: SANS }}>
        {/* ============================================================ */}
        {/* VIEW 1: TRYHACKME STYLE ROADMAP & PATH OVERVIEW              */}
        {/* ============================================================ */}
        {!activeLessonId ? (
          <div>
            {/* Hero Banner */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#161B22] via-[#161B22] to-[#1F242C] border border-[#30363D] p-6 sm:p-10 mb-10 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#E05A38]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E05A38]/15 border border-[#E05A38]/30 text-[#E05A38] text-xs font-bold tracking-wider uppercase mb-4">
                  <BookOpen size={13} />
                  <span>The Linux Command Line • 2nd Edition</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                  Learn Linux: The Complete Guide
                </h1>

                <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed mb-6">
                  All 36 chapters of William Shotts' book, organised into its four parts. Read the
                  chapter, then run its commands in the browser-based Linux VM and verify each task.
                </p>

                {/* Overall Progress Bar & Resume Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectLesson(nextUnfinishedLesson?.id || 1)}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#E05A38] to-[#c94929] hover:from-[#c94929] hover:to-[#9c2f1a] text-white font-bold text-sm shadow-lg hover:shadow-orange-900/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>
                      {completedCount > 0
                        ? `Resume: ${nextUnfinishedLesson?.title || 'Next Chapter'}`
                        : 'Start Learning (Chapter 1)'}
                    </span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="flex-1 w-full sm:w-auto bg-[#0D1117]/80 rounded-xl p-3 border border-[#30363D]">
                    <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5 font-medium">
                      <span>Overall Pathway Progress</span>
                      <span className="font-bold text-white">
                        {completedCount} / {totalLessons} Chapters ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#21262D] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E05A38] to-[#27C93F] transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[#30363D]/60 text-xs">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <BookOpen size={16} className="text-[#58A6FF]" />
                  <span>
                    <strong className="text-white">{totalLessons}</strong> Chapters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Clock size={16} className="text-[#F2CC60]" />
                  <span>
                    <strong className="text-white">~{totalHours} Hours</strong> Content
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <TerminalIcon size={16} className="text-[#7EE787]" />
                  <span>
                    <strong className="text-white">Real x86</strong> VM Guest
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Shield size={16} className="text-[#BC8CFF]" />
                  <span>
                    <strong className="text-white">{totalExercises}</strong> Practical Tasks
                  </span>
                </div>
              </div>
            </div>

            {/* Part tabs, one per plan in the syllabus */}
            <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-[#30363D] pb-3">
              {visiblePlans.map((plan, planIdx) => (
                <button
                  key={plan.slug}
                  type="button"
                  onClick={() => setActivePlanSlug(plan.slug)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activePlanSlug === plan.slug || (!activePlanSlug && plan.slug === currentPlanSlug)
                      ? 'bg-[#E05A38] text-white'
                      : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
                  }`}
                >
                  <Layers size={16} />
                  <span>{plan.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/25">
                    {(plan.lessons || []).length} Chapters
                  </span>
                </button>
              ))}
            </div>

            {/* Chapters Grid for Active Path */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLessons
                .filter((l) => l.planSlug === currentPlanSlug)
                .map((lesson, idx) => {
                  const isDone = completedLessonIds.has(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson.id)}
                      className={`group relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isDone
                          ? 'bg-[#161B22]/90 border-[#27C93F]/40 hover:border-[#27C93F]'
                          : 'bg-[#161B22] border-[#30363D] hover:border-[#E05A38]/60 hover:shadow-lg hover:shadow-orange-950/20'
                      }`}
                    >
                      <div>
                        {/* Header badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold text-[#8B949E] tracking-wider uppercase">
                            Room #{lesson.id}
                          </span>
                          {isDone ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#7EE787] bg-[#27C93F]/15 px-2 py-0.5 rounded-full border border-[#27C93F]/30">
                              <CheckCircle2 size={12} />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-[#8B949E] bg-[#21262D] px-2 py-0.5 rounded-full">
                              <Circle size={10} />
                              <span>Start</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-white group-hover:text-[#E05A38] transition-colors mb-2">
                          {lesson.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-[#8B949E] leading-relaxed line-clamp-3 mb-4">
                          {lesson.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#30363D]/60 text-xs text-[#8B949E]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>~25 mins</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#E05A38] group-hover:translate-x-0.5 transition-transform">
                          <span>Enter Room</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: GUIDED ROOM — full-width reading + terminal popup     */
          /* ============================================================ */
          /* Full-width document: the terminal floats, so the reading
             column no longer shares the grid with it. */
          <div className="w-full">
            {/* Room Breadcrumb Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[#21262D]">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={handleBackToRoadmap}
                  className="flex items-center gap-1 text-[#8B949E] hover:text-white transition-colors cursor-pointer font-medium"
                >
                  <ArrowLeft size={14} />
                  <span>Roadmap</span>
                </button>
                <span className="text-[#484F58]">/</span>
                <span className="text-[#8B949E] hidden sm:inline">
                  {activeLessonData?.plan?.title || 'Learning Path'}
                </span>
                <span className="text-[#484F58] hidden sm:inline">/</span>
                <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activeLessonData?.title || 'Loading Chapter...'}
                </span>
              </div>

              {/* Status and Action controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    completedLessonIds.has(activeLessonId)
                      ? 'bg-[#27C93F]/20 text-[#7EE787] border border-[#27C93F]/40'
                      : 'bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D]'
                  }`}
                >
                  {completedLessonIds.has(activeLessonId) ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle size={13} />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openTerminal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E05A38] hover:bg-[#c94929] text-white transition-all cursor-pointer"
                  title="Open the Linux terminal"
                >
                  <TerminalIcon size={13} />
                  <span>Terminal</span>
                </button>
              </div>
            </div>

            {/* Single-column lesson document */}
            <div>
                {/* Lesson header: part label, title, one-line goal */}
                <div className="pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E05A38] mb-2">
                    <BookOpen size={13} />
                    <span className="truncate">{activeLessonData?.plan?.title || 'The Linux Command Line'}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                    {activeLessonData?.title}
                  </h2>

                  <p className="text-sm text-[#8B949E] leading-relaxed max-w-2xl">
                    {activeLessonData?.description}
                  </p>

                  {/* Chapter body */}
                  <div className="mt-6 text-[15px] leading-relaxed text-[#C9D1D9]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {activeLessonData?.content || 'No content provided for this chapter.'}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Practical tasks, straight from the lesson data */}
                {activeLessonData?.exercises && activeLessonData.exercises.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#30363D]">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Award size={16} className="text-[#E05A38]" />
                      <span>Practical Tasks</span>
                    </h3>

                    {activeLessonData.exercises.map((exercise, index) => (
                      <div key={exercise.id || index} className="mb-6 last:mb-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                          <span className="text-sm font-bold text-white">
                            {index + 1}. {exercise.title}
                          </span>
                          <span className="text-xs font-semibold text-[#E05A38]">+{exercise.points || 10} XP</span>
                        </div>

                        <div className="text-[15px] leading-relaxed text-[#C9D1D9]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {exercise.instructions || ''}
                          </ReactMarkdown>
                        </div>

                        {exercise.hint && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => setShowHint(!showHint)}
                              className="flex items-center gap-1 text-xs text-[#F2CC60] hover:underline cursor-pointer"
                            >
                              <Lightbulb size={13} />
                              <span>{showHint ? 'Hide hint' : 'Need a hint?'}</span>
                            </button>
                            {showHint && (
                              <p className="mt-1.5 text-xs text-[#F0F4F8] leading-relaxed">{exercise.hint}</p>
                            )}
                          </div>
                        )}

                        {verifiedIndex === index && verificationFeedback && (
                          <p
                            className={`mt-2.5 text-xs leading-relaxed rounded-r-lg border-l-2 px-3 py-2 ${
                              verificationFeedback.passed
                                ? 'bg-[#27C93F]/10 border-[#27C93F] text-[#7EE787]'
                                : 'bg-[#F85149]/10 border-[#F85149] text-[#FFA198]'
                            }`}
                          >
                            {verificationFeedback.message}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setVerifiedIndex(index);
                              handleVerifyExercise(exercise);
                            }}
                            disabled={isVerifying}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Check size={13} />
                            <span>{isVerifying && verifiedIndex === index ? 'Verifying…' : 'Verify task'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={openTerminal}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] transition-colors cursor-pointer"
                          >
                            <TerminalIcon size={12} />
                            <span>Open Terminal</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Room Navigation Controls */}
                <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-[#21262D]">
                  {prevLesson ? (
                    <button
                      type="button"
                      onClick={() => handleSelectLesson(prevLesson.id)}
                      className="flex items-center gap-2 text-xs font-bold text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span className="truncate max-w-[140px] sm:max-w-xs">{prevLesson.title}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextLesson ? (
                    <button
                      type="button"
                      onClick={() => handleSelectLesson(nextLesson.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E05A38] hover:bg-[#c94929] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <span className="truncate max-w-[140px] sm:max-w-xs">Next: {nextLesson.title}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBackToRoadmap}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#27C93F] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <CheckCircle2 size={14} />
                      <span>Finish Guide</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Floating terminal launcher */}
              {!isTerminalOpen && (
                <button
                  type="button"
                  onClick={openTerminal}
                  className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#E05A38] to-[#c94929] text-white text-xs font-bold shadow-xl shadow-orange-950/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <TerminalIcon size={15} />
                  <span>Open Terminal</span>
                </button>
              )}

          {/* ============================================================ */}
          {/* Terminal popup: slide-in drawer with the live x86 VM          */}
          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* Terminal popup: floating window; closes only via X or Esc     */}
          {/* ============================================================ */}
          {terminalMounted && (
            <div
              ref={popupRef}
              className={`fixed z-[120] transition-opacity duration-200 ${
                isTerminalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                left: popPos?.x ?? defaultPopPos().x,
                top: popPos?.y ?? 80,
                width: popSize?.w ?? defaultPopSize().w,
                height: popSize?.h ?? defaultPopSize().h,
              }}
            >
              <section
                className={`h-full flex flex-col rounded-2xl border bg-[#0D1117] overflow-hidden ${
                  isDragging || isResizing
                    ? 'border-[#E05A38]/60 shadow-2xl shadow-black/70'
                    : 'border-[#30363D] shadow-2xl shadow-black/60'
                }`}
              >
                {/* Single minimal title bar — drag anywhere on it */}
                <div
                  onPointerDown={startDrag}
                  className={`flex items-center justify-between gap-2 px-3 h-9 bg-[#161B22] border-b border-[#30363D] shrink-0 touch-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TerminalIcon size={13} className="text-[#E05A38] shrink-0" />
                    <span className="text-xs font-bold text-[#C9D1D9] truncate">Terminal</span>
                  </div>

                  <Move size={13} className="text-[#484F58] shrink-0" />

                  <button
                    type="button"
                    onClick={() => setIsTerminalOpen(false)}
                    className="p-1 rounded-md text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors cursor-pointer shrink-0"
                    title="Close terminal (Esc)"
                    aria-label="Close terminal"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-y-auto">
                  <LinuxTerminal ref={terminalRef} height="300px" className="flex-1" chrome="minimal" />

                  {quickActions.length > 1 && (
                    <div className="shrink-0">
                      <div className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">
                        Commands from this chapter
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {quickActions.map(({ label, cmd }) => (
                          <button
                            key={cmd}
                            type="button"
                            onClick={() => handleRunCommand(cmd)}
                            title={cmd}
                            className="max-w-[260px] truncate px-2.5 py-1 rounded-md bg-[#21262D] hover:bg-[#30363D] font-mono text-[11px] text-[#58A6FF] cursor-pointer transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Resize handles: every edge + the three plain corners */}
              {RESIZE_HANDLES.map(({ edges, cls }) => (
                <div
                  key={edges}
                  onPointerDown={(e) => startResize(e, edges)}
                  title="Drag to resize"
                  aria-label={`Resize terminal (${edges})`}
                  className={`absolute z-10 bg-transparent hover:bg-[#E05A38]/25 transition-colors touch-none select-none ${cls}`}
                />
              ))}

              {/* Bottom-right resize grip */}
              <div
                onPointerDown={(e) => startResize(e, 'se')}
                title="Drag to resize"
                aria-label="Resize terminal (se)"
                className="group absolute -bottom-px -right-px w-7 h-7 rounded-br-2xl bg-[#161B22] border-t border-l border-[#30363D] flex items-center justify-center touch-none select-none cursor-nwse-resize"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#484F58] group-hover:text-[#8B949E]">
                  <path d="M1 9 L9 1 M5 9 L9 5 M9 9 L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  );
}

