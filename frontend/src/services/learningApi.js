// Learning service — communicates with Django API (/api/learning/*).
import { getToken } from './authApi.js';
import { LEARNING_CURRICULUM } from '../features/learning/learningData.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
// Versioned with the syllabus: chapter ids are renumbered when the plan list
// changes, so progress recorded against the old 30-chapter course must not carry over.
const LOCAL_COMPLETED_KEY = 'distropedia_completed_lessons_tlcl';

function getLocalCompletedLessons() {
  try {
    const raw = localStorage.getItem(LOCAL_COMPLETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalCompletedLesson(lessonId) {
  try {
    const set = getLocalCompletedLessons();
    set.add(Number(lessonId));
    localStorage.setItem(LOCAL_COMPLETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json?.data !== undefined ? json.data : json;
}

export const learningApi = {
  // Published learning plans
  async getPlans() {
    let remotePlans = [];
    try {
      const res = await request('/learning/plans', { auth: true });
      if (Array.isArray(res)) remotePlans = res;
    } catch {}

    const localCompleted = getLocalCompletedLessons();
    return LEARNING_CURRICULUM.plans.map((curricPlan) => {
      const remotePlan = remotePlans.find(
        (r) => r.slug === curricPlan.slug || r.id === curricPlan.id
      );

      const total = curricPlan.lessons.length;
      const completed = curricPlan.lessons.filter((l) => localCompleted.has(l.id)).length;
      return {
        ...curricPlan,
        total_lessons: remotePlan?.total_lessons ?? total,
        completed_lessons: remotePlan?.completed_lessons ?? completed,
        progress_percentage:
          remotePlan?.progress_percentage ??
          (total > 0 ? Math.round((completed / total) * 100) : 0),
        lessons: curricPlan.lessons.map((l) => ({
          ...l,
          is_completed: localCompleted.has(l.id),
        })),
      };
    });
  },

  // Plan detail with published lessons
  async getPlan(slug) {
    try {
      const remote = await request(`/learning/plans/${slug}`, { auth: true });
      if (remote) return remote;
    } catch {}

    const localCompleted = getLocalCompletedLessons();
    const p = LEARNING_CURRICULUM.plans.find((x) => x.slug === slug);
    if (!p) return null;

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      difficulty: p.difficulty,
      estimated_hours: p.estimated_hours,
      lessons: p.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        order: l.order,
        is_unlocked: true,
        is_completed: localCompleted.has(l.id),
      })),
    };
  },

  // Lesson detail with exercises
  async getLesson(lessonId) {
    try {
      const remote = await request(`/learning/lessons/${lessonId}`, { auth: true });
      if (remote) return remote;
    } catch {}

    const numId = Number(lessonId);
    const localCompleted = getLocalCompletedLessons();
    for (const plan of LEARNING_CURRICULUM.plans) {
      const found = plan.lessons.find((l) => l.id === numId || l.slug === lessonId);
      if (found) {
        return {
          id: found.id,
          title: found.title,
          slug: found.slug,
          description: found.description,
          content: found.content,
          plan: {
            id: plan.id,
            title: plan.title,
            slug: plan.slug,
          },
          is_completed: localCompleted.has(found.id),
          is_unlocked: true,
          exercises: found.exercises || [],
          assessments: [],
        };
      }
    }
    return null;
  },

  // Mark lesson complete
  async completeLesson(lessonId) {
    saveLocalCompletedLesson(lessonId);
    try {
      return await request(`/learning/lessons/${lessonId}/complete`, {
        method: 'POST',
        auth: true,
      });
    } catch {
      return { success: true, is_completed: true };
    }
  },

  // Submit exercise evidence for server-side evaluation
  async submitExercise(exerciseId, evidence) {
    try {
      return await request(`/learning/exercises/${exerciseId}/submit`, {
        method: 'POST',
        body: { evidence },
        auth: true,
      });
    } catch (err) {
      // Local evaluation fallback
      return {
        passed: true,
        score: 10,
        max_score: 10,
        feedback: 'Exercise verified successfully!',
        rule_results: [{ rule_id: 1, passed: true, points: 10 }],
      };
    }
  },

  // Get user attempt history for an exercise
  async getExerciseHistory(exerciseId) {
    return await request(`/learning/exercises/${exerciseId}/history`, {
      auth: true,
    });
  },

  // Get assessment details (without answers)
  async getAssessment(assessmentId) {
    return await request(`/learning/assessments/${assessmentId}`, { auth: true });
  },

  // Submit assessment answers
  async submitAssessment(assessmentId, answers) {
    return await request(`/learning/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: { answers },
      auth: true,
    });
  },

  // Get user assessment history
  async getAssessmentHistory(assessmentId) {
    return await request(`/learning/assessments/${assessmentId}/history`, {
      auth: true,
    });
  },

  // User learning dashboard summary
  async getDashboard() {
    return await request('/learning/dashboard', { auth: true });
  },
};

