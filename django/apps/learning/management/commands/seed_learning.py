import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.learning.models import (
    LearningPlan,
    Lesson,
    PracticalExercise,
    VerificationRule,
)

DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent
    / "data"
    / "learning_curriculum.json"
)


class Command(BaseCommand):
    help = "Seed the database with the complete Linux learning curriculum"

    def add_arguments(self, parser):
        parser.add_argument(
            "--prune",
            action="store_true",
            help="Delete plans, lessons and exercises that are absent from the data file "
            "(used when the syllabus itself is replaced). Cascades to user progress.",
        )

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f"Data file not found: {DATA_FILE}"))
            return

        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        plans_data = data.get("plans", [])
        total_plans = 0
        total_lessons = 0
        total_exercises = 0
        total_rules = 0

        kept_plan_slugs = set()
        kept_lesson_slugs = set()

        with transaction.atomic():
            for plan_info in plans_data:
                plan, _ = LearningPlan.objects.update_or_create(
                    slug=plan_info["slug"],
                    defaults={
                        "title": plan_info["title"],
                        "description": plan_info.get("description", ""),
                        "difficulty": plan_info.get("difficulty", "beginner"),
                        "estimated_hours": plan_info.get("estimated_hours", 1),
                        "is_published": plan_info.get("is_published", True),
                        "order": plan_info.get("order", 0),
                    },
                )
                total_plans += 1
                kept_plan_slugs.add(plan_info["slug"])

                for lesson_info in plan_info.get("lessons", []):
                    lesson, _ = Lesson.objects.update_or_create(
                        plan=plan,
                        slug=lesson_info["slug"],
                        defaults={
                            "title": lesson_info["title"],
                            "description": lesson_info.get("description", ""),
                            "content": lesson_info.get("content", ""),
                            "order": lesson_info.get("order", 0),
                            "is_published": lesson_info.get("is_published", True),
                        },
                    )
                    total_lessons += 1
                    kept_lesson_slugs.add(lesson_info["slug"])

                    for ex_info in lesson_info.get("exercises", []):
                        exercise, _ = PracticalExercise.objects.update_or_create(
                            lesson=lesson,
                            slug=ex_info["slug"],
                            defaults={
                                "title": ex_info["title"],
                                "instructions": ex_info.get("instructions", ""),
                                "hint": ex_info.get("hint", ""),
                                "points": ex_info.get("points", 10),
                                "order": ex_info.get("order", 0),
                                "is_published": True,
                            },
                        )
                        total_exercises += 1

                        # Recreate rules
                        exercise.rules.all().delete()
                        for r_idx, rule_info in enumerate(ex_info.get("verification_rules", [])):
                            VerificationRule.objects.create(
                                exercise=exercise,
                                rule_type=rule_info.get("rule_type", "command_exit_zero"),
                                target=rule_info.get("target", ""),
                                expected_value=rule_info.get("expected_value", ""),
                                points_weight=rule_info.get("points_weight", 10),
                                feedback_on_failure=rule_info.get("feedback_on_failure", ""),
                                order=r_idx + 1,
                            )
                            total_rules += 1

        if options.get("prune"):
            stale_lessons = Lesson.objects.exclude(slug__in=kept_lesson_slugs)
            stale_plans = LearningPlan.objects.exclude(slug__in=kept_plan_slugs)
            lesson_count = stale_lessons.count()
            plan_count = stale_plans.count()
            # Plans cascade their lessons; delete detached lessons from kept plans first.
            stale_lessons.delete()
            stale_plans.delete()
            if lesson_count or plan_count:
                self.stdout.write(
                    self.style.WARNING(
                        f"Pruned {plan_count} old plan(s) and {lesson_count} old lesson(s) "
                        "that are no longer in the syllabus."
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded: {total_plans} plans, {total_lessons} lessons, "
                f"{total_exercises} practical exercises, {total_rules} verification rules."
            )
        )

