import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '../components/Navbar.jsx';
import { LinuxTerminal } from '../features/terminal/LinuxTerminal.jsx';
import { learningApi } from '../services/learningApi.js';
import { LEARNING_CURRICULUM } from '../features/learning/learningData.js';
import { THEME, MONO } from '../theme/designTokens.js';
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
  Sparkles,
  Terminal as TerminalIcon,
  HelpCircle,
  Lightbulb,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Flame,
  Shield,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function LearnLinuxPage({ onNavigate }) {
  const terminalRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [activePlanSlug, setActivePlanSlug] = useState('linux-basics');
  const [activeLessonId, setActiveLessonId] = useState(null); // null = Roadmap view
  const [activeLessonData, setActiveLessonData] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // Load plans and completed status
  useEffect(() => {
    let mounted = true;
    learningApi.getPlans().then((data) => {
      if (mounted) {
        setPlans(data || LEARNING_CURRICULUM.plans);
      }
    });

    try {
      const raw = localStorage.getItem('distropedia_completed_lessons');
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

  // Next unfinished lesson for "Resume Learning"
  const nextUnfinishedLesson = useMemo(() => {
    return allLessons.find((l) => !completedLessonIds.has(l.id)) || allLessons[0];
  }, [allLessons, completedLessonIds]);

  // Navigation handlers
  const handleSelectLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setVerificationFeedback(null);
    setShowHint(false);
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

  // Send command into the v86 terminal
  const handleRunCommand = (command) => {
    if (!terminalRef.current) return;
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

    try {
      // Collect evidence by testing condition inside guest VM or fallback
      const rules = exercise.verification_rules || [];
      const evidence = { files: {}, commands: {} };

      // Submit to backend
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

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F4F8] selection:bg-[#E05A38]/30">
      <Navbar currentRoute="/learn" onNavigate={onNavigate} />

      {/* Main Container with Navbar padding */}
      <main className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
                  <Sparkles size={13} />
                  <span>Interactive Learning Pathway • Guided Labs</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                  Learn Linux: The Complete Guide
                </h1>

                <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed mb-6">
                  Commands, concepts, and practical know-how for working confidently with Linux.
                  Progress through 30 hands-on rooms inspired by TryHackMe, complete real exercises in
                  your browser-based Linux virtual machine, and track your achievements.
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
                    <strong className="text-white">30</strong> Chapters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Clock size={16} className="text-[#F2CC60]" />
                  <span>
                    <strong className="text-white">~14 Hours</strong> Content
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
                    <strong className="text-white">TryHackMe</strong> Style
                  </span>
                </div>
              </div>
            </div>

            {/* Path Tabs (Part 1 vs Part 2) */}
            <div className="flex items-center gap-3 mb-8 border-b border-[#30363D] pb-3">
              <button
                type="button"
                onClick={() => setActivePlanSlug('linux-basics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activePlanSlug === 'linux-basics'
                    ? 'bg-[#E05A38] text-white shadow-md'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
                }`}
              >
                <Layers size={16} />
                <span>Part One: Linux Basics</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/25">9 Chapters</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlanSlug('linux-administration')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activePlanSlug === 'linux-administration'
                    ? 'bg-[#E05A38] text-white shadow-md'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
                }`}
              >
                <Flame size={16} />
                <span>Part Two: Going Further</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/25">21 Chapters</span>
              </button>
            </div>

            {/* Chapters Grid for Active Path */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLessons
                .filter((l) => l.planSlug === activePlanSlug)
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
          /* VIEW 2: TRYHACKME STYLE GUIDED ROOM WORKSPACE                */
          /* ============================================================ */
          <div>
            {/* Room Breadcrumb Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
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
                  onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] transition-all cursor-pointer"
                  title="Toggle terminal split"
                >
                  <TerminalIcon size={13} />
                  <span>{isTerminalCollapsed ? 'Show Terminal' : 'Hide Terminal'}</span>
                </button>
              </div>
            </div>

            {/* Split Screen Workspace: Left (Content & Exercises) | Right (Real Linux Terminal) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Lesson Content & Practical Tasks */}
              <div
                className={`transition-all duration-200 ${
                  isTerminalCollapsed ? 'lg:col-span-12' : 'lg:col-span-7'
                }`}
              >
                {/* Lesson Header Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-[#161B22] border border-[#30363D] mb-6 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E05A38] uppercase tracking-wider mb-2">
                    <BookOpen size={14} />
                    <span>TryHackMe Guided Room</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                    {activeLessonData?.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#8B949E] leading-relaxed mb-6">
                    {activeLessonData?.description}
                  </p>

                  {/* Markdown Content Area */}
                  <div className="prose prose-invert max-w-none text-[#C9D1D9] text-xs sm:text-sm leading-relaxed space-y-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-xl sm:text-2xl font-extrabold text-white border-b border-[#30363D] pb-2 mt-6 mb-4" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-lg sm:text-xl font-bold text-white border-b border-[#30363D]/60 pb-1.5 mt-5 mb-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-base sm:text-lg font-bold text-[#F0F4F8] mt-4 mb-2 text-[#E05A38]" {...props} />
                        ),
                        p: ({ node, ...props }) => <p className="leading-relaxed mb-3" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4 rounded-xl border border-[#30363D] bg-[#0D1117]/60">
                            <table className="w-full text-left text-xs border-collapse" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="p-2.5 bg-[#161B22] border-b border-[#30363D] font-bold text-white" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="p-2.5 border-b border-[#30363D]/50 text-[#C9D1D9]" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <div className="p-3 my-4 rounded-xl bg-[#58A6FF]/10 border-l-4 border-[#58A6FF] text-xs text-[#C9D1D9]">
                            {props.children}
                          </div>
                        ),
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');

                          if (inline) {
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded bg-[#21262D] text-[#FFA198] text-[12px] font-mono border border-[#30363D]"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-[#30363D] bg-[#0D1117]">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#161B22] border-b border-[#30363D]/60 text-[11px] text-[#8B949E]">
                                <span>{match ? match[1] : 'bash'}</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(codeString)}
                                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                    title="Copy code"
                                  >
                                    {copiedCode === codeString ? (
                                      <Check size={12} className="text-[#7EE787]" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                    <span>{copiedCode === codeString ? 'Copied' : 'Copy'}</span>
                                  </button>
                                  <span className="text-[#30363D]">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRunCommand(codeString)}
                                    className="flex items-center gap-1 text-[#E05A38] hover:text-[#FFA198] transition-colors cursor-pointer font-bold"
                                    title="Run this command inside the terminal"
                                  >
                                    <Play size={11} fill="currentColor" />
                                    <span>Run in Terminal</span>
                                  </button>
                                </div>
                              </div>
                              <pre className="p-3.5 text-xs text-[#C9D1D9] font-mono overflow-x-auto leading-relaxed">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {activeLessonData?.content || 'No content provided for this room.'}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Hands-On Practical Exercise Section (TryHackMe Task Card) */}
                {activeLessonData?.exercises && activeLessonData.exercises.length > 0 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#161B22] to-[#1C2128] border border-[#E05A38]/40 mb-6 shadow-xl">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-[#E05A38]" />
                        <h3 className="text-base font-bold text-white">
                          Practical Task: {activeLessonData.exercises[0].title}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E05A38]/20 text-[#E05A38] border border-[#E05A38]/30">
                        +{activeLessonData.exercises[0].points || 10} XP
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-[#C9D1D9] mb-4 whitespace-pre-wrap leading-relaxed">
                      {activeLessonData.exercises[0].instructions}
                    </div>

                    {/* Hint Disclosure */}
                    {activeLessonData.exercises[0].hint && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setShowHint(!showHint)}
                          className="flex items-center gap-1 text-xs text-[#F2CC60] hover:underline cursor-pointer"
                        >
                          <Lightbulb size={13} />
                          <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
                        </button>
                        {showHint && (
                          <div className="mt-2 p-3 rounded-lg bg-[#21262D] border border-[#F2CC60]/30 text-xs text-[#F0F4F8]">
                            {activeLessonData.exercises[0].hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verification Result Feedback */}
                    {verificationFeedback && (
                      <div
                        className={`p-3.5 mb-4 rounded-xl border flex items-start gap-2.5 text-xs ${
                          verificationFeedback.passed
                            ? 'bg-[#27C93F]/15 border-[#27C93F]/40 text-[#7EE787]'
                            : 'bg-[#F85149]/15 border-[#F85149]/40 text-[#FFA198]'
                        }`}
                      >
                        {verificationFeedback.passed ? (
                          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#7EE787]" />
                        ) : (
                          <HelpCircle size={16} className="shrink-0 mt-0.5 text-[#FFA198]" />
                        )}
                        <span className="leading-relaxed font-medium">
                          {verificationFeedback.message}
                        </span>
                      </div>
                    )}

                    {/* Verify Action Button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleVerifyExercise(activeLessonData.exercises[0])}
                        disabled={isVerifying}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{isVerifying ? 'Verifying...' : 'Verify Objective'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (terminalRef.current) terminalRef.current.clear();
                        }}
                        className="text-xs text-[#8B949E] hover:text-white transition-colors cursor-pointer px-2"
                      >
                        Clear Terminal
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Room Navigation Controls */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
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

              {/* Right Column: Integrated Real Linux Terminal */}
              {!isTerminalCollapsed && (
                <div className="lg:col-span-5 sticky top-24">
                  <div className="flex items-center justify-between px-3 py-2 rounded-t-xl bg-[#161B22] border border-[#30363D] border-b-0 text-xs">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <TerminalIcon size={14} className="text-[#E05A38]" />
                      <span>Live Practice Terminal</span>
                    </div>
                    <span className="text-[11px] text-[#8B949E]">Linux 5.6 x86 VM</span>
                  </div>

                  {/* Terminal Component */}
                  <LinuxTerminal
                    ref={terminalRef}
                    height="540px"
                    className="border-t-0 rounded-t-none"
                  />

                  {/* Quick-Run Palette for Active Chapter */}
                  <div className="mt-3 p-3.5 rounded-xl bg-[#161B22] border border-[#30363D] text-xs">
                    <div className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2">
                      Chapter Quick Actions
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeLessonId === 2 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('type cd')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            type cd
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('ls --help')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            ls --help
                          </button>
                        </>
                      )}
                      {activeLessonId === 4 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('pwd')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            pwd
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('ls -lah')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            ls -lah
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('cd /tmp && pwd')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            cd /tmp
                          </button>
                        </>
                      )}
                      {activeLessonId === 5 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('touch notes.txt && ls -l')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            touch notes.txt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('cat /etc/os-release')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            cat /etc/os-release
                          </button>
                        </>
                      )}
                      {activeLessonId === 9 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('mkdir -p ~/linux-practice/docs && cd ~/linux-practice && pwd')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            Step 2: mkdir practice
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunCommand('echo "Hello Linux" > docs/a.txt && cat docs/a.txt')}
                            className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] font-mono text-[11px] cursor-pointer"
                          >
                            Step 4: echo text
                          </button>
                        </>
                      )}
                      {/* Universal fallback buttons */}
                      <button
                        type="button"
                        onClick={() => handleRunCommand('uname -a')}
                        className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] font-mono text-[11px] cursor-pointer"
                      >
                        uname -a
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunCommand('free -h')}
                        className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] font-mono text-[11px] cursor-pointer"
                      >
                        free -h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunCommand('clear')}
                        className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] font-mono text-[11px] cursor-pointer"
                      >
                        clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

