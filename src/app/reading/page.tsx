"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Lock,
  Plus,
  Send,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import type { ReadingArticleData, ReadingArticleLevel } from "@/lib/types";
import { cn, normalizeAnswer } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type CefrLevel = "A2" | "B1" | "B2" | "C1" | "C2";
type ExTab = "words" | "gaps" | "grammar" | "tfng" | "short" | "mcq";

export default function ReadingRoomPage() {
  const {
    isAdmin,
    readingTopics,
    readingTopicsSelected,
    readingUnlocked,
    readingRequests,
    readingProgress,
    setReadingTopics,
    requestReadingArticle,
    saveReadingProgress,
    addVocabWord,
  } = useApp();

  const [activeTopicKey, setActiveTopicKey] = useState<string>("all");
  const [openArticleMeta, setOpenArticleMeta] = useState<{
    id: string;
    title: string;
    subtopic: string;
  } | null>(null);
  const [articleData, setArticleData] = useState<ReadingArticleData | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [level, setLevel] = useState<CefrLevel>("B1");
  const [exTab, setExTab] = useState<ExTab>("words");
  const [speaking, setSpeaking] = useState(false);

  // Exercise local state
  const [gapInputs, setGapInputs] = useState<Record<number, string>>({});
  const [grammarPick, setGrammarPick] = useState<Record<number, number>>({});
  const [tfngPick, setTfngPick] = useState<Record<number, string>>({});
  const [shortInputs, setShortInputs] = useState<Record<number, string>>({});
  const [mcqPick, setMcqPick] = useState<Record<number, number>>({});
  const [showExp, setShowExp] = useState<Record<string, boolean>>({});
  const [savedToast, setSavedToast] = useState("");

  const openArticle = async (id: string, title: string, subtopic: string) => {
    setOpenArticleMeta({ id, title, subtopic });
    setLoadingArticle(true);
    setGapInputs({});
    setGrammarPick({});
    setTfngPick({});
    setShortInputs({});
    setMcqPick({});
    setShowExp({});
    try {
      const res = await fetch(`/api/reading/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = (await res.json()) as ReadingArticleData;
        setArticleData(json);
      }
    } finally {
      setLoadingArticle(false);
    }
  };

  const stripMarkup = (text: string) =>
    text.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");

  const toggleReadAloud = (paragraphs: string[]) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(paragraphs.map(stripMarkup).join(" "));
    utter.lang = "en-GB";
    utter.rate = 0.96;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const toggleTopicChoice = (key: string) => {
    const next = readingTopicsSelected.includes(key)
      ? readingTopicsSelected.filter((t) => t !== key)
      : [...readingTopicsSelected, key];
    setReadingTopics(next);
  };

  const levelData: ReadingArticleLevel | null = articleData ? articleData[level] : null;

  // Interactive Article Reader View
  if (openArticleMeta) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setSpeaking(false);
                  setOpenArticleMeta(null);
                  setArticleData(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Reading Room
              </button>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                {openArticleMeta.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="group" aria-label="CEFR reading level">
                {(["A2", "B1", "B2", "C1", "C2"] as CefrLevel[]).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    className={cn(
                      "rounded px-2.5 py-1 font-mono text-xs font-semibold cursor-pointer",
                      level === lv
                        ? "bg-shell text-shell-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lv}
                  </button>
                ))}
              </div>

              {levelData ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => toggleReadAloud(levelData.text)}
                >
                  {speaking ? (
                    <>
                      <VolumeX className="h-4 w-4" aria-hidden="true" />
                      Stop Audio
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                      Read Aloud
                    </>
                  )}
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  saveReadingProgress(openArticleMeta.id, level, true, 100);
                  setSavedToast(`Marked ${openArticleMeta.title} (${level}) as completed.`);
                  setTimeout(() => setSavedToast(""), 2500);
                }}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Mark Finished
              </Button>
            </div>
          </div>

          {savedToast ? (
            <p role="status" className="rounded-md border border-success/30 bg-success-bg px-3.5 py-2 text-xs font-medium text-success">
              {savedToast}
            </p>
          ) : null}

          {loadingArticle || !levelData ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Loading {level} edition...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Reading Passage */}
              <article className="lg:col-span-6 rounded-lg border border-border bg-card p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <Badge variant="outline" className="font-mono">
                    CEFR {level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{openArticleMeta.subtopic}</span>
                </div>
                <div className="space-y-4 font-serif text-[16px] leading-[1.8] text-foreground max-w-[68ch]">
                  {levelData.text.map((para, i) => {
                    const tokens = para.split(/(\[\[[^\]]+\]\])/g);
                    return (
                      <p key={i}>
                        {tokens.map((tok, j) => {
                          const m = tok.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
                          if (!m) return <React.Fragment key={j}>{tok}</React.Fragment>;
                          const displayWord = m[1];
                          const baseWord = m[2] || m[1];
                          const matchEntry = levelData.words.find(
                            ([w]) => w.toLowerCase() === baseWord.toLowerCase() || w.toLowerCase() === displayWord.toLowerCase()
                          );
                          return (
                            <button
                              key={j}
                              type="button"
                              title={
                                matchEntry
                                  ? `${matchEntry[0]}: ${matchEntry[1]} (click to save)`
                                  : `Click to save "${baseWord}" to My Words`
                              }
                              onClick={() => {
                                addVocabWord({
                                  word: matchEntry?.[0] || baseWord,
                                  en: matchEntry?.[1] || `From Reading Room: ${openArticleMeta.title}`,
                                  example: matchEntry?.[2] || null,
                                  status: "new",
                                });
                                setSavedToast(
                                  matchEntry
                                    ? `Saved "${matchEntry[0]}" (${matchEntry[1]}) to My Words.`
                                    : `Saved "${baseWord}" to My Words.`
                                );
                                setTimeout(() => setSavedToast(""), 2800);
                              }}
                              className="inline min-h-0 rounded px-0.5 font-medium text-primary underline decoration-primary/45 decoration-dotted underline-offset-4 hover:bg-accent cursor-pointer"
                            >
                              {displayWord}
                            </button>
                          );
                        })}
                      </p>
                    );
                  })}
                </div>
              </article>

              {/* Interactive Exercises Curtain */}
              <section className="lg:col-span-6 rounded-lg border border-border bg-card p-5 space-y-4">
                <div role="tablist" aria-label="Article exercises" className="task-tablist">
                  {(
                    [
                      ["words", "Key Words"],
                      ["gaps", "Gaps"],
                      ["grammar", "Grammar"],
                      ["tfng", "T/F/NG"],
                      ["short", "Short"],
                      ["mcq", "MCQ"],
                    ] as [ExTab, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={exTab === id}
                      onClick={() => setExTab(id)}
                      className="task-tab cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {exTab === "words" ? (
                  <div className="space-y-3">
                    {levelData.words.map(([w, def, ex], i) => (
                      <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground">{w}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              addVocabWord({ word: w, en: def, example: ex, status: "new" });
                              setSavedToast(`Saved "${w}" to My Words.`);
                              setTimeout(() => setSavedToast(""), 2000);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            Save
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{def}</p>
                        <p className="text-xs italic text-foreground/80 font-serif">&ldquo;{ex}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {exTab === "gaps" ? (
                  <div className="space-y-3">
                    {levelData.gaps.map(([sent, ans], i) => {
                      const val = gapInputs[i] || "";
                      const ok = val.trim() && normalizeAnswer(val) === normalizeAnswer(ans);
                      return (
                        <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-2">
                          <p className="text-sm">{sent}</p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={val}
                              onChange={(e) => setGapInputs((p) => ({ ...p, [i]: e.target.value }))}
                              placeholder="Missing word..."
                              className="max-w-xs"
                            />
                            {ok ? (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowExp((p) => ({ ...p, [`gap-${i}`]: !p[`gap-${i}`] }))}
                              >
                                Answer
                              </Button>
                            )}
                          </div>
                          {showExp[`gap-${i}`] ? (
                            <p className="text-xs font-medium text-primary">Answer: {ans}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {exTab === "grammar" ? (
                  <div className="space-y-3">
                    {levelData.grammar.map(([prompt, opts, correctIdx, why], i) => {
                      const picked = grammarPick[i];
                      return (
                        <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-2">
                          <p className="text-sm font-medium">{prompt}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {opts.map((opt, oi) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setGrammarPick((p) => ({ ...p, [i]: oi }))}
                                className={cn(
                                  "rounded border px-2.5 py-1.5 text-xs text-left cursor-pointer",
                                  picked === oi
                                    ? oi === correctIdx
                                      ? "border-success bg-success-bg text-success font-semibold"
                                      : "border-destructive bg-destructive/10 text-destructive font-semibold"
                                    : "border-border bg-card hover:bg-muted"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {picked !== undefined ? (
                            <p className="text-xs text-muted-foreground">{why}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {exTab === "tfng" ? (
                  <div className="space-y-3">
                    {levelData.tfng.map(([stmt, ans, why], i) => {
                      const picked = tfngPick[i];
                      const ok = picked === ans;
                      return (
                        <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-2">
                          <p className="text-sm">{stmt}</p>
                          <div className="flex gap-2">
                            {["T", "F", "NG"].map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => setTfngPick((p) => ({ ...p, [i]: code }))}
                                className={cn(
                                  "rounded border px-3 py-1 text-xs font-semibold cursor-pointer",
                                  picked === code
                                    ? ok
                                      ? "border-success bg-success-bg text-success"
                                      : "border-destructive bg-destructive/10 text-destructive"
                                    : "border-border bg-card hover:bg-muted"
                                )}
                              >
                                {code === "T" ? "True" : code === "F" ? "False" : "Not Given"}
                              </button>
                            ))}
                          </div>
                          {picked ? (
                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                              {ok ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                              )}
                              <span>
                                <strong>{ans}</strong> — {why}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {exTab === "short" ? (
                  <div className="space-y-3">
                    {levelData.short.map(([q, ans, why], i) => {
                      const val = shortInputs[i] || "";
                      const ok = val.trim() && normalizeAnswer(val) === normalizeAnswer(ans);
                      return (
                        <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-2">
                          <p className="text-sm font-medium">{q}</p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={val}
                              onChange={(e) => setShortInputs((p) => ({ ...p, [i]: e.target.value }))}
                              placeholder="Your answer..."
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setShowExp((p) => ({ ...p, [`sh-${i}`]: !p[`sh-${i}`] }))}
                            >
                              Check
                            </Button>
                          </div>
                          {showExp[`sh-${i}`] || ok ? (
                            <p className="text-xs text-muted-foreground">
                              <strong className={ok ? "text-success" : "text-primary"}>{ans}</strong> — {why}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {exTab === "mcq" ? (
                  <div className="space-y-3">
                    {levelData.mcq.map(([q, opts, correctIdx, why], i) => {
                      const picked = mcqPick[i];
                      return (
                        <div key={i} className="rounded-md border border-border bg-background p-3.5 space-y-2">
                          <p className="text-sm font-medium">{q}</p>
                          <div className="space-y-1.5">
                            {opts.map((opt, oi) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setMcqPick((p) => ({ ...p, [i]: oi }))}
                                className={cn(
                                  "w-full rounded border px-3 py-2 text-xs text-left cursor-pointer",
                                  picked === oi
                                    ? oi === correctIdx
                                      ? "border-success bg-success-bg text-success font-semibold"
                                      : "border-destructive bg-destructive/10 text-destructive font-semibold"
                                    : "border-border bg-card hover:bg-muted"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {picked !== undefined ? (
                            <p className="text-xs text-muted-foreground">{why}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // Reading Room Library Grid
  const visibleTopics =
    activeTopicKey === "all"
      ? readingTopics
      : readingTopics.filter((t) => t.key === activeTopicKey);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="border-b border-border pb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leveled Reading Room</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              10 IELTS themes · 43 articles · Switch live between A2, B1, B2, C1, and C2 editions with audio read-aloud and interactive exercises.
            </p>
          </div>
          <Badge variant="outline" className="font-mono self-start sm:self-end">
            {Object.values(readingProgress).filter((p) => p.completed).length} / 43 completed
          </Badge>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reading topics">
          <button
            type="button"
            onClick={() => setActiveTopicKey("all")}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors",
              activeTopicKey === "all"
                ? "border-shell bg-shell text-shell-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            All Topics (10)
          </button>
          {readingTopics.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTopicKey(t.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
                activeTopicKey === t.key
                  ? "border-shell bg-shell text-shell-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Topic Sections */}
        <div className="space-y-6">
          {visibleTopics.map((topic) => {
            const followed = readingTopicsSelected.includes(topic.key);
            return (
              <section key={topic.key} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="text-base font-bold">{topic.name}</h2>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({topic.arts.length} articles)
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={followed ? "secondary" : "outline"}
                    onClick={() => toggleTopicChoice(topic.key)}
                  >
                    {followed ? "Following Topic" : "Follow & Unlock #1"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topic.arts.map(([artId, subtopic, title, , blurb], idx) => {
                    const unlocked =
                      isAdmin ||
                      readingUnlocked.includes(artId) ||
                      (followed && idx === 0);
                    const done = readingProgress[artId]?.completed;
                    const pendingReq = readingRequests.some(
                      (r) => r.article_id === artId && r.status === "pending"
                    );

                    return (
                      <div
                        key={artId}
                        className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-primary">{subtopic}</span>
                            {done ? (
                              <Badge variant="success">Done</Badge>
                            ) : unlocked ? (
                              <Badge variant="outline">A2–C2</Badge>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" aria-hidden="true" />
                                Locked
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold leading-snug">{title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{blurb}</p>
                        </div>

                        {unlocked ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openArticle(artId, title, subtopic)}
                          >
                            Read Article
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={pendingReq}
                            onClick={() => requestReadingArticle(artId, title)}
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            {pendingReq ? "Permission Requested" : "Request Teacher Unlock"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
