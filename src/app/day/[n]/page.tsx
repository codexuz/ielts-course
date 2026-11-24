"use client";

import React, { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Film,
  Headphones,
  Lock,
  Mic,
  PenTool,
  Sparkles,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import { countWords, formatDuration, isTestDay, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PodcastTask } from "@/components/day/podcast-task";
import { ArticleTask } from "@/components/day/article-task";
import { WatchingTask } from "@/components/day/watching-task";
import { SpeakingTask } from "@/components/day/speaking-task";
import { WritingTask } from "@/components/day/writing-task";
import { FilmCartoonTask, GrammarTask } from "@/components/day/grammar-film-tasks";

type TaskTabId =
  | "grammar"
  | "podcast"
  | "article"
  | "watching"
  | "speaking"
  | "writing"
  | "film"
  | "exams"
  | "reflect";

export default function DayWorkspacePage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n: nParam } = use(params);
  const dayNum = Math.min(24, Math.max(1, Number(nParam) || 1));

  const {
    profile,
    isAdmin,
    days,
    grammar2,
    films,
    cartoons,
    filmSamples,
    tests,
    testResults,
    writingFeedback,
    answerKeys,
    homeworkTime,
    isDayOpen,
    getSubmission,
    saveSubmission,
    addStudySeconds,
  } = useApp();

  const day = days.find((d) => d.n === dayNum);
  const open = isDayOpen(dayNum);
  const submission = getSubmission(dayNum);
  const submitted = submission?.status === "submitted";
  const dayTests = tests.filter((t) => t.day === dayNum);
  const dayKey = answerKeys.find((k) => k.n === dayNum);
  const dayWritingFb = writingFeedback.find(
    (w) => w.n === dayNum && (w.user_id === profile.id || isAdmin)
  );

  const [activeTab, setActiveTab] = useState<TaskTabId>("grammar");
  const [submitBanner, setSubmitBanner] = useState("");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Track study time every 15 seconds while workspace is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      addStudySeconds(dayNum, 15);
    }, 15000);
    return () => clearInterval(id);
  }, [dayNum, open, addStudySeconds]);

  const selectTab = (id: TaskTabId) => {
    setActiveTab(id);
    tabRefs.current[id]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  };

  if (!day) {
    return (
      <AppShell>
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <h1 className="text-xl font-bold">Day not found</h1>
          <Button asChild>
            <Link href="/">Back to 24-Day Passport</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!open) {
    return (
      <AppShell>
        <div className="rounded-lg border border-border bg-card p-8 max-w-lg mx-auto text-center space-y-4">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="text-xl font-bold">Day {padDay(dayNum)} is locked</h1>
          <p className="text-sm text-muted-foreground">
            Submit Day {padDay(dayNum - 1)} first, or ask your teacher to unlock Day {padDay(dayNum)} in the Admin Panel.
          </p>
          <Button asChild>
            <Link href="/">Return to Course Passport</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const tabs: Array<{ id: TaskTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "grammar", label: "Words & Grammar", icon: Sparkles },
    { id: "podcast", label: "Podcast", icon: Headphones },
    { id: "article", label: "Article", icon: BookOpen },
    { id: "watching", label: "Watching", icon: Video },
    { id: "speaking", label: "Speaking", icon: Mic },
    ...(day.data.writing?.prompt ? [{ id: "writing" as TaskTabId, label: "Writing", icon: PenTool }] : []),
    { id: "film", label: "Film & Cartoon", icon: Film },
    ...(dayTests.length > 0 ? [{ id: "exams" as TaskTabId, label: "IELTS Exams", icon: ClipboardCheck }] : []),
    { id: "reflect", label: "Reflect & Submit", icon: CheckCircle2 },
  ];

  const practiceAnswers =
    (submission?.practice?.grammar as Record<string, string> | undefined) || {};
  const videoAnswers = (submission?.answers as Record<string, string>) || {};
  const speakAnswers = (submission?.speak_answers as Record<string, string>) || {};
  const podcastDraft = submission?.podcast || {};
  const articleDraft = submission?.article || "";
  const writingDraft = typeof submission?.writing === "string" ? submission.writing : "";
  const filmDraft = submission?.film_text || "";
  const cartoonDraft = submission?.cartoon_text || "";
  const reflectionDraft = submission?.reflection || "";
  const reflectionWords = countWords(reflectionDraft);

  const handleSubmitDay = () => {
    if (reflectionWords < 20 && !isAdmin) {
      setSubmitBanner("Please write at least 20 words in your Daily Reflection before stamping this day.");
      return;
    }
    saveSubmission(dayNum, { reflection: reflectionDraft }, true);
    setSubmitBanner(`Day ${padDay(dayNum)} stamped! Day ${padDay(Math.min(24, dayNum + 1))} is now unlocked.`);
  };

  const tabHasWork: Partial<Record<TaskTabId, boolean>> = {
    grammar: Object.keys(practiceAnswers).length > 0,
    podcast: Object.values(podcastDraft).some((v) => v.trim().length > 0),
    article: articleDraft.trim().length > 20,
    watching: Object.values(videoAnswers).some((v) => v.trim().length > 0),
    speaking: Object.values(speakAnswers).some((v) => v.trim().length > 0),
    writing: writingDraft.trim().length > 20,
    film: filmDraft.trim().length > 10 || cartoonDraft.trim().length > 10,
    reflect: reflectionWords >= 20,
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Day Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Passport
              </Link>
              <span className="text-muted-foreground">/</span>
              <Badge variant="default" className="font-mono">
                DAY {padDay(dayNum)}
              </Badge>
              {isTestDay(dayNum) ? (
                <Badge variant="milestone">
                  <Award className="h-3 w-3" aria-hidden="true" />
                  Test Day
                </Badge>
              ) : null}
              {submitted ? (
                <Badge variant="success">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Submitted
                </Badge>
              ) : null}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {day.data.title || `Day ${padDay(dayNum)}`}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground tabular">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {formatDuration(homeworkTime[dayNum] || 0)}
            </span>
            {dayNum > 1 ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/day/${dayNum - 1}`}>Prev</Link>
              </Button>
            ) : null}
            {dayNum < 24 && isDayOpen(dayNum + 1) ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/day/${dayNum + 1}`}>
                  Next
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Single-Row Scrollable Accessible Task Tablist */}
        <div
          role="tablist"
          aria-label={`Day ${dayNum} skills`}
          className="task-tablist"
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const selected = activeTab === t.id;
            const hasWork = tabHasWork[t.id];
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                onClick={() => selectTab(t.id)}
                className="task-tab inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.label}</span>
                {hasWork ? (
                  <span
                    aria-label="In progress"
                    className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Active Task Panel */}
        <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "grammar" ? (
            <GrammarTask
              day={day}
              grammar2={grammar2[String(dayNum)]}
              pace={profile.pace}
              answers={practiceAnswers}
              onChange={(next) =>
                saveSubmission(dayNum, {
                  practice: { ...(submission?.practice || {}), grammar: next },
                })
              }
            />
          ) : null}

          {activeTab === "podcast" ? (
            <PodcastTask
              day={day}
              value={podcastDraft}
              onChange={(next) => saveSubmission(dayNum, { podcast: next })}
              submitted={submitted}
            />
          ) : null}

          {activeTab === "article" ? (
            <ArticleTask
              day={day}
              value={articleDraft}
              onChange={(next) => saveSubmission(dayNum, { article: next })}
            />
          ) : null}

          {activeTab === "watching" ? (
            <WatchingTask
              day={day}
              answers={videoAnswers}
              onChange={(next) => saveSubmission(dayNum, { answers: next })}
              answerKey={dayKey?.answers}
              canRevealKey={submitted || isAdmin}
            />
          ) : null}

          {activeTab === "speaking" ? (
            <SpeakingTask
              day={day}
              speakAnswers={speakAnswers}
              onChange={(next) => saveSubmission(dayNum, { speak_answers: next })}
              answerKey={dayKey?.speak_answers}
              canRevealKey={submitted || isAdmin}
            />
          ) : null}

          {activeTab === "writing" ? (
            <WritingTask
              day={day}
              value={writingDraft}
              onChange={(next) => saveSubmission(dayNum, { writing: next })}
              existingFeedback={dayWritingFb}
            />
          ) : null}

          {activeTab === "film" ? (
            <FilmCartoonTask
              day={day}
              film={films[dayNum - 1]}
              cartoon={cartoons[dayNum - 1]}
              sampleText={filmSamples[String(dayNum)]}
              filmText={filmDraft}
              cartoonText={cartoonDraft}
              onFilmChange={(v) => saveSubmission(dayNum, { film_text: v })}
              onCartoonChange={(v) => saveSubmission(dayNum, { cartoon_text: v })}
            />
          ) : null}

          {activeTab === "exams" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayTests.map((t) => {
                const res = testResults.find((tr) => tr.test_id === t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="milestone" className="uppercase">
                          {t.kind}
                        </Badge>
                        {res?.status === "finished" ? (
                          <Badge variant="success" className="font-mono">
                            {res.score}/{res.total} · Band {res.band?.toFixed(1)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">To do</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold">{t.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Computer-delivered IELTS interface with official timer, highlighting, notes, and automatic Band calculation.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/exams/${t.id}`}>
                        {res?.status === "finished" ? "Review / Retake Exam" : "Launch Timed Exam"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === "reflect" ? (
            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 max-w-2xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Daily Reflection &amp; Submission</h2>
                <Badge variant={reflectionWords >= 20 ? "success" : "outline"} className="font-mono">
                  {reflectionWords} / 20+ words
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Write a short reflection on what you learned today, any difficult vocabulary or grammar patterns, and what you want to focus on tomorrow.
              </p>

              <Textarea
                rows={6}
                value={reflectionDraft}
                onChange={(e) => saveSubmission(dayNum, { reflection: e.target.value })}
                placeholder="Today I practised..."
              />

              {submission?.teacher_note ? (
                <div className="rounded-md border border-primary/30 bg-accent p-3.5 text-sm">
                  <p className="font-semibold text-accent-foreground">Teacher Note</p>
                  <p className="text-foreground mt-1">{submission.teacher_note}</p>
                </div>
              ) : null}

              {submitBanner ? (
                <p
                  role="status"
                  className="rounded-md border border-border bg-muted px-3.5 py-2.5 text-sm font-medium text-foreground"
                >
                  {submitBanner}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  {submitted
                    ? `Stamped on ${new Date(submission?.submitted_at || Date.now()).toLocaleDateString()}`
                    : "Submitting unlocks the next day and reveals answer keys."}
                </span>
                <Button type="button" size="lg" onClick={handleSubmitDay}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {submitted ? "Update Submission" : `Submit & Stamp Day ${padDay(dayNum)}`}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
