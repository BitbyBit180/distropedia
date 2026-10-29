# DistroPedia Linux Lab — Architecture, Setup & Maintenance Documentation

## 1. Overview & Repository Architecture

DistroPedia is a full-stack platform combining a modern React SPA with a high-performance Django JSON API and SQLite persistence.

The **Linux Lab** integrates an authentic, in-browser x86_32 Linux environment utilizing **v86** (WebAssembly PC emulator) and **xterm.js**. Commands execute entirely in the user's browser inside the virtual machine, isolating execution from the server host.

### Directory Structure
```text
/home/amogha/Linux Distro Hub/
├── frontend/                     # React 18 + Vite SPA
│   ├── public/
│   │   └── v86/                  # Emulator assets
│   │       ├── v86.wasm          # Compiled WebAssembly x86 emulator
│   │       ├── seabios.bin       # SeaBIOS ROM image (128 KB)
│   │       ├── vgabios.bin       # VGABios ROM image (36 KB)
│   │       ├── buildroot-bzimage.bin # Buildroot Linux x86 kernel (5.0 MB)
│   │       └── libv86.js         # Emulator JS runtime
│   ├── src/
│   │   ├── features/
│   │   │   └── terminal/
│   │   │       ├── LinuxTerminal.jsx # xterm.js UI + controls
│   │   │       └── useV86.js     # React lifecycle hook for v86 VM
│   │   ├── pages/
│   │   │   ├── LinuxLabPage.jsx  # Interactive Linux Lab interface
│   │   │   └── DashboardPage.jsx # Learning overview with empty states
│   │   ├── services/
│   │   │   └── learningApi.js    # Client for Django learning endpoints
│   │   ├── components/Navbar.jsx # Navigation with Linux Lab links
│   │   └── App.jsx               # PushState client-side router
├── django/                       # Django JSON API backend
│   ├── config/
│   │   ├── settings.py           # Installed apps, templates, middleware
│   │   └── urls.py               # Route table: /api/* and /admin/*
│   ├── apps/
│   │   ├── learning/             # Linux Lab & Learning Platform
│   │   │   ├── models.py         # Plans, Lessons, Exercises, Assessments
│   │   │   ├── admin.py          # Django Admin inlines & filters
│   │   │   ├── api.py            # Learning API routes
│   │   │   ├── services.py       # Verification & scoring engine
│   │   │   └── tests.py          # Automated test suite
│   │   ├── accounts/             # User model & auth
│   │   └── catalogue/            # Distro catalogue
│   ├── db.sqlite3                # SQLite database
│   └── manage.py
```

---

## 2. Emulation Engine & Guest Image Specifications

- **Emulator**: `v86` (WebAssembly x86 PC emulator with JIT).
- **Terminal UI**: `@xterm/xterm` (v6.0) with `@xterm/addon-fit`.
- **Guest Architecture**: x86 32-bit (i686).
- **Guest Kernel**: Linux version `5.6.15` (Buildroot Linux), `bzImage` format (5,166,352 bytes).
- **Userland**: BusyBox (sh, coreutils, sed, awk, grep, find, vi, ps, top).
- **Serial Communication**: `console=ttyS0` serial bridge connected directly to xterm.js via `serial0-output-char` and `serial0_send`.
- **Asset Storage**: Static assets are bundled in `frontend/public/v86/` and served locally without external CDN dependencies.
- **Redistribution & Licensing**:
  - v86: BSD 2-Clause License
  - SeaBIOS: GNU LGPLv3
  - VGABios: GNU LGPLv2
  - Buildroot Linux Kernel: GNU GPLv2
  - xterm.js: MIT License

---

## 3. Learning & Assessment Infrastructure

The platform models are structured to support future curriculum additions without code alterations:

### Models
1. **`LearningPlan`**: Represents a curriculum track (e.g. "Linux Basics"). Holds publication status, difficulty, estimated hours, and ordering.
2. **`Lesson`**: Belongs to a plan. Supports markdown instructional content, ordering, publication status, and optional prerequisites.
3. **`PracticalExercise`**: Hands-on terminal challenges belonging to a lesson. Configures maximum attempts, points, instructions, and verification scripts.
4. **`VerificationRule`**: Granular criteria evaluated by the server:
   - `file_exists`: Checks if target file exists in the guest.
   - `file_not_exists`: Checks if target file does not exist.
   - `file_contains`: Tests file content for substrings or regex patterns.
   - `command_exit_zero`: Checks if an evidence command exited with 0.
   - `output_matches`: Checks if command output matches regex patterns.
   - `env_var_equals`: Checks environment variable value.
   - `custom_json`: Custom key-value validation.
5. **`Assessment`**: Quizzes or terminal assessments belonging to a plan or lesson. Configures passing percentage, time limits, and attempt limits.
6. **`AssessmentQuestion`**: Single choice, multiple choice, or terminal practical questions. Answer keys are stored server-side and never exposed to public endpoints.
7. **`UserLessonProgress`**: Tracks completed lessons and timestamps per user in SQLite.
8. **`ExerciseAttempt`**: Full log of user exercise submissions, raw evidence, rule evaluations, and earned scores.
9. **`AssessmentAttempt`**: Full log of assessment attempts, submitted answers, percentage scores, and pass/fail verdicts.
10. **`UserAchievement`**: Badges and milestones unlocked by learners.

---

## 4. API Endpoints Reference

All endpoints return `{ success: true, data: ... }` on success or `{ success: false, message: ... }` on error.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/learning/plans` | No | List published learning plans with progress summary |
| `GET` | `/api/learning/plans/<slug>` | No | Get plan detail and list of published lessons |
| `GET` | `/api/learning/lessons/<id>` | No | Get lesson detail, instructions, exercises, and assessments |
| `POST` | `/api/learning/lessons/<id>/complete` | Yes | Mark a lesson as completed |
| `GET` | `/api/learning/exercises/<id>` | No | Get exercise metadata (instructions, hint, points) |
| `POST` | `/api/learning/exercises/<id>/submit` | Yes | Submit guest evidence for server-side verification |
| `GET` | `/api/learning/exercises/<id>/history` | Yes | Get user's attempt history for an exercise |
| `GET` | `/api/learning/assessments/<id>` | No | Get assessment questions (**never leaks answer keys**) |
| `POST` | `/api/learning/assessments/<id>/submit` | Yes | Submit answers for server-side grading |
| `GET` | `/api/learning/assessments/<id>/history` | Yes | Get user's attempt history for an assessment |
| `GET` | `/api/learning/dashboard` | Yes | Get user's enrolled plans, stats, and achievements |

---

## 5. Exercise Verification & Grading Protocol

### The Controlled Protocol
1. **Guest Evidence Collection**:
   The frontend runs the exercise verification script inside the guest terminal via the serial bridge. Output is collected inside structured boundaries:
   ```json
   {
     "files": {
       "/home/learner/report.txt": { "exists": true, "content": "Sample output" }
     },
     "commands": {
       "grep -q learner /etc/passwd": { "exit_code": 0, "output": "" }
     }
   }
   ```
2. **Submission**:
   The frontend submits `{ evidence: { ... } }` to `POST /api/learning/exercises/<id>/submit/` along with the JWT bearer token.
3. **Server Validation**:
   - The Django backend checks user authentication.
   - Enforces `max_attempts` (rejects submission if exceeded).
   - Validates each `VerificationRule` against the raw evidence.
   - Calculates score according to `points_weight`.
   - Persists `ExerciseAttempt` in SQLite.
   - Updates `UserLessonProgress` if all exercises in the lesson are passed.
4. **Integrity Guarantee**:
   Client-side claims of success or manipulated score values are ignored; the server independently evaluates evidence against stored rules.

---

## 6. How to Add Curriculum Content via Django Admin

1. Log into the Django Admin at: [http://localhost:8010/admin/](http://localhost:8010/admin/)
   - Default credentials: `admin@distropedia.local` / `admin1234`
2. **Add a Learning Plan**:
   - Go to **Learning Plans** -> **Add Learning Plan**.
   - Fill in Title, Slug, Description, Difficulty, and Estimated Hours.
   - Check **Is published** when ready to show to users.
3. **Add Lessons**:
   - Under the plan (or via **Lessons** -> **Add Lesson**), define lesson Title, Slug, Order, and Markdown Instructions.
   - Set optional Prerequisites from other lessons.
4. **Add Practical Exercises**:
   - Attach an exercise to a lesson with points and instructions.
   - Add **Verification Rules** (e.g. `file_exists`, `file_contains`, `command_exit_zero`).
5. **Add Assessments**:
   - Create an assessment and add questions (Single Choice, Multiple Choice, or Terminal).
   - Enter options and designate `correct_answers` in JSON format (e.g. `["a"]` or `["a", "b"]`).
   - Answer keys remain strictly protected on the backend.

---

## 7. Setup & Run Instructions

### 1. Backend (Django)
```bash
cd django
source venv/bin/activate       # In Fish shell: source venv/bin/activate.fish
python manage.py migrate
python manage.py runserver 8010
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173/lab](http://localhost:5173/lab)** to access the live Linux Lab terminal.

### 3. Automated Verification Tests
```bash
cd django
venv/bin/python manage.py test apps.learning
```

