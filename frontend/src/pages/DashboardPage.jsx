import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { THEME, MONO } from '../theme/designTokens.js';
import { learningApi } from '../services/learningApi.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ArrowRight,
  Loader2,
  LogIn,
  Layers,
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated && !authLoading) {
      setLoading(false);
      return;
    }

    if (isAuthenticated) {
      setLoading(true);
      learningApi
        .getDashboard()
        .then((data) => {
          if (mounted) {
            setDashboardData(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (mounted) {
            setError(err.message || 'Failed to load learning dashboard');
            setLoading(false);
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading]);

  return (
    <div
      className="min-h-screen text-[#F0F4F8]"
      style={{ backgroundColor: THEME.bg, fontFamily: MONO }}
    >
      <Navbar currentRoute="/dashboard" onNavigate={onNavigate} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12">
        {/* Header */}
        <div className="mb-8 border-b border-[#30363D] pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E05A38]/15 text-[#E05A38] border border-[#E05A38]/30">
              LEARNING OVERVIEW
            </span>
            <span className="text-xs text-[#8B949E]">Persisted in Django SQLite</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Award className="text-[#E05A38]" size={24} />
            Learning Dashboard
          </h1>
          <p className="text-xs text-[#8B949E] mt-1 max-w-xl">
            Track your progress through Linux distribution learning plans, practical exercises, and assessments.
          </p>
        </div>

        {/* Unauthenticated State */}
        {!authLoading && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[#30363D] bg-[#161B22] max-w-lg mx-auto shadow-xl">
            <div className="w-14 h-14 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center mb-4 text-[#8B949E]">
              <LogIn size={26} className="text-[#E05A38]" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Sign in to Track Your Learning</h3>
            <p className="text-xs text-[#8B949E] leading-relaxed mb-6">
              Create an account or sign in to save completed lessons, review terminal assessment scores, and track your distribution journey.
            </p>
            <a
              href="/login"
              className="px-6 py-2.5 text-xs font-bold rounded-full bg-[#E05A38] text-white hover:bg-[#c94929] transition-all shadow-md"
            >
              Sign In or Register
            </a>
          </div>
        )}

        {/* Loading State */}
        {(authLoading || (isAuthenticated && loading)) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 size={32} className="animate-spin text-[#E05A38] mb-3" />
            <p className="text-xs text-[#8B949E]">Loading your learning profile...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl border border-[#F85149]/40 bg-[#F85149]/10 text-xs text-[#FFA198] flex items-center gap-3 mb-6">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Authenticated Dashboard Content */}
        {!loading && isAuthenticated && dashboardData && (
          <div className="space-y-8">
            {/* Real Stats Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#30363D] bg-[#161B22]">
                <div className="text-[11px] text-[#8B949E] font-medium mb-1 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#58A6FF]" />
                  <span>Completed Lessons</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardData.completed_lessons}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#30363D] bg-[#161B22]">
                <div className="text-[11px] text-[#8B949E] font-medium mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#7EE787]" />
                  <span>Passed Exercises</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardData.passed_exercises}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#30363D] bg-[#161B22]">
                <div className="text-[11px] text-[#8B949E] font-medium mb-1 flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#E05A38]" />
                  <span>Exercise Attempts</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardData.total_exercise_attempts}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#30363D] bg-[#161B22]">
                <div className="text-[11px] text-[#8B949E] font-medium mb-1 flex items-center gap-1.5">
                  <Award size={13} className="text-[#F2CC60]" />
                  <span>Achievements</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardData.achievements?.length || 0}
                </div>
              </div>
            </div>

            {/* Empty State when no plans exist in the system */}
            {!dashboardData.has_plans && (
              <div className="p-10 rounded-2xl border border-[#30363D] bg-[#161B22] text-center max-w-xl mx-auto shadow-lg">
                <div className="w-14 h-14 rounded-full bg-[#21262D] border border-[#30363D] flex items-center justify-center mb-4 mx-auto text-[#8B949E]">
                  <Layers size={24} className="text-[#8B949E]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No learning plans available yet</h3>
                <p className="text-xs text-[#8B949E] leading-relaxed mb-6">
                  Curriculum plans and practical assessment exercises are being authored and will be
                  published soon. You can jump directly into the Linux Lab terminal in the meantime.
                </p>
                <a
                  href="/lab"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full bg-[#E05A38] text-white hover:bg-[#c94929] transition-all shadow-md"
                >
                  <Terminal size={14} />
                  <span>Open Linux Lab Terminal</span>
                </a>
              </div>
            )}

            {/* When published plans exist */}
            {dashboardData.has_plans && dashboardData.active_plans?.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-white mb-3">Enrolled Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.active_plans.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-xl border border-[#30363D] bg-[#161B22] flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{p.title}</h4>
                        <div className="text-xs text-[#8B949E] mb-3">
                          {p.completed_lessons} of {p.total_lessons} lessons completed ({p.percentage}%)
                        </div>
                        <div className="w-full bg-[#21262D] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#E05A38] h-full rounded-full transition-all duration-300"
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#30363D]/60 flex justify-end">
                        <a
                          href="/lab"
                          className="text-xs text-[#E05A38] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Continue</span>
                          <ArrowRight size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment History (only displayed when real records exist) */}
            {dashboardData.recent_assessments?.length > 0 && (
              <div className="rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#30363D] bg-[#0D1117]/60">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Assessment History
                  </h3>
                </div>
                <div className="divide-y divide-[#30363D]/60">
                  {dashboardData.recent_assessments.map((att) => (
                    <div
                      key={att.id}
                      className="px-5 py-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white mr-2">
                          {att.assessment_title}
                        </span>
                        <span className="text-[11px] text-[#8B949E]">
                          {new Date(att.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-bold">
                          {att.percentage}%
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            att.passed
                              ? 'bg-[#2EA043]/15 text-[#7EE787] border-[#2EA043]/30'
                              : 'bg-[#F85149]/15 text-[#FFA198] border-[#F85149]/30'
                          }`}
                        >
                          {att.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
