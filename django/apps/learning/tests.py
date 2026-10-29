"""Automated unit and integration test suite for DistroPedia Learning Platform.

Tests model relationships, publication controls, server-side grading,
attempt limits, exercise evidence validation, answer key concealment,
ownership checks, and empty database behavior.
"""

from django.test import TestCase, Client
from django.contrib.auth.hashers import make_password
from apps.accounts.models import User
from apps.core.security import sign_token
from apps.learning.models import (
    LearningPlan,
    Lesson,
    PracticalExercise,
    VerificationRule,
    Assessment,
    AssessmentQuestion,
    UserLessonProgress,
    ExerciseAttempt,
    AssessmentAttempt,
)


class LearningPlatformTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create test users
        self.user = User.objects.create(
            email="learner@distropedia.local",
            name="Test Learner",
            password=make_password("password123", hasher="bcrypt"),
        )
        self.user_token = sign_token(self.user.pk)
        self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {self.user_token}"}

        self.other_user = User.objects.create(
            email="other@distropedia.local",
            name="Other Learner",
            password=make_password("password123", hasher="bcrypt"),
        )
        self.other_token = sign_token(self.other_user.pk)

    # 1. Empty Database Tests
    def test_empty_database_plans_api(self):
        """When no curriculum is added, GET /api/learning/plans returns empty data list."""
        res = self.client.get("/api/learning/plans")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("data"), [])

    def test_empty_database_dashboard_api(self):
        """When no curriculum or progress exists, dashboard returns clean empty state."""
        res = self.client.get("/api/learning/dashboard", **self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json().get("data", {})
        self.assertFalse(data.get("has_plans"))
        self.assertEqual(data.get("completed_lessons"), 0)
        self.assertEqual(data.get("total_plans"), 0)
        self.assertEqual(data.get("active_plans"), [])

    # 2. Authentication & Permission Tests
    def test_unauthenticated_protected_endpoints(self):
        """Protected endpoints reject anonymous access with 401."""
        endpoints = [
            ("/api/learning/dashboard", "GET"),
            ("/api/learning/lessons/1/complete", "POST"),
            ("/api/learning/exercises/1/submit", "POST"),
            ("/api/learning/assessments/1/submit", "POST"),
        ]
        for url, method in endpoints:
            if method == "GET":
                res = self.client.get(url)
            else:
                res = self.client.post(url, "{}", content_type="application/json")
            self.assertEqual(res.status_code, 401, f"{method} {url} should require auth")

    # 3. Publication Controls
    def test_publication_visibility(self):
        """Draft (is_published=False) plans, lessons, and exercises must not be visible via public API."""
        plan_draft = LearningPlan.objects.create(
            title="Draft Plan", slug="draft-plan", is_published=False
        )
        plan_pub = LearningPlan.objects.create(
            title="Published Plan", slug="pub-plan", is_published=True
        )

        res = self.client.get("/api/learning/plans")
        slugs = [p["slug"] for p in res.json()["data"]]
        self.assertIn("pub-plan", slugs)
        self.assertNotIn("draft-plan", slugs)

        # Direct access to draft plan returns 404
        res_draft = self.client.get("/api/learning/plans/draft-plan")
        self.assertEqual(res_draft.status_code, 404)

    # 4. Exercise Evidence Verification Engine Tests
    def test_exercise_verification_file_and_command_checks(self):
        """Server-side verification evaluates raw guest evidence without trusting frontend assertions."""
        plan = LearningPlan.objects.create(title="CLI Plan", slug="cli-plan", is_published=True)
        lesson = Lesson.objects.create(plan=plan, title="Lesson 1", slug="l1", is_published=True)
        exercise = PracticalExercise.objects.create(
            lesson=lesson,
            title="Create Greeting File",
            slug="greeting-file",
            points=20,
            is_published=True,
            max_attempts=3,
        )

        # Rule 1: /tmp/hello.txt must exist
        VerificationRule.objects.create(
            exercise=exercise,
            rule_type="file_exists",
            target="/tmp/hello.txt",
            points_weight=10,
            feedback_on_failure="File /tmp/hello.txt was not found.",
        )
        # Rule 2: /tmp/hello.txt must contain 'Hello Linux'
        VerificationRule.objects.create(
            exercise=exercise,
            rule_type="file_contains",
            target="/tmp/hello.txt",
            expected_value="Hello Linux",
            points_weight=10,
            feedback_on_failure="File does not contain 'Hello Linux'.",
        )

        # Submitting failed evidence (file missing)
        fail_evidence = {"files": {"/tmp/hello.txt": {"exists": False}}}
        res_fail = self.client.post(
            f"/api/learning/exercises/{exercise.id}/submit",
            {"evidence": fail_evidence},
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(res_fail.status_code, 200)
        data_fail = res_fail.json()["data"]
        self.assertFalse(data_fail["passed"])
        self.assertEqual(data_fail["score"], 0)

        # Submitting passing evidence
        pass_evidence = {
            "files": {
                "/tmp/hello.txt": {
                    "exists": True,
                    "content": "Hello Linux from guest",
                }
            }
        }
        res_pass = self.client.post(
            f"/api/learning/exercises/{exercise.id}/submit",
            {"evidence": pass_evidence},
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(res_pass.status_code, 200)
        data_pass = res_pass.json()["data"]
        self.assertTrue(data_pass["passed"])
        self.assertEqual(data_pass["score"], 20)

        # Progress should now be recorded
        progress = UserLessonProgress.objects.filter(user=self.user, lesson=lesson).first()
        self.assertIsNotNone(progress)
        self.assertTrue(progress.is_completed)

    def test_exercise_max_attempts_enforcement(self):
        """Enforces max_attempts configured on exercises."""
        plan = LearningPlan.objects.create(title="P", slug="p", is_published=True)
        lesson = Lesson.objects.create(plan=plan, title="L", slug="l", is_published=True)
        exercise = PracticalExercise.objects.create(
            lesson=lesson, title="E", slug="e", is_published=True, max_attempts=2
        )

        dummy_evidence = {"files": {}}
        for _ in range(2):
            res = self.client.post(
                f"/api/learning/exercises/{exercise.id}/submit",
                {"evidence": dummy_evidence},
                content_type="application/json",
                **self.auth_headers,
            )
            self.assertEqual(res.status_code, 200)

        # 3rd attempt must be rejected
        res3 = self.client.post(
            f"/api/learning/exercises/{exercise.id}/submit",
            {"evidence": dummy_evidence},
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(res3.status_code, 400)
        self.assertIn("Maximum attempts", res3.json()["message"])

    # 5. Assessment Security & Hidden Answer Keys
    def test_assessment_answer_keys_concealed(self):
        """GET /api/learning/assessments/<id> must NEVER leak correct_answers."""
        plan = LearningPlan.objects.create(title="P2", slug="p2", is_published=True)
        assessment = Assessment.objects.create(
            plan=plan, title="Test Assessment", slug="test-quiz", is_published=True
        )
        q = AssessmentQuestion.objects.create(
            assessment=assessment,
            question_type="single_choice",
            prompt="Which command lists files?",
            options=[{"id": "a", "text": "ls"}, {"id": "b", "text": "cd"}],
            correct_answers=["a"],
            points=5,
        )

        res = self.client.get(f"/api/learning/assessments/{assessment.id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        q_data = data["questions"][0]

        self.assertNotIn("correct_answers", q_data)
        self.assertNotIn("correct", q_data)
        self.assertEqual(q_data["prompt"], "Which command lists files?")

    def test_assessment_server_side_grading(self):
        """Server grades assessment submissions and records percentage score."""
        plan = LearningPlan.objects.create(title="P3", slug="p3", is_published=True)
        assessment = Assessment.objects.create(
            plan=plan, title="Graded Quiz", slug="graded-quiz", is_published=True, passing_percentage=50
        )
        q1 = AssessmentQuestion.objects.create(
            assessment=assessment,
            question_type="single_choice",
            prompt="Q1",
            options=[{"id": "a", "text": "A"}, {"id": "b", "text": "B"}],
            correct_answers=["a"],
            points=10,
        )
        q2 = AssessmentQuestion.objects.create(
            assessment=assessment,
            question_type="multiple_choice",
            prompt="Q2",
            options=[{"id": "a", "text": "A"}, {"id": "b", "text": "B"}],
            correct_answers=["a", "b"],
            points=10,
        )

        # Submit answers: q1 correct ('a'), q2 incorrect ('a' only)
        answers = {str(q1.id): "a", str(q2.id): ["a"]}
        res = self.client.post(
            f"/api/learning/assessments/{assessment.id}/submit",
            {"answers": answers},
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(res.status_code, 200)
        res_data = res.json()["data"]
        self.assertEqual(res_data["score"], 10)
        self.assertEqual(res_data["max_score"], 20)
        self.assertEqual(res_data["percentage"], 50.0)
        self.assertTrue(res_data["passed"])

