"""Learning, Exercise Verification, and Assessment API endpoints.

Handles published plans, lesson details, server-side grading of exercises
and assessments, attempt history, and learning progress dashboard.
"""

from datetime import datetime, timezone
from apps.core.errors import ApiError, endpoint
from apps.learning.models import (
    LearningPlan,
    Lesson,
    PracticalExercise,
    Assessment,
    AssessmentQuestion,
    UserLessonProgress,
    ExerciseAttempt,
    AssessmentAttempt,
    UserAchievement,
)
from apps.learning.services import (
    verify_exercise_submission,
    grade_assessment_submission,
)


@endpoint(methods=("GET",), auth=False)
def plans_list(request, body, user):
    """List published learning plans. If authenticated, includes progress count."""
    plans = LearningPlan.objects.filter(is_published=True).prefetch_related("lessons")
    user_completed_lesson_ids = set()
    if user:
        user_completed_lesson_ids = set(
            UserLessonProgress.objects.filter(
                user=user, is_completed=True
            ).values_list("lesson_id", flat=True)
        )

    data = []
    for plan in plans:
        lessons = [l for l in plan.lessons.all() if l.is_published]
        total_lessons = len(lessons)
        completed_lessons = sum(
            1 for l in lessons if l.id in user_completed_lesson_ids
        )
        progress_pct = (
            round((completed_lessons / total_lessons * 100), 1)
            if total_lessons > 0
            else 0.0
        )

        data.append(
            {
                "id": plan.id,
                "title": plan.title,
                "slug": plan.slug,
                "description": plan.description,
                "difficulty": plan.difficulty,
                "estimated_hours": plan.estimated_hours,
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "progress_percentage": progress_pct,
            }
        )

    return {"success": True, "data": data}


@endpoint(methods=("GET",), auth=False)
def plan_detail(request, body, user, slug):
    """Get published plan details and its published lessons."""
    try:
        plan = (
            LearningPlan.objects.filter(slug=slug, is_published=True)
            .prefetch_related("lessons", "lessons__prerequisites")
            .first()
        )
    except Exception:
        plan = None

    if not plan:
        raise ApiError("Learning plan not found", 404)

    user_completed_lesson_ids = set()
    if user:
        user_completed_lesson_ids = set(
            UserLessonProgress.objects.filter(
                user=user, is_completed=True
            ).values_list("lesson_id", flat=True)
        )

    lessons_data = []
    for l in plan.lessons.all():
        if not l.is_published:
            continue
        prereqs = list(l.prerequisites.all())
        prereq_ids = {p.id for p in prereqs}
        is_unlocked = prereq_ids.issubset(user_completed_lesson_ids) if prereq_ids else True
        is_completed = l.id in user_completed_lesson_ids

        lessons_data.append(
            {
                "id": l.id,
                "title": l.title,
                "slug": l.slug,
                "description": l.description,
                "order": l.order,
                "is_unlocked": is_unlocked,
                "is_completed": is_completed,
                "prerequisites": [{"id": p.id, "title": p.title} for p in prereqs],
            }
        )

    return {
        "success": True,
        "data": {
            "id": plan.id,
            "title": plan.title,
            "slug": plan.slug,
            "description": plan.description,
            "difficulty": plan.difficulty,
            "estimated_hours": plan.estimated_hours,
            "lessons": lessons_data,
        },
    }


@endpoint(methods=("GET",), auth=False)
def lesson_detail(request, body, user, lesson_id):
    """Get lesson detail, including exercise metadata and published assessments."""
    try:
        lesson = (
            Lesson.objects.filter(pk=lesson_id, is_published=True)
            .select_related("plan")
            .prefetch_related("exercises", "assessments", "prerequisites")
            .first()
        )
    except Exception:
        lesson = None

    if not lesson or not lesson.plan.is_published:
        raise ApiError("Lesson not found", 404)

    is_completed = False
    is_unlocked = True
    if user:
        progress = UserLessonProgress.objects.filter(
            user=user, lesson=lesson
        ).first()
        if progress:
            is_completed = progress.is_completed

        prereq_ids = set(lesson.prerequisites.values_list("id", flat=True))
        if prereq_ids:
            completed_prereqs = set(
                UserLessonProgress.objects.filter(
                    user=user, lesson_id__in=prereq_ids, is_completed=True
                ).values_list("lesson_id", flat=True)
            )
            is_unlocked = prereq_ids.issubset(completed_prereqs)

    exercises = [
        {
            "id": ex.id,
            "title": ex.title,
            "slug": ex.slug,
            "instructions": ex.instructions,
            "hint": ex.hint,
            "points": ex.points,
            "max_attempts": ex.max_attempts,
            "order": ex.order,
            "verification_script": ex.verification_script,
        }
        for ex in lesson.exercises.all()
        if ex.is_published
    ]

    assessments = [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "description": a.description,
            "passing_percentage": a.passing_percentage,
            "max_attempts": a.max_attempts,
            "time_limit_minutes": a.time_limit_minutes,
        }
        for a in lesson.assessments.all()
        if a.is_published
    ]

    return {
        "success": True,
        "data": {
            "id": lesson.id,
            "title": lesson.title,
            "slug": lesson.slug,
            "description": lesson.description,
            "content": lesson.content,
            "plan": {
                "id": lesson.plan.id,
                "title": lesson.plan.title,
                "slug": lesson.plan.slug,
            },
            "is_completed": is_completed,
            "is_unlocked": is_unlocked,
            "exercises": exercises,
            "assessments": assessments,
        },
    }


@endpoint(methods=("POST",), auth=True)
def complete_lesson(request, body, user, lesson_id):
    """Mark a lesson completed once verified or manually requested."""
    try:
        lesson = Lesson.objects.filter(pk=lesson_id, is_published=True).first()
    except Exception:
        lesson = None

    if not lesson:
        raise ApiError("Lesson not found", 404)

    progress, _ = UserLessonProgress.objects.get_or_create(user=user, lesson=lesson)
    progress.is_completed = True
    progress.completed_at = datetime.now(timezone.utc)
    progress.save()

    return {
        "success": True,
        "message": f"Lesson '{lesson.title}' marked as completed",
        "data": {"lesson_id": lesson.id, "is_completed": True},
    }


@endpoint(methods=("POST",), auth=True)
def submit_exercise(request, body, user, exercise_id):
    """Submit practical exercise evidence for server-side evaluation."""
    evidence = (body or {}).get("evidence") or {}
    result = verify_exercise_submission(user, exercise_id, evidence)
    return {"success": True, "data": result}


@endpoint(methods=("GET",), auth=True)
def exercise_history(request, body, user, exercise_id):
    """Retrieve user's attempt history for a practical exercise."""
    attempts = ExerciseAttempt.objects.filter(
        user=user, exercise_id=exercise_id
    ).order_by("-submitted_at")[:20]

    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "passed": a.passed,
                "score": a.score,
                "max_score": a.max_score,
                "feedback": a.feedback,
                "rule_results": a.rule_results,
                "submitted_at": a.submitted_at.isoformat(),
            }
            for a in attempts
        ],
    }


@endpoint(methods=("GET",), auth=False)
def assessment_detail(request, body, user, assessment_id):
    """Retrieve assessment and questions.

    CRITICAL: Never exposes correct_answers or internal answer keys to the client!
    """
    try:
        assessment = (
            Assessment.objects.filter(pk=assessment_id, is_published=True)
            .prefetch_related("questions")
            .first()
        )
    except Exception:
        assessment = None

    if not assessment:
        raise ApiError("Assessment not found", 404)

    questions_data = [
        {
            "id": q.id,
            "question_type": q.question_type,
            "prompt": q.prompt,
            "options": q.options,
            "points": q.points,
            "order": q.order,
        }
        for q in assessment.questions.all()
    ]

    best_score = None
    attempts_count = 0
    if user:
        user_attempts = AssessmentAttempt.objects.filter(
            user=user, assessment=assessment
        )
        attempts_count = user_attempts.count()
        best_att = user_attempts.order_by("-percentage").first()
        if best_att:
            best_score = {
                "percentage": best_att.percentage,
                "score": best_att.score,
                "max_score": best_att.max_score,
                "passed": best_att.passed,
            }

    return {
        "success": True,
        "data": {
            "id": assessment.id,
            "title": assessment.title,
            "slug": assessment.slug,
            "description": assessment.description,
            "passing_percentage": assessment.passing_percentage,
            "max_attempts": assessment.max_attempts,
            "time_limit_minutes": assessment.time_limit_minutes,
            "questions": questions_data,
            "user_stats": {
                "attempts_count": attempts_count,
                "attempts_left": (
                    max(0, assessment.max_attempts - attempts_count)
                    if assessment.max_attempts > 0
                    else None
                ),
                "best_score": best_score,
            },
        },
    }


@endpoint(methods=("POST",), auth=True)
def submit_assessment(request, body, user, assessment_id):
    """Submit answers to an assessment for server-side grading."""
    submitted_answers = (body or {}).get("answers") or {}
    result = grade_assessment_submission(user, assessment_id, submitted_answers)
    return {"success": True, "data": result}


@endpoint(methods=("GET",), auth=True)
def assessment_history(request, body, user, assessment_id):
    """Retrieve user's attempt history for an assessment."""
    attempts = AssessmentAttempt.objects.filter(
        user=user, assessment_id=assessment_id
    ).order_by("-submitted_at")[:20]

    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "score": a.score,
                "max_score": a.max_score,
                "percentage": a.percentage,
                "passed": a.passed,
                "feedback": a.feedback,
                "submitted_at": a.submitted_at.isoformat(),
            }
            for a in attempts
        ],
    }


@endpoint(methods=("GET",), auth=True)
def user_dashboard(request, body, user):
    """Learning overview for the authenticated user.

    Returns real persisted data from SQLite. Returns clean empty states
    when no plans or progress exist.
    """
    total_plans = LearningPlan.objects.filter(is_published=True).count()
    completed_lessons = UserLessonProgress.objects.filter(
        user=user, is_completed=True
    ).count()
    total_attempts = ExerciseAttempt.objects.filter(user=user).count()
    passed_attempts = ExerciseAttempt.objects.filter(user=user, passed=True).count()

    recent_assessments = list(
        AssessmentAttempt.objects.filter(user=user)
        .select_related("assessment")
        .order_by("-submitted_at")[:5]
    )

    recent_exercises = list(
        ExerciseAttempt.objects.filter(user=user)
        .select_related("exercise", "exercise__lesson")
        .order_by("-submitted_at")[:5]
    )

    achievements = list(
        UserAchievement.objects.filter(user=user).order_by("-earned_at")
    )

    # Active plans with progress
    active_plans = []
    if total_plans > 0:
        for plan in LearningPlan.objects.filter(is_published=True):
            lessons = list(plan.lessons.filter(is_published=True))
            if not lessons:
                continue
            total_l = len(lessons)
            done_l = UserLessonProgress.objects.filter(
                user=user, lesson__in=lessons, is_completed=True
            ).count()
            if done_l > 0:
                active_plans.append(
                    {
                        "id": plan.id,
                        "title": plan.title,
                        "slug": plan.slug,
                        "total_lessons": total_l,
                        "completed_lessons": done_l,
                        "percentage": round((done_l / total_l * 100), 1),
                    }
                )

    return {
        "success": True,
        "data": {
            "has_plans": total_plans > 0,
            "total_plans": total_plans,
            "completed_lessons": completed_lessons,
            "total_exercise_attempts": total_attempts,
            "passed_exercises": passed_attempts,
            "active_plans": active_plans,
            "recent_assessments": [
                {
                    "id": a.id,
                    "assessment_title": a.assessment.title,
                    "score": a.score,
                    "max_score": a.max_score,
                    "percentage": a.percentage,
                    "passed": a.passed,
                    "submitted_at": a.submitted_at.isoformat(),
                }
                for a in recent_assessments
            ],
            "recent_exercises": [
                {
                    "id": ex.id,
                    "exercise_title": ex.exercise.title,
                    "lesson_title": ex.exercise.lesson.title,
                    "passed": ex.passed,
                    "score": ex.score,
                    "max_score": ex.max_score,
                    "submitted_at": ex.submitted_at.isoformat(),
                }
                for ex in recent_exercises
            ],
            "achievements": [
                {
                    "id": ach.id,
                    "slug": ach.slug,
                    "title": ach.title,
                    "description": ach.description,
                    "badge_icon": ach.badge_icon,
                    "earned_at": ach.earned_at.isoformat(),
                }
                for ach in achievements
            ],
        },
    }

