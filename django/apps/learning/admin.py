"""Django Admin registration for DistroPedia Learning Platform.

Provides inline editing, publication controls, search, and filtering
for Learning Plans, Lessons, Practical Exercises, Rules, and Assessments.
"""

from django.contrib import admin
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
    UserAchievement,
)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ("title", "slug", "order", "is_published")
    prepopulated_fields = {"slug": ("title",)}
    show_change_link = True


class VerificationRuleInline(admin.TabularInline):
    model = VerificationRule
    extra = 0
    fields = ("rule_type", "target", "expected_value", "points_weight", "feedback_on_failure", "order")


class PracticalExerciseInline(admin.TabularInline):
    model = PracticalExercise
    extra = 0
    fields = ("title", "slug", "points", "max_attempts", "is_published", "order")
    prepopulated_fields = {"slug": ("title",)}
    show_change_link = True


class AssessmentQuestionInline(admin.StackedInline):
    model = AssessmentQuestion
    extra = 0
    fields = ("order", "question_type", "prompt", "options", "correct_answers", "points", "explanation")


@admin.register(LearningPlan)
class LearningPlanAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "estimated_hours", "order", "is_published", "created_at")
    list_filter = ("is_published", "difficulty")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [LessonInline]
    actions = ["publish_plans", "unpublish_plans"]

    @admin.action(description="Publish selected plans")
    def publish_plans(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected plans")
    def unpublish_plans(self, request, queryset):
        queryset.update(is_published=False)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "plan", "order", "is_published", "created_at")
    list_filter = ("is_published", "plan")
    search_fields = ("title", "description", "content")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("prerequisites",)
    inlines = [PracticalExerciseInline]
    actions = ["publish_lessons", "unpublish_lessons"]

    @admin.action(description="Publish selected lessons")
    def publish_lessons(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected lessons")
    def unpublish_lessons(self, request, queryset):
        queryset.update(is_published=False)


@admin.register(PracticalExercise)
class PracticalExerciseAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "points", "max_attempts", "is_published", "order")
    list_filter = ("is_published", "lesson__plan", "lesson")
    search_fields = ("title", "instructions", "verification_script")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [VerificationRuleInline]


@admin.register(VerificationRule)
class VerificationRuleAdmin(admin.ModelAdmin):
    list_display = ("exercise", "rule_type", "target", "points_weight", "order")
    list_filter = ("rule_type", "exercise__lesson")
    search_fields = ("target", "expected_value", "feedback_on_failure")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("title", "plan", "lesson", "passing_percentage", "max_attempts", "is_published")
    list_filter = ("is_published", "plan")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [AssessmentQuestionInline]


@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ("assessment", "order", "question_type", "prompt", "points")
    list_filter = ("question_type", "assessment")
    search_fields = ("prompt", "explanation")


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "is_completed", "completed_at", "last_accessed_at")
    list_filter = ("is_completed", "lesson__plan")
    search_fields = ("user__email", "lesson__title")
    readonly_fields = ("completed_at", "last_accessed_at")


@admin.register(ExerciseAttempt)
class ExerciseAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "exercise", "passed", "score", "max_score", "submitted_at")
    list_filter = ("passed", "exercise__lesson")
    search_fields = ("user__email", "exercise__title")
    readonly_fields = ("submitted_at", "evidence", "rule_results")


@admin.register(AssessmentAttempt)
class AssessmentAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "assessment", "score", "max_score", "percentage", "passed", "submitted_at")
    list_filter = ("passed", "assessment")
    search_fields = ("user__email", "assessment__title")
    readonly_fields = ("submitted_at", "submitted_answers", "feedback")


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "slug", "earned_at")
    search_fields = ("user__email", "title", "slug")
    readonly_fields = ("earned_at",)

