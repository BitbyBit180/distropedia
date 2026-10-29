"""Exercise verification and assessment grading services.

Evaluates guest-collected evidence against server-controlled rules,
calculates scores, enforces attempt limits, and persists attempts.
"""

import re
from datetime import datetime, timezone
from django.db import transaction
from apps.core.errors import ApiError
from apps.learning.models import (
    PracticalExercise,
    ExerciseAttempt,
    Assessment,
    AssessmentAttempt,
    UserLessonProgress,
    UserAchievement,
)


def verify_exercise_submission(user, exercise_id, evidence):
    """Evaluate guest-collected evidence against server-side verification rules.

    Does NOT trust frontend assertions of success. Evaluates raw evidence.
    """
    if not isinstance(evidence, dict):
        raise ApiError("Evidence must be a structured JSON object", 400)

    try:
        exercise = PracticalExercise.objects.prefetch_related("rules").get(
            pk=exercise_id
        )
    except (PracticalExercise.DoesNotExist, ValueError):
        raise ApiError("Exercise not found", 404)

    if not exercise.is_published:
        raise ApiError("Exercise is not published", 404)

    # Enforce attempt limit
    if exercise.max_attempts > 0:
        attempts_count = ExerciseAttempt.objects.filter(
            user=user, exercise=exercise
        ).count()
        if attempts_count >= exercise.max_attempts:
            raise ApiError(
                f"Maximum attempts ({exercise.max_attempts}) reached for this exercise",
                400,
            )

    rules = list(exercise.rules.all())
    rule_results = []
    total_points = 0
    earned_points = 0
    all_passed = True

    files_evidence = evidence.get("files") or {}
    commands_evidence = evidence.get("commands") or {}
    env_evidence = evidence.get("env") or {}
    custom_evidence = evidence.get("custom") or {}

    for rule in rules:
        rule_passed = False
        target = rule.target or ""
        expected = rule.expected_value or ""
        points_weight = rule.points_weight or 10
        total_points += points_weight

        if rule.rule_type == "file_exists":
            f_info = files_evidence.get(target) or {}
            rule_passed = bool(f_info.get("exists") is True)

        elif rule.rule_type == "file_not_exists":
            f_info = files_evidence.get(target) or {}
            rule_passed = bool(f_info.get("exists") is False)

        elif rule.rule_type == "file_contains":
            f_info = files_evidence.get(target) or {}
            content = f_info.get("content") or ""
            if expected:
                try:
                    rule_passed = bool(re.search(expected, content))
                except re.error:
                    rule_passed = expected in content
            else:
                rule_passed = bool(content.strip())

        elif rule.rule_type == "command_exit_zero":
            cmd_info = commands_evidence.get(target) or {}
            rule_passed = cmd_info.get("exit_code") == 0

        elif rule.rule_type == "output_matches":
            cmd_info = commands_evidence.get(target) or {}
            out = cmd_info.get("output") or ""
            if expected:
                try:
                    rule_passed = bool(re.search(expected, out))
                except re.error:
                    rule_passed = expected in out
            else:
                rule_passed = bool(out.strip())

        elif rule.rule_type == "env_var_equals":
            val = env_evidence.get(target)
            rule_passed = str(val) == str(expected)

        elif rule.rule_type == "custom_json":
            val = custom_evidence.get(target)
            rule_passed = str(val) == str(expected)

        if rule_passed:
            earned_points += points_weight
        else:
            all_passed = False

        rule_results.append(
            {
                "rule_id": rule.id,
                "rule_type": rule.rule_type,
                "target": target,
                "passed": rule_passed,
                "points": points_weight if rule_passed else 0,
                "feedback": rule.feedback_on_failure if not rule_passed else "",
            }
        )

    # Fallback when exercise has no specific sub-rules configured yet
    if not rules:
        total_points = exercise.points
        # Check standard default command check from evidence
        default_cmd = commands_evidence.get("default") or {}
        all_passed = default_cmd.get("exit_code") == 0
        earned_points = total_points if all_passed else 0

    overall_passed = all_passed and (earned_points == total_points)

    with transaction.atomic():
        attempt = ExerciseAttempt.objects.create(
            user=user,
            exercise=exercise,
            passed=overall_passed,
            score=earned_points,
            max_score=total_points,
            evidence=evidence,
            rule_results=rule_results,
            feedback="All checks passed successfully." if overall_passed else "Some verification checks failed. Review feedback.",
        )

        # Update lesson progress if this was successful
        if overall_passed:
            progress, _ = UserLessonProgress.objects.get_or_create(
                user=user, lesson=exercise.lesson
            )
            # Check if all published exercises for this lesson are passed
            all_lesson_exercises = PracticalExercise.objects.filter(
                lesson=exercise.lesson, is_published=True
            )
            all_ex_ids = set(all_lesson_exercises.values_list("id", flat=True))
            passed_ex_ids = set(
                ExerciseAttempt.objects.filter(
                    user=user, exercise_id__in=all_ex_ids, passed=True
                ).values_list("exercise_id", flat=True)
            )

            if all_ex_ids and all_ex_ids.issubset(passed_ex_ids):
                progress.is_completed = True
                progress.completed_at = datetime.now(timezone.utc)
                progress.save()

    return {
        "attempt_id": attempt.id,
        "exercise_id": exercise.id,
        "passed": overall_passed,
        "score": earned_points,
        "max_score": total_points,
        "feedback": attempt.feedback,
        "rule_results": rule_results,
        "submitted_at": attempt.submitted_at.isoformat(),
    }


def grade_assessment_submission(user, assessment_id, submitted_answers):
    """Grade assessment questions strictly server-side.

    Answer keys are kept server-side and never exposed before submission.
    """
    if not isinstance(submitted_answers, dict):
        raise ApiError("Answers must be a JSON object mapping question_id -> answer", 400)

    try:
        assessment = Assessment.objects.prefetch_related("questions").get(
            pk=assessment_id
        )
    except (Assessment.DoesNotExist, ValueError):
        raise ApiError("Assessment not found", 404)

    if not assessment.is_published:
        raise ApiError("Assessment is not published", 404)

    # Check attempt limit
    if assessment.max_attempts > 0:
        attempts_count = AssessmentAttempt.objects.filter(
            user=user, assessment=assessment
        ).count()
        if attempts_count >= assessment.max_attempts:
            raise ApiError(
                f"Maximum attempts ({assessment.max_attempts}) reached for this assessment",
                400,
            )

    questions = list(assessment.questions.all())
    total_score = 0
    earned_score = 0
    feedback = {}

    for q in questions:
        q_id_str = str(q.id)
        user_ans = submitted_answers.get(q_id_str)
        q_pts = q.points or 1
        total_score += q_pts
        q_passed = False

        if q.question_type == "single_choice":
            # correct_answers: e.g. ["a"] or "a"
            correct = q.correct_answers
            if isinstance(correct, list):
                q_passed = str(user_ans).strip().lower() in [str(c).strip().lower() for c in correct]
            else:
                q_passed = str(user_ans).strip().lower() == str(correct).strip().lower()

        elif q.question_type == "multiple_choice":
            # correct_answers: e.g. ["a", "c"]
            correct_set = {str(c).strip().lower() for c in (q.correct_answers or [])}
            user_set = {str(a).strip().lower() for a in (user_ans if isinstance(user_ans, list) else [user_ans])}
            q_passed = bool(correct_set and user_set == correct_set)

        elif q.question_type == "terminal_practical":
            # verification rule dict in correct_answers
            rule_spec = q.correct_answers if isinstance(q.correct_answers, dict) else {}
            expected = rule_spec.get("expected")
            actual = str(user_ans).strip() if user_ans else ""
            if expected:
                try:
                    q_passed = bool(re.search(expected, actual))
                except re.error:
                    q_passed = expected in actual
            else:
                q_passed = bool(actual)

        if q_passed:
            earned_score += q_pts

        feedback[q_id_str] = {
            "correct": q_passed,
            "earned_points": q_pts if q_passed else 0,
            "max_points": q_pts,
            "explanation": q.explanation,
        }

    percentage = round((earned_score / total_score * 100.0), 1) if total_score > 0 else 0.0
    passed = percentage >= assessment.passing_percentage

    with transaction.atomic():
        attempt = AssessmentAttempt.objects.create(
            user=user,
            assessment=assessment,
            submitted_answers=submitted_answers,
            score=earned_score,
            max_score=total_score,
            percentage=percentage,
            passed=passed,
            feedback=feedback,
        )

        # If assessment belongs to a lesson and was passed, update progress
        if passed and assessment.lesson:
            progress, _ = UserLessonProgress.objects.get_or_create(
                user=user, lesson=assessment.lesson
            )
            progress.is_completed = True
            progress.completed_at = datetime.now(timezone.utc)
            progress.save()

    return {
        "attempt_id": attempt.id,
        "assessment_id": assessment.id,
        "score": earned_score,
        "max_score": total_score,
        "percentage": percentage,
        "passed": passed,
        "feedback": feedback,
        "submitted_at": attempt.submitted_at.isoformat(),
    }

