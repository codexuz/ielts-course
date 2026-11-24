# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript) + Supabase (PostgreSQL, Auth, Storage, RLS, RPCs) + shadcn/ui + Tailwind CSS, delivered as a fresh standalone project in `ielts-max/` with local JSON seed data and complete Supabase SQL schema & migrations.

## Users

- **Primary users — English & IELTS learners (A1–C1):** Students enrolled in a structured 24-day (or 48-day half-pace) intensive English and IELTS preparation cohort, studying daily across desktop and mobile devices.
- **Secondary users — Teachers, Assistants & Admins:** Course instructors managing student cohorts/groups, unlocking course days and reading articles, editing daily lessons and IELTS mock tests, reviewing homework/writing/speaking submissions, and monitoring weekly class points and leaderboards.

## Product Purpose

**IELTS Max** delivers an intensive, structured daily English mastery and IELTS preparation platform that combines five core skills every day—podcast transcription, article reading & summarization, video gap-fill listening, IELTS speaking practice with audio recording and vocabulary quizzes, and IELTS Task 2 writing—alongside computer-delivered IELTS Listening/Reading mock exams, a leveled Reading Room, a spaced-repetition Word Bank, and a full Teacher/Admin CMS.

## Positioning

Unlike generic flashcard apps or static PDF courses, IELTS Max sequences 24 cohesive thematic days (adaptable to a 48-day split pace) where every skill builds on real media—podcasts, articles, TED-Ed talks, short films, editorial cartoons, and full computer-delivered IELTS mock tests—paired with cohort accountability (shared speaking recordings, weekly points, and teacher-controlled progression).

## Operating Context

- **Student daily workflow:** Log in -> complete Placement Test -> select Group & Pace (24-day or 48-day) -> complete daily tasks (Words & Grammar, Podcast Transcription, Article Summary, Video Gap-Fill, Speaking Recording & 3-part Vocab Quiz, IELTS Task 2 Writing, Film & Cartoon Reflection, Daily Reflection) -> submit day to unlock the next -> take full IELTS Listening & Reading mock exams on Test Days (Days 6, 12, 18, 24) -> review words in My Words SRS and read leveled articles in Reading Room.
- **Admin/Teacher workflow:** Manage course content across all 24 days, edit IELTS exams and answer keys, organize student groups and assistants, manually unlock days or Reading Room articles per student/group, review student submissions/recordings/writing feedback, and track class progress and weekly rankings.
- **Device usage:** Used heavily on both desktop (long-form reading, writing, computer-delivered split-pane IELTS exams, admin CMS) and mobile phones (daily study on the go, audio listening, flashcards, speaking recording).

## Capabilities and Constraints

- **Full feature parity** with the reference 24-day English course platform:
  - 24 themed daily modules (`days`) + 48-day split pace mode (`grammar2` second challenge set).
  - Placement test + 8 full IELTS Listening & Reading exams (Days 6, 12, 18, 24) with timer, highlight/notes tools, flag questions, band calculation, and full answer review.
  - Reading Room (10 topics, 43 articles across A2–C2 levels, read-aloud, interactive exercises).
  - My Words SRS word bank with dictionary lookup, Uzbek/English meanings, IPA, and 6 practice modes (Flashcards, Meaning quiz, Fill the gap, Listen & spell, Use it, Match).
  - Progress dashboard, streaks, achievements, homework timer, and weekly Class Ranking leaderboard.
  - Full **Admin Panel** (`/admin`) with Course Content CMS, IELTS Test Editor, Student & Group management, Day/Reading Unlock controls, Submissions & Writing Review, and Class Analytics.
- **Standalone Supabase architecture:** Complete SQL migrations + RLS + RPCs + seed script, plus seamless local JSON data fallback and role switcher (inferred from skipped A3) so both Student and Admin views can be fully explored and tested locally without requiring an active remote teacher account.
- **Brand identity (inferred from project name & skipped A2):** Named **IELTS Max**, preserving full course structure and educational content parity.

## Evidence on Hand

- Extracted real database dump in `ace_english_database/` (`days.json` with all 24 days, `tests.json` with all 9 exams, `vocab.json`, `submissions.json`, `writing_feedback.json`, `groups.json`, `rpc_class_ranking.json`, `rpc_my_answer_keys.json`).
- Extracted static course modules (`films.js`, `grammar2.js`, `reading.js` topics/catalog) from the reference web app.
- Live media asset URLs (podcasts, PDFs, cartoons, motivation banners, YouTube videos) referenced inside `days.json` and `tests.json`.

## Product Principles

1. **Task clarity over decorative noise:** Students study for hours and take timed IELTS exams; every screen must keep progress, current task state, and primary actions unmistakable.
2. **True cross-device fluency:** Mobile learners and desktop exam-takers are first-class citizens—split-pane IELTS reading on desktop transforms cleanly into tabbed/stacked views on mobile, and admin tables adapt cleanly via container queries.
3. **Zero-friction data continuity:** Autosave drafts, instant feedback on exercises, and seamless parity between local seeded JSON mode and live Supabase PostgreSQL persistence.
4. **Teacher control without clutter:** Admin tools mirror the exact mental model of the course (Days, Exams, Students & Groups, Submissions, Unlocks) with fast editing and safe confirmation flows.

## Accessibility & Inclusion

- WCAG AA contrast across light and dark modes (respecting OS color-scheme with manual settings override).
- Minimum 44×44px touch targets on coarse-pointer devices and full keyboard navigation across tabs, exam question palettes, dialogs, and admin data tables.
- Clean typography scale and reading comfort controls for long passages and multi-hour study sessions.
