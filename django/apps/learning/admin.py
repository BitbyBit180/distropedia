"""Unfold Django Admin registration for DistroPedia Learning Platform.

Provides inline editing, publication controls, search, and filtering
for Learning Plans, Lessons, Practical Exercises, Rules, and Assessments.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.contrib.filters.admin import (
    BooleanRadioFilter,
    ChoicesDropdownFilter,
    RangeDateTimeFilter,
    RelatedDropdownFilter,
)
from unfold.decorators import action, display

from apps.learning.models import (
    Assessment,
    AssessmentAttempt,
    AssessmentQuestion,
    ExerciseAttempt,
    LearningPlan,
    Lesson,
    PracticalExercise,
    UserAchievement,
    UserLessonProgress,
    VerificationRule,
)


class LessonInline(TabularInline):
    model = Lesson
    extra = 0
    fields = ("title", "slug", "order", "is_published")
    prepopulated_fields = {"slug": ("title",)}
    show_change_link = True


class VerificationRuleInline(TabularInline):
    model = VerificationRule
    extra = 0
    fields = (
        "rule_type",
        "target",
        "expected_value",
        "points_weight",
        "feedback_on_failure",
        "order",
    )


class PracticalExerciseInline(TabularInline):
    model = PracticalExercise
    extra = 0
    fields = ("title", "slug", "points", "max_attempts", "is_published", "order")
    prepopulated_fields = {"slug": ("title",)}
    show_change_link = True


class AssessmentQuestionInline(StackedInline):
    model = AssessmentQuestion
    extra = 0
    fields = (
        "order",
        "question_type",
        "prompt",
        "options",
        "correct_answers",
        "points",
        "explanation",
    )


@admin.register(LearningPlan)
class LearningPlanAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_difficulty",
        "estimated_hours",
        "order",
        "display_published",
        "display_lessons_count",
        "created_at",
    )
    list_filter = (
        ("is_published", BooleanRadioFilter),
        ("difficulty", ChoicesDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [LessonInline]
    actions = ["publish_plans", "unpublish_plans"]

    fieldsets = (
        (
            _("Plan Overview"),
            {
                "fields": (
                    "title",
                    "slug",
                    "description",
                    "difficulty",
                    "estimated_hours",
                    "order",
                    "is_published",
                ),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at")

    @display(
        description=_("Difficulty"),
        label={
            "beginner": "info",
            "intermediate": "warning",
            "advanced": "danger",
        },
    )
    def display_difficulty(self, instance: LearningPlan):
        return instance.difficulty

    @display(description=_("Published"), boolean=True)
    def display_published(self, instance: LearningPlan):
        return instance.is_published

    @display(description=_("Lessons"), label=True)
    def display_lessons_count(self, instance: LearningPlan):
        return f"{instance.lessons.count()} lessons"

    @action(description=_("Publish selected plans"))
    def publish_plans(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"Published {count} learning plan(s).")

    @action(description=_("Unpublish selected plans"))
    def unpublish_plans(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"Unpublished {count} learning plan(s).")


@admin.register(Lesson)
class LessonAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_plan",
        "order",
        "display_published",
        "display_exercises_count",
        "created_at",
    )
    list_filter = (
        ("is_published", BooleanRadioFilter),
        ("plan", RelatedDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("title", "description", "content")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("prerequisites",)
    inlines = [PracticalExerciseInline]
    actions = ["publish_lessons", "unpublish_lessons"]

    fieldsets = (
        (
            _("Lesson Details"),
            {
                "fields": (
                    "plan",
                    "title",
                    "slug",
                    "order",
                    "is_published",
                    "description",
                ),
            },
        ),
        (
            _("Content & Curriculum"),
            {
                "fields": ("content", "prerequisites"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at")

    @display(description=_("Plan"))
    def display_plan(self, instance: Lesson):
        return instance.plan.title

    @display(description=_("Published"), boolean=True)
    def display_published(self, instance: Lesson):
        return instance.is_published

    @display(description=_("Exercises"), label=True)
    def display_exercises_count(self, instance: Lesson):
        return f"{instance.exercises.count()} exercises"

    @action(description=_("Publish selected lessons"))
    def publish_lessons(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"Published {count} lesson(s).")

    @action(description=_("Unpublish selected lessons"))
    def unpublish_lessons(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"Unpublished {count} lesson(s).")


@admin.register(PracticalExercise)
class PracticalExerciseAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_lesson",
        "points",
        "max_attempts",
        "display_published",
        "order",
    )
    list_filter = (
        ("is_published", BooleanRadioFilter),
        ("lesson__plan", RelatedDropdownFilter),
        ("lesson", RelatedDropdownFilter),
    )
    search_fields = ("title", "instructions", "verification_script")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [VerificationRuleInline]
    actions = ["publish_exercises", "unpublish_exercises"]

    fieldsets = (
        (
            _("Exercise Configuration"),
            {
                "fields": (
                    "lesson",
                    "title",
                    "slug",
                    "points",
                    "max_attempts",
                    "is_published",
                    "order",
                ),
            },
        ),
        (
            _("Instructions & Verification"),
            {
                "fields": ("instructions", "starter_command", "verification_script"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at")

    @display(description=_("Lesson"))
    def display_lesson(self, instance: PracticalExercise):
        return f"{instance.lesson.plan.title} → {instance.lesson.title}"

    @display(description=_("Published"), boolean=True)
    def display_published(self, instance: PracticalExercise):
        return instance.is_published

    @action(description=_("Publish selected exercises"))
    def publish_exercises(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"Published {count} exercise(s).")

    @action(description=_("Unpublish selected exercises"))
    def unpublish_exercises(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"Unpublished {count} exercise(s).")


@admin.register(VerificationRule)
class VerificationRuleAdmin(ModelAdmin):
    list_display = (
        "exercise",
        "display_rule_type",
        "target",
        "points_weight",
        "order",
    )
    list_filter = (
        ("rule_type", ChoicesDropdownFilter),
        ("exercise__lesson", RelatedDropdownFilter),
    )
    search_fields = ("target", "expected_value", "feedback_on_failure")

    @display(
        description=_("Rule Type"),
        label={
            "file_exists": "info",
            "file_contains": "info",
            "command_output": "success",
            "exit_code": "warning",
            "service_active": "primary",
        },
    )
    def display_rule_type(self, instance: VerificationRule):
        return instance.rule_type


@admin.register(Assessment)
class AssessmentAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_plan",
        "display_lesson",
        "display_passing",
        "max_attempts",
        "display_published",
    )
    list_filter = (
        ("is_published", BooleanRadioFilter),
        ("plan", RelatedDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [AssessmentQuestionInline]
    actions = ["publish_assessments", "unpublish_assessments"]

    fieldsets = (
        (
            _("Assessment Setup"),
            {
                "fields": (
                    "title",
                    "slug",
                    "plan",
                    "lesson",
                    "passing_percentage",
                    "max_attempts",
                    "is_published",
                    "description",
                ),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at")

    @display(description=_("Plan"))
    def display_plan(self, instance: Assessment):
        return instance.plan.title if instance.plan else "—"

    @display(description=_("Lesson"))
    def display_lesson(self, instance: Assessment):
        return instance.lesson.title if instance.lesson else "—"

    @display(description=_("Passing"), label=True)
    def display_passing(self, instance: Assessment):
        return f"{instance.passing_percentage}%"

    @display(description=_("Published"), boolean=True)
    def display_published(self, instance: Assessment):
        return instance.is_published

    @action(description=_("Publish selected assessments"))
    def publish_assessments(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"Published {count} assessment(s).")

    @action(description=_("Unpublish selected assessments"))
    def unpublish_assessments(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"Unpublished {count} assessment(s).")


@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(ModelAdmin):
    list_display = (
        "assessment",
        "order",
        "display_question_type",
        "display_prompt_snippet",
        "points",
    )
    list_filter = (
        ("question_type", ChoicesDropdownFilter),
        ("assessment", RelatedDropdownFilter),
    )
    search_fields = ("prompt", "explanation")

    @display(
        description=_("Type"),
        label={
            "single_choice": "info",
            "multiple_choice": "primary",
            "terminal_command": "warning",
            "text": "secondary",
        },
    )
    def display_question_type(self, instance: AssessmentQuestion):
        return instance.question_type

    @display(description=_("Prompt"))
    def display_prompt_snippet(self, instance: AssessmentQuestion):
        text = instance.prompt or ""
        return (text[:70] + "…") if len(text) > 70 else text


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(ModelAdmin):
    list_display = (
        "user",
        "display_lesson",
        "display_completed",
        "completed_at",
        "last_accessed_at",
    )
    list_filter = (
        ("is_completed", BooleanRadioFilter),
        ("lesson__plan", RelatedDropdownFilter),
        ("completed_at", RangeDateTimeFilter),
    )
    search_fields = ("user__email", "lesson__title")
    readonly_fields = ("completed_at", "last_accessed_at")

    @display(description=_("Lesson"))
    def display_lesson(self, instance: UserLessonProgress):
        return f"{instance.lesson.plan.title} → {instance.lesson.title}"

    @display(description=_("Completed"), boolean=True)
    def display_completed(self, instance: UserLessonProgress):
        return instance.is_completed


@admin.register(ExerciseAttempt)
class ExerciseAttemptAdmin(ModelAdmin):
    list_display = (
        "user",
        "display_exercise",
        "display_passed",
        "display_score",
        "submitted_at",
    )
    list_filter = (
        ("passed", BooleanRadioFilter),
        ("exercise__lesson", RelatedDropdownFilter),
        ("submitted_at", RangeDateTimeFilter),
    )
    search_fields = ("user__email", "exercise__title")
    readonly_fields = ("submitted_at", "evidence", "rule_results")

    fieldsets = (
        (
            _("Attempt Summary"),
            {
                "fields": (
                    "user",
                    "exercise",
                    "passed",
                    "score",
                    "max_score",
                    "submitted_at",
                ),
            },
        ),
        (
            _("Evaluation Evidence & Rule Results (JSON)"),
            {
                "classes": ("collapse",),
                "fields": ("evidence", "rule_results"),
            },
        ),
    )

    @display(description=_("Exercise"))
    def display_exercise(self, instance: ExerciseAttempt):
        return instance.exercise.title

    @display(
        description=_("Passed"),
        label={
            "Passed": "success",
            "Failed": "danger",
        },
    )
    def display_passed(self, instance: ExerciseAttempt):
        return "Passed" if instance.passed else "Failed"

    @display(description=_("Score"), label=True)
    def display_score(self, instance: ExerciseAttempt):
        return f"{instance.score} / {instance.max_score}"


@admin.register(AssessmentAttempt)
class AssessmentAttemptAdmin(ModelAdmin):
    list_display = (
        "user",
        "display_assessment",
        "display_percentage",
        "display_score",
        "display_passed",
        "submitted_at",
    )
    list_filter = (
        ("passed", BooleanRadioFilter),
        ("assessment", RelatedDropdownFilter),
        ("submitted_at", RangeDateTimeFilter),
    )
    search_fields = ("user__email", "assessment__title")
    readonly_fields = ("submitted_at", "submitted_answers", "feedback")

    fieldsets = (
        (
            _("Attempt Summary"),
            {
                "fields": (
                    "user",
                    "assessment",
                    "score",
                    "max_score",
                    "percentage",
                    "passed",
                    "submitted_at",
                ),
            },
        ),
        (
            _("Submitted Answers & Feedback (JSON)"),
            {
                "classes": ("collapse",),
                "fields": ("submitted_answers", "feedback"),
            },
        ),
    )

    @display(description=_("Assessment"))
    def display_assessment(self, instance: AssessmentAttempt):
        return instance.assessment.title

    @display(description=_("Percentage"), label=True)
    def display_percentage(self, instance: AssessmentAttempt):
        return f"{instance.percentage:.1f}%"

    @display(description=_("Score"))
    def display_score(self, instance: AssessmentAttempt):
        return f"{instance.score} / {instance.max_score}"

    @display(
        description=_("Passed"),
        label={
            "Passed": "success",
            "Failed": "danger",
        },
    )
    def display_passed(self, instance: AssessmentAttempt):
        return "Passed" if instance.passed else "Failed"


@admin.register(UserAchievement)
class UserAchievementAdmin(ModelAdmin):
    list_display = ("user", "title", "display_slug", "earned_at")
    list_filter = (("earned_at", RangeDateTimeFilter),)
    search_fields = ("user__email", "title", "slug")
    readonly_fields = ("earned_at",)

    @display(description=_("Badge ID"), label=True)
    def display_slug(self, instance: UserAchievement):
        return instance.slug
