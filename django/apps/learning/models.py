"""Learning infrastructure models for DistroPedia Linux Lab.

Contains models for Learning Plans, Lessons, Practical Exercises,
Verification Rules, Assessments, Questions, User Progress, and Attempts.
No curriculum or sample learning content is defined here.
"""

from django.db import models


class LearningPlan(models.Model):
    DIFFICULTY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    difficulty = models.CharField(
        max_length=32, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    estimated_hours = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=False, db_index=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_plans"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.title} ({'Published' if self.is_published else 'Draft'})"


class Lesson(models.Model):
    plan = models.ForeignKey(
        LearningPlan, on_delete=models.CASCADE, related_name="lessons"
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField(blank=True)
    content = models.TextField(
        blank=True, help_text="Markdown formatted instructional content"
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_published = models.BooleanField(default=False, db_index=True)
    prerequisites = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="unlocks"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_lessons"
        ordering = ["order", "created_at"]
        unique_together = [("plan", "slug")]

    def __str__(self):
        return f"{self.plan.title} / {self.title}"


class PracticalExercise(models.Model):
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="exercises"
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    instructions = models.TextField(blank=True)
    hint = models.TextField(blank=True)
    verification_script = models.TextField(
        blank=True,
        help_text="Shell script run inside guest Linux terminal to collect evidence",
    )
    points = models.PositiveIntegerField(default=10)
    max_attempts = models.PositiveIntegerField(
        default=0, help_text="Maximum allowed attempts (0 for unlimited)"
    )
    is_published = models.BooleanField(default=False, db_index=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_exercises"
        ordering = ["order", "created_at"]
        unique_together = [("lesson", "slug")]

    def __str__(self):
        return f"{self.lesson.title} - Ex: {self.title}"


class VerificationRule(models.Model):
    RULE_TYPES = [
        ("file_exists", "File Exists in Guest"),
        ("file_contains", "File Contains Substring/Regex"),
        ("file_not_exists", "File Does Not Exist"),
        ("command_exit_zero", "Command Exits With Code 0"),
        ("output_matches", "Command Output Matches Pattern"),
        ("env_var_equals", "Environment Variable Equals Value"),
        ("custom_json", "Custom Structured Evidence Key-Value Match"),
    ]

    exercise = models.ForeignKey(
        PracticalExercise, on_delete=models.CASCADE, related_name="rules"
    )
    rule_type = models.CharField(
        max_length=32, choices=RULE_TYPES, default="file_exists"
    )
    target = models.CharField(
        max_length=255,
        blank=True,
        help_text="File path, env var name, or command to test",
    )
    expected_value = models.TextField(
        blank=True,
        help_text="Expected string, exit code, or regex pattern",
    )
    points_weight = models.PositiveIntegerField(
        default=10, help_text="Points awarded if this specific rule passes"
    )
    feedback_on_failure = models.CharField(
        max_length=255,
        blank=True,
        help_text="Helpful hint or feedback displayed if this check fails",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "learning_verification_rules"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.exercise.title} Rule: {self.get_rule_type_display()} ({self.target})"


class Assessment(models.Model):
    plan = models.ForeignKey(
        LearningPlan,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessments",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessments",
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField(blank=True)
    passing_percentage = models.PositiveIntegerField(
        default=70, help_text="Percentage score required to pass"
    )
    max_attempts = models.PositiveIntegerField(
        default=0, help_text="Maximum allowed attempts (0 for unlimited)"
    )
    time_limit_minutes = models.PositiveIntegerField(
        default=0, help_text="Time limit in minutes (0 for no limit)"
    )
    is_published = models.BooleanField(default=False, db_index=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_assessments"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.title} ({'Published' if self.is_published else 'Draft'})"


class AssessmentQuestion(models.Model):
    QUESTION_TYPES = [
        ("single_choice", "Single Choice (Radio)"),
        ("multiple_choice", "Multiple Choice (Checkbox)"),
        ("terminal_practical", "Terminal Practical Verification"),
    ]

    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="questions"
    )
    question_type = models.CharField(
        max_length=32, choices=QUESTION_TYPES, default="single_choice"
    )
    prompt = models.TextField(help_text="Question text or markdown prompt")
    options = models.JSONField(
        default=list,
        blank=True,
        help_text="List of choices: [{'id': 'a', 'text': 'Option A'}]",
    )
    correct_answers = models.JSONField(
        default=list,
        help_text="List of correct IDs (e.g. ['a']) or validation rule dict. Never exposed to public API!",
    )
    explanation = models.TextField(
        blank=True, help_text="Explanation shown after grading submission"
    )
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "learning_assessment_questions"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.assessment.title} - Q{self.order}: {self.prompt[:40]}"


class UserLessonProgress(models.Model):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="user_progress"
    )
    is_completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_user_lesson_progress"
        unique_together = [("user", "lesson")]

    def __str__(self):
        return f"{self.user.email} - {self.lesson.title}: {'Done' if self.is_completed else 'In Progress'}"


class ExerciseAttempt(models.Model):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="exercise_attempts"
    )
    exercise = models.ForeignKey(
        PracticalExercise, on_delete=models.CASCADE, related_name="attempts"
    )
    passed = models.BooleanField(default=False, db_index=True)
    score = models.PositiveIntegerField(default=0)
    max_score = models.PositiveIntegerField(default=10)
    evidence = models.JSONField(default=dict, blank=True)
    feedback = models.TextField(blank=True)
    rule_results = models.JSONField(default=list, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "learning_exercise_attempts"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user.email} - {self.exercise.title}: {'Passed' if self.passed else 'Failed'} ({self.score}/{self.max_score})"


class AssessmentAttempt(models.Model):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="assessment_attempts"
    )
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="attempts"
    )
    submitted_answers = models.JSONField(default=dict)
    score = models.PositiveIntegerField(default=0)
    max_score = models.PositiveIntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    passed = models.BooleanField(default=False, db_index=True)
    feedback = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "learning_assessment_attempts"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user.email} - {self.assessment.title}: {self.percentage}% ({'Passed' if self.passed else 'Failed'})"


class UserAchievement(models.Model):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="achievements"
    )
    slug = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    badge_icon = models.CharField(max_length=50, default="award")
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "learning_user_achievements"
        unique_together = [("user", "slug")]
        ordering = ["-earned_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

