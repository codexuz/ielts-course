"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Mic, Square, Users, XCircle } from "lucide-react";
import type { CourseDay } from "@/lib/types";
import { useApp } from "@/lib/store";
import { cn, formatClock, normalizeAnswer, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SpeakingTaskProps {
  day: CourseDay;
  speakAnswers: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  answerKey?: string[];
  canRevealKey: boolean;
}

export function SpeakingTask({
  day,
  speakAnswers,
  onChange,
  answerKey,
  canRevealKey,
}: SpeakingTaskProps) {
  const { profile, recordings, addRecording } = useApp();
  const speaking = day.data.speaking;

  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState("");
  const [checked, setChecked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    };
  }, [localAudioUrl]);

  if (!speaking) {
    return <p className="text-sm text-muted-foreground">No speaking task for this day.</p>;
  }

  const dayRecordings = recordings.filter((r) => r.n === day.n);
  const segments = speaking.segments || [];
  const gapCount = Math.max(0, segments.length - 1);
  const hasKey = Boolean(answerKey && answerKey.length > 0 && (canRevealKey || checked));

  const startRecording = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setLocalAudioUrl(url);
        addRecording({
          user_id: profile.id,
          n: day.n,
          kind: "speaking",
          path: url,
          full_name: profile.full_name,
          seconds: recSec || 1,
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecSec(0);
      setRecording(true);
      timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      setMicError("Microphone permission was denied or unavailable on this device.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const pdfUrl = speaking.url ? resolveAssetUrl(speaking.url) : "";

  return (
    <div className="space-y-5">
      {/* IELTS Speaking Prompts + Recorder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">
                {speaking.title || `IELTS Speaking — Day ${day.n}`}
              </h2>
            </div>
            {pdfUrl ? (
              <Button asChild size="sm" variant="outline">
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  Speaking Sheet PDF
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </div>

          {speaking.task ? (
            <p className="text-sm text-muted-foreground">{speaking.task}</p>
          ) : null}

          <div className="rounded-md border border-border bg-background p-4 font-serif text-[15px] leading-relaxed whitespace-pre-line text-foreground">
            {speaking.text || "Open the Speaking Sheet PDF above for today's Part 1, Part 2 cue card, and Part 3 questions."}
          </div>
        </div>

        {/* Voice Recorder + Coursemates */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Record Your Answer</h3>
              <span className="font-mono text-xs text-muted-foreground tabular">
                Max {speaking.maxMin || 5} min
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!recording ? (
                <Button type="button" onClick={startRecording}>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  Start Recording
                </Button>
              ) : (
                <Button type="button" variant="destructive-solid" onClick={stopRecording}>
                  <Square className="h-4 w-4" aria-hidden="true" />
                  Stop ({formatClock(recSec)})
                </Button>
              )}
              {recording ? (
                <span className="text-xs font-medium text-destructive">Recording live...</span>
              ) : null}
            </div>

            {micError ? (
              <p role="alert" className="text-xs text-destructive">
                {micError}
              </p>
            ) : null}

            {localAudioUrl ? (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-xs font-medium text-success">Recording saved to Day {day.n}</p>
                <audio controls src={localAudioUrl} className="w-full h-10" />
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold">Coursemates&apos; Recordings</h3>
              </div>
              <Badge variant="secondary" className="font-mono">
                {dayRecordings.length}
              </Badge>
            </div>

            {dayRecordings.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Be the first in your cohort to record today&apos;s speaking task.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {dayRecordings.slice(0, 6).map((rec, idx) => (
                  <li key={rec.id || idx} className="py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{rec.full_name}</span>
                      <span className="font-mono text-muted-foreground tabular">
                        {formatClock(rec.seconds || 0)}
                      </span>
                    </div>
                    {rec.path.startsWith("blob:") || rec.path.startsWith("http") ? (
                      <audio controls src={rec.path} className="w-full h-8" />
                    ) : (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        Audio stored in Supabase bucket: speaking/{rec.path}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 3-Part Speaking Vocabulary Quiz */}
      {gapCount > 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold">Speaking Vocabulary Quiz</h3>
              <p className="text-xs text-muted-foreground">
                Complete Parts 1–3 by typing the target collocations, verb forms, and matching letters (a–e).
              </p>
            </div>
            {answerKey && answerKey.length > 0 ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setChecked((c) => !c)}>
                {checked ? "Hide check" : "Check quiz"}
              </Button>
            ) : null}
          </div>

          <div className="text-sm leading-[2.1] text-foreground whitespace-pre-line">
            {segments.map((seg, i) => {
              const isLast = i === segments.length - 1;
              const val = speakAnswers[String(i)] || "";
              const expected = answerKey?.[i];
              const showEval = hasKey && Boolean(expected);
              const isCorrect = showEval && normalizeAnswer(val) === normalizeAnswer(expected);

              return (
                <React.Fragment key={i}>
                  <span>{seg}</span>
                  {!isLast ? (
                    <span className="inline-flex items-center gap-1 mx-1 my-0.5 align-baseline">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-shell px-1 font-mono text-[11px] font-semibold text-shell-foreground tabular">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        aria-label={`Speaking quiz item ${i + 1}`}
                        value={val}
                        onChange={(e) =>
                          onChange({ ...speakAnswers, [String(i)]: e.target.value })
                        }
                        className={cn(
                          "h-8 w-36 rounded border px-2 text-sm bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                          showEval
                            ? isCorrect
                              ? "border-success bg-success-bg/40"
                              : "border-destructive bg-destructive/10"
                            : "border-input"
                        )}
                      />
                      {showEval ? (
                        isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{expected}</span>
                          </span>
                        )
                      ) : null}
                    </span>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
