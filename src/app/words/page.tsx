"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookMarked,
  Check,
  CheckCircle2,
  Ear,
  Grid2X2,
  Layers,
  ListChecks,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import type { VocabItem } from "@/lib/types";
import { cn, normalizeAnswer } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PracticeMode = "flashcards" | "quiz" | "gap" | "spell" | "match" | null;

export default function MyWordsPage() {
  const { vocab, addVocabWord, updateVocabStatus, deleteVocabWord } = useApp();

  const [filter, setFilter] = useState<"all" | "due" | "new" | "learning" | "mastered">("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // Add word form
  const [newWord, setNewWord] = useState("");
  const [newPos, setNewPos] = useState("");
  const [newIpa, setNewIpa] = useState("");
  const [newUz, setNewUz] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newExample, setNewExample] = useState("");

  // Focused practice session state
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(null);
  const [sessionDeck, setSessionDeck] = useState<VocabItem[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [sessionDone, setSessionDone] = useState(false);

  const [flipped, setFlipped] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [answerState, setAnswerState] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Match-pairs mode state
  const [matchLeft, setMatchLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchWrongId, setMatchWrongId] = useState<string | null>(null);

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const counts = useMemo(
    () => ({
      all: vocab.length,
      due: vocab.filter((v) => v.status !== "mastered").length,
      new: vocab.filter((v) => v.status === "new").length,
      learning: vocab.filter((v) => v.status === "learning").length,
      mastered: vocab.filter((v) => v.status === "mastered").length,
    }),
    [vocab]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vocab.filter((v) => {
      if (filter === "due" && v.status === "mastered") return false;
      if (filter !== "all" && filter !== "due" && v.status !== filter) return false;
      if (!q) return true;
      return (
        v.word.toLowerCase().includes(q) ||
        (v.uz || "").toLowerCase().includes(q) ||
        (v.en || "").toLowerCase().includes(q) ||
        (v.example || "").toLowerCase().includes(q)
      );
    });
  }, [vocab, filter, query]);

  const startPractice = (mode: Exclude<PracticeMode, null>) => {
    let pool = vocab.filter((v) => v.status !== "mastered");
    if (pool.length === 0) pool = [...vocab];
    if (mode === "quiz" || mode === "match") {
      pool = pool.filter((v) => Boolean(v.uz || v.en));
    }
    if (mode === "gap") {
      const withEx = pool.filter((v) => Boolean(v.example));
      if (withEx.length > 0) pool = withEx;
    }

    const deck = pool.slice(0, mode === "match" ? 6 : 12);
    setSessionDeck(deck);
    setPracticeMode(mode);
    setCardIdx(0);
    setSessionStats({ correct: 0, wrong: 0 });
    setSessionDone(false);
    setFlipped(false);
    setTextInput("");
    setAnswerState(null);
    setMatchLeft(null);
    setMatchedIds([]);
    setMatchWrongId(null);
  };

  const exitPractice = () => {
    setPracticeMode(null);
    setSessionDone(false);
    setAnswerState(null);
  };

  const currentCard: VocabItem | undefined = sessionDeck[cardIdx];

  const advanceCard = (correct: boolean) => {
    if (currentCard) updateVocabStatus(currentCard.id, correct);
    setSessionStats((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));
    setFlipped(false);
    setTextInput("");
    setAnswerState(null);
    if (cardIdx + 1 >= sessionDeck.length) {
      setSessionDone(true);
    } else {
      setCardIdx((i) => i + 1);
    }
  };

  const quizOptions = useMemo(() => {
    if (!currentCard) return [];
    const distractors = vocab
      .filter((v) => v.id !== currentCard.id && (v.uz || v.en))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 3);
    return [currentCard, ...distractors].sort((a, b) =>
      (a.uz || a.en || a.word).localeCompare(b.uz || b.en || b.word)
    );
  }, [currentCard, vocab]);

  const matchRightOptions = useMemo(() => {
    return [...sessionDeck].sort((a, b) =>
      (a.uz || a.en || a.word).localeCompare(b.uz || b.en || b.word)
    );
  }, [sessionDeck]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    addVocabWord({
      word: newWord.trim(),
      pos: newPos.trim() || null,
      ipa: newIpa.trim() || null,
      uz: newUz.trim() || null,
      en: newEn.trim() || null,
      example: newExample.trim() || null,
      status: "new",
    });
    setNewWord("");
    setNewPos("");
    setNewIpa("");
    setNewUz("");
    setNewEn("");
    setNewExample("");
    setAddOpen(false);
  };

  const blankSentence = (item: VocabItem) => {
    if (!item.example) return `Type the English word meaning: "${item.uz || item.en || ""}"`;
    const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}[a-z]*\\b`, "gi");
    const replaced = item.example.replace(re, "________");
    return replaced === item.example ? `${item.example} (target: ________)` : replaced;
  };

  const practiceButtons: Array<{
    id: Exclude<PracticeMode, null>;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled: boolean;
  }> = [
    {
      id: "flashcards",
      label: "Flashcards",
      desc: "Active recall flip deck",
      icon: Layers,
      disabled: vocab.length === 0,
    },
    {
      id: "quiz",
      label: "Meaning Quiz",
      desc: "4-option recognition",
      icon: ListChecks,
      disabled: vocab.filter((v) => v.uz || v.en).length < 2,
    },
    {
      id: "gap",
      label: "Fill the Gap",
      desc: "Real context sentences",
      icon: PenLine,
      disabled: vocab.length === 0,
    },
    {
      id: "spell",
      label: "Listen & Spell",
      desc: "Audio dictation drill",
      icon: Ear,
      disabled: vocab.length === 0,
    },
    {
      id: "match",
      label: "Match Pairs",
      desc: "Fast meaning pairing",
      icon: Grid2X2,
      disabled: vocab.filter((v) => v.uz || v.en).length < 3,
    },
  ];

  // ============================================================================
  // FOCUSED PRACTICE MODE (Hides search/filters and Word Bank list completely)
  // ============================================================================
  if (practiceMode) {
    const total = sessionDeck.length;
    const progressPct =
      practiceMode === "match"
        ? Math.round((matchedIds.length / Math.max(1, total)) * 100)
        : sessionDone
        ? 100
        : Math.round((cardIdx / Math.max(1, total)) * 100);

    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Focused Session Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={exitPractice}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Word Bank
              </Button>
              <div>
                <h1 className="text-lg font-bold tracking-tight capitalize">
                  {practiceButtons.find((b) => b.id === practiceMode)?.label} Practice
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs tabular">
              <Badge variant="success">{sessionStats.correct} correct</Badge>
              {sessionStats.wrong > 0 ? (
                <Badge variant="destructive">{sessionStats.wrong} review</Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground tabular">
              <span>
                {practiceMode === "match"
                  ? `${matchedIds.length} / ${total} pairs matched`
                  : sessionDone
                  ? `Session complete (${total}/${total})`
                  : `Card ${cardIdx + 1} of ${total}`}
              </span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Session Completed Summary */}
          {sessionDone ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-5 shadow-[0_1px_3px_rgba(15,37,55,0.06)]">
              <CheckCircle2 className="h-10 w-10 mx-auto text-primary" aria-hidden="true" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Practice Round Complete</h2>
                <p className="text-sm text-muted-foreground">
                  You reviewed{" "}
                  <span className="font-mono font-semibold text-foreground tabular">{total}</span>{" "}
                  words with{" "}
                  <span className="font-mono font-semibold text-success tabular">
                    {Math.round(
                      (sessionStats.correct / Math.max(1, sessionStats.correct + sessionStats.wrong)) *
                        100
                    )}
                    %
                  </span>{" "}
                  accuracy. Spaced-repetition intervals have been updated.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button type="button" onClick={() => startPractice(practiceMode)}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Practice Again
                </Button>
                <Button type="button" variant="outline" onClick={exitPractice}>
                  Return to Word Bank
                </Button>
              </div>
            </div>
          ) : practiceMode === "match" ? (
            /* Match Pairs Mode */
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(15,37,55,0.06)]">
              <p className="text-sm text-muted-foreground">
                Select a word on the left, then click its matching translation or definition on the right.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  {sessionDeck.map((item) => {
                    const done = matchedIds.includes(item.id);
                    const selected = matchLeft === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={done}
                        onClick={() => {
                          setMatchLeft(item.id);
                          setMatchWrongId(null);
                        }}
                        className={cn(
                          "w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors cursor-pointer",
                          done
                            ? "border-success/30 bg-success-bg/50 text-success opacity-60 cursor-default"
                            : selected
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{item.word}</span>
                          {done ? <Check className="h-4 w-4 shrink-0" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {matchRightOptions.map((item) => {
                    const done = matchedIds.includes(item.id);
                    const wrong = matchWrongId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={done || !matchLeft}
                        onClick={() => {
                          if (!matchLeft) return;
                          if (matchLeft === item.id) {
                            const nextMatched = [...matchedIds, item.id];
                            setMatchedIds(nextMatched);
                            setMatchLeft(null);
                            updateVocabStatus(item.id, true);
                            setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
                            if (nextMatched.length >= sessionDeck.length) {
                              setTimeout(() => setSessionDone(true), 450);
                            }
                          } else {
                            setMatchWrongId(item.id);
                            setSessionStats((s) => ({ ...s, wrong: s.wrong + 1 }));
                          }
                        }}
                        className={cn(
                          "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors cursor-pointer",
                          done
                            ? "border-success/30 bg-success-bg/50 text-success opacity-60 cursor-default"
                            : wrong
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-background hover:border-primary/50 disabled:opacity-60"
                        )}
                      >
                        {item.uz || item.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : currentCard ? (
            /* Single-Card Focused Practice Surface */
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(15,37,55,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {currentCard.status}
                  </Badge>
                  {currentCard.pos ? (
                    <Badge variant="secondary" className="text-[11px]">
                      {currentCard.pos}
                    </Badge>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => speakWord(currentCard.word)}
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  Pronounce
                </Button>
              </div>

              {/* FLASHCARDS */}
              {practiceMode === "flashcards" ? (
                <div className="text-center space-y-6">
                  <div className="py-5 space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      {currentCard.word}
                    </h2>
                    {currentCard.ipa ? (
                      <p className="font-mono text-sm text-muted-foreground">{currentCard.ipa}</p>
                    ) : null}
                  </div>

                  {flipped ? (
                    <div className="space-y-5 border-t border-border pt-5 text-left">
                      <div className="space-y-1.5 text-center">
                        {currentCard.uz ? (
                          <p className="text-lg font-semibold text-foreground">{currentCard.uz}</p>
                        ) : null}
                        {currentCard.en ? (
                          <p className="text-sm text-muted-foreground">{currentCard.en}</p>
                        ) : null}
                      </div>

                      {currentCard.example ? (
                        <blockquote className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm font-serif italic text-foreground">
                          &ldquo;{currentCard.example}&rdquo;
                        </blockquote>
                      ) : null}

                      {currentCard.collocations?.length ? (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {currentCard.collocations.slice(0, 4).map((col) => (
                            <Badge key={col} variant="outline" className="text-xs font-normal">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="lg"
                          onClick={() => advanceCard(false)}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          Study Again
                        </Button>
                        <Button type="button" size="lg" onClick={() => advanceCard(true)}>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          I Knew This
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button type="button" size="lg" onClick={() => setFlipped(true)}>
                        Reveal Answer
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* MEANING QUIZ */}
              {practiceMode === "quiz" ? (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {currentCard.word}
                    </h2>
                    {currentCard.ipa ? (
                      <p className="font-mono text-sm text-muted-foreground">{currentCard.ipa}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {quizOptions.map((opt) => {
                      const isCorrectOpt = opt.id === currentCard.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={Boolean(answerState)}
                          onClick={() => {
                            const ok = isCorrectOpt;
                            setAnswerState({
                              correct: ok,
                              message: ok
                                ? "Correct! Well remembered."
                                : `Correct meaning: ${currentCard.uz || currentCard.en}`,
                            });
                          }}
                          className={cn(
                            "rounded-lg border px-4 py-3 text-left text-sm transition-colors cursor-pointer",
                            answerState
                              ? isCorrectOpt
                                ? "border-success bg-success-bg text-success font-semibold"
                                : "border-border bg-muted/30 text-muted-foreground"
                              : "border-border bg-background hover:border-primary/60 hover:bg-muted/40"
                          )}
                        >
                          <div className="font-medium">{opt.uz || opt.en}</div>
                          {opt.uz && opt.en ? (
                            <div className="text-xs opacity-75 mt-0.5">{opt.en}</div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {answerState ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-semibold",
                          answerState.correct ? "text-success" : "text-destructive"
                        )}
                      >
                        {answerState.correct ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {answerState.message}
                      </span>
                      <Button type="button" onClick={() => advanceCard(answerState.correct)}>
                        Next Card
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* FILL THE GAP & LISTEN & SPELL */}
              {practiceMode === "gap" || practiceMode === "spell" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (answerState) {
                      advanceCard(answerState.correct);
                      return;
                    }
                    const ok = normalizeAnswer(textInput) === normalizeAnswer(currentCard.word);
                    setAnswerState({
                      correct: ok,
                      message: ok
                        ? "Exact match!"
                        : `Expected answer: ${currentCard.word}`,
                    });
                  }}
                  className="space-y-5"
                >
                  {practiceMode === "spell" ? (
                    <div className="text-center space-y-3 py-2">
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => speakWord(currentCard.word)}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                        Listen to Word
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Meaning: <strong className="text-foreground">{currentCard.uz || currentCard.en || "Listen and spell"}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="rounded-lg border border-border bg-muted/40 p-4 font-serif text-lg leading-relaxed text-foreground">
                        {blankSentence(currentCard)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hint: <strong className="text-foreground">{currentCard.uz || currentCard.en}</strong>
                        {currentCard.pos ? ` (${currentCard.pos})` : ""}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      value={textInput}
                      disabled={Boolean(answerState)}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type the exact word or phrase..."
                      className="h-10 text-base"
                    />
                    {!answerState ? (
                      <Button type="submit" size="lg">
                        Check
                      </Button>
                    ) : (
                      <Button type="submit" size="lg">
                        Next
                      </Button>
                    )}
                  </div>

                  {answerState ? (
                    <div
                      className={cn(
                        "rounded-md border px-3.5 py-2.5 text-sm font-medium flex items-center gap-2",
                        answerState.correct
                          ? "border-success/40 bg-success-bg text-success"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                      )}
                    >
                      {answerState.correct ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{answerState.message}</span>
                    </div>
                  ) : null}
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      </AppShell>
    );
  }

  // ============================================================================
  // WORD BANK DIRECTORY VIEW (Visible when NOT in Practice Mode)
  // ============================================================================
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="border-b border-border pb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Words — SRS Bank</h1>
            <p className="text-sm text-muted-foreground">
              Save vocabulary from articles, podcasts, and Reading Room passages, then drill due cards in distraction-free practice mode.
            </p>
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Word
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Word Bank</DialogTitle>
                <DialogDescription>
                  Store a new word or phrase with part of speech, IPA, translation, and an example sentence.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="w-word" className="text-sm font-medium">Word or phrase</label>
                    <Input id="w-word" required value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="e.g., resilient" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="w-pos" className="text-sm font-medium">Part of speech</label>
                    <Input id="w-pos" value={newPos} onChange={(e) => setNewPos(e.target.value)} placeholder="adj / verb" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="w-ipa" className="text-sm font-medium">IPA pronunciation</label>
                  <Input id="w-ipa" value={newIpa} onChange={(e) => setNewIpa(e.target.value)} placeholder="/rɪˈzɪl.jənt/" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="w-uz" className="text-sm font-medium">Uzbek translation</label>
                  <Input id="w-uz" value={newUz} onChange={(e) => setNewUz(e.target.value)} placeholder="chidamli, bardoshli" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="w-en" className="text-sm font-medium">English definition</label>
                  <Input id="w-en" value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="able to recover quickly from difficulties" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="w-ex" className="text-sm font-medium">Example sentence</label>
                  <Input id="w-ex" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="Local economies proved remarkably resilient." />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Word</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Practice Mode Launcher Strip */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold">Start Focused Practice</h2>
            </div>
            <Badge variant="outline" className="font-mono">
              {counts.due} words due · {counts.mastered} mastered
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {practiceButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  disabled={btn.disabled}
                  onClick={() => startPractice(btn.id)}
                  className="rounded-lg border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/60 hover:bg-accent/40 disabled:opacity-50 cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span>{btn.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{btn.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "due", "new", "learning", "mastered"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold capitalize cursor-pointer transition-colors",
                  filter === f
                    ? "border-shell bg-shell text-shell-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words, translations, examples..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Rich Word Bank Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center space-y-2">
            <BookMarked className="h-7 w-7 mx-auto text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">No matching words</p>
            <p className="text-xs text-muted-foreground">
              Try clearing your filter or add a new vocabulary item above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-bold text-base text-foreground">{item.word}</span>
                      {item.pos ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {item.pos}
                        </span>
                      ) : null}
                      {item.ipa ? (
                        <span className="font-mono text-xs text-muted-foreground">{item.ipa}</span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={
                          item.status === "mastered"
                            ? "success"
                            : item.status === "learning"
                            ? "milestone"
                            : "outline"
                        }
                        className="capitalize text-[11px]"
                      >
                        {item.status}
                      </Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Pronounce ${item.word}`}
                        onClick={() => speakWord(item.word)}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${item.word}`}
                        onClick={() => deleteVocabWord(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {item.uz ? (
                    <p className="text-sm font-medium text-foreground">{item.uz}</p>
                  ) : null}
                  {item.en ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.en}</p>
                  ) : null}
                  {item.example ? (
                    <p className="text-xs font-serif italic text-foreground/80 border-t border-border/70 pt-2">
                      &ldquo;{item.example}&rdquo;
                    </p>
                  ) : null}
                </div>

                {item.collocations?.length ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.collocations.slice(0, 3).map((col) => (
                      <span
                        key={col}
                        className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
