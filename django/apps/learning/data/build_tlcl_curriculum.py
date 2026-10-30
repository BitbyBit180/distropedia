# -*- coding: utf-8 -*-
"""Assemble the /learn syllabus from "The Linux Command Line, 2nd Edition".

Reads the per-chapter lesson files written under tlcl/, groups the 36 book
chapters into the book's four parts, renumbers ids, and emits:
  1. learning_curriculum.json  (seeded into SQLite by `manage.py seed_learning`)
  2. frontend/src/features/learning/learningData.js  (offline fallback)

Run from the repo root:  python3 django/apps/learning/data/build_tlcl_curriculum.py
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LESSON_DIR = HERE / "tlcl"
JSON_OUT = HERE / "learning_curriculum.json"
JS_OUT = HERE.parents[3] / "frontend" / "src" / "features" / "learning" / "learningData.js"

# chapter number -> plan, in book order
PLANS = [
    {
        "slug": "part-one-learning-the-shell",
        "title": "Part I: Learning the Shell",
        "range": range(1, 11),
        "difficulty": "beginner",
        "estimated_hours": 10,
        "description": "Chapters 1-10. Terminal basics, navigation, files, commands, "
        "redirection, permissions and processes.",
    },
    {
        "slug": "part-two-configuration-and-the-environment",
        "title": "Part II: Configuration and the Environment",
        "range": range(11, 14),
        "difficulty": "beginner",
        "estimated_hours": 5,
        "description": "Chapters 11-13. Environment variables, the vi editor and a prompt "
        "that tells you what you need to know.",
    },
    {
        "slug": "part-three-common-tasks-and-essential-tools",
        "title": "Part III: Common Tasks and Essential Tools",
        "range": range(14, 24),
        "difficulty": "intermediate",
        "estimated_hours": 12,
        "description": "Chapters 14-23. Packages, storage, networking, searching, archiving, "
        "regular expressions, text processing and compiling.",
    },
    {
        "slug": "part-four-writing-shell-scripts",
        "title": "Part IV: Writing Shell Scripts",
        "range": range(24, 37),
        "difficulty": "advanced",
        "estimated_hours": 12,
        "description": "Chapters 24-36. From a first script to top-down design, flow control, "
        "parameters, strings, numbers and arrays.",
    },
]


def chapter_of(lesson):
    """The book chapter number carried in the slug, e.g. tlcl-ch07-... -> 7."""
    return int(lesson["slug"].split("-")[1].lstrip("ch"))


def load_lessons():
    lessons = []
    for path in sorted(LESSON_DIR.glob("lessons_ch*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        lessons.extend(payload.get("lessons", []))

    lessons.sort(key=chapter_of)
    chapters = [chapter_of(lesson) for lesson in lessons]
    expected = list(range(1, 37))
    if chapters != expected:
        missing = sorted(set(expected) - set(chapters))
        raise SystemExit(
            f"expected chapters 1-36 exactly once, got {len(chapters)} lessons; missing={missing}"
        )
    return lessons


def build():
    lessons = load_lessons()
    lesson_id = 0
    exercise_id = 0
    plans_out = []

    for index, plan in enumerate(PLANS, start=1):
        plan_lessons = []
        for order, lesson in enumerate(
            [l for l in lessons if chapter_of(l) in plan["range"]], start=1
        ):
            lesson_id += 1
            exercises = []
            for ex_order, exercise in enumerate(lesson.get("exercises", []), start=1):
                exercise_id += 1
                exercises.append(
                    {
                        "id": exercise_id,
                        "title": exercise["title"],
                        "slug": exercise["slug"],
                        "order": ex_order,
                        "instructions": exercise.get("instructions", ""),
                        "hint": exercise.get("hint", ""),
                        "points": exercise.get("points", 10),
                        "verification_rules": [
                            {
                                "rule_type": rule.get("rule_type", "command_exit_zero"),
                                "target": rule.get("target", ""),
                                "expected_value": rule.get("expected_value", ""),
                                "points_weight": rule.get("points_weight", 10),
                                "feedback_on_failure": rule.get("feedback_on_failure", ""),
                            }
                            for rule in exercise.get("verification_rules", [])
                        ],
                    }
                )

            plan_lessons.append(
                {
                    "id": lesson_id,
                    "title": lesson["title"],
                    "slug": lesson["slug"],
                    "order": order,
                    "is_published": True,
                    "description": lesson.get("description", ""),
                    "content": lesson.get("content", ""),
                    "exercises": exercises,
                }
            )

        plans_out.append(
            {
                "id": index,
                "title": plan["title"],
                "slug": plan["slug"],
                "difficulty": plan["difficulty"],
                "estimated_hours": plan["estimated_hours"],
                "is_published": True,
                "order": index,
                "description": plan["description"],
                "lessons": plan_lessons,
            }
        )

    return {"plans": plans_out}


def write(curriculum):
    JSON_OUT.write_text(
        json.dumps(curriculum, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    JS_OUT.write_text(
        "// Syllabus for /learn — The Linux Command Line, 2nd Edition (36 chapters).\n"
        "// Generated by django/apps/learning/data/build_tlcl_curriculum.py; static fallback "
        "for when the API is down.\n"
        "export const LEARNING_CURRICULUM = "
        + json.dumps(curriculum, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    curriculum = build()
    write(curriculum)
    total_lessons = sum(len(plan["lessons"]) for plan in curriculum["plans"])
    total_exercises = sum(
        len(lesson["exercises"]) for plan in curriculum["plans"] for lesson in plan["lessons"]
    )
    print(
        f"wrote {len(curriculum['plans'])} plans, {total_lessons} lessons, "
        f"{total_exercises} exercises -> {JSON_OUT.name}, {JS_OUT.name}"
    )
