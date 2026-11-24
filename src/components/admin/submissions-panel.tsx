"use client";

import React, { useMemo, useState } from "react";
import { Check, Eye, MessageSquare, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import type { SubmissionRecord } from "@/lib/types";
import { cn, countWords, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SubmissionsReviewPanel() {
  const { submissions, students, writingFeedback, adminAddTeacherNote } = useApp();
  const [inspecting, setInspecting] = useState<SubmissionRecord | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "draft">("all");
  const [query, setQuery] = useState("");

  const openInspector = (sub: SubmissionRecord) => {
    setInspecting(sub);
    setNoteDraft(sub.teacher_note || "");
    setSaved(false);
  };

  const studentName = (uid: string) =>
    students.find((s) => s.id === uid)?.full_name || "Student";

  const getBand = (uid: string, day: number) =>
    writingFeedback.find((w) => w.user_id === uid && w.n === day)?.band;

  const sortedSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...submissions]
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!q) return true;
        const name = (students.find((st) => st.id === s.user_id)?.full_name || "").toLowerCase();
        return name.includes(q) || `day ${padDay(s.n)}`.includes(q) || String(s.n) === q;
      })
      .sort(
        (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      );
  }, [submissions, students, statusFilter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="subs-table-caption" className="text-base font-bold">
          Student Submissions Queue ({sortedSubs.length})
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(["all", "submitted", "draft"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold capitalize cursor-pointer",
                  statusFilter === st
                    ? "border-shell bg-shell text-shell-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-52">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter student or day..."
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby="subs-table-caption"
        className="responsive-table-wrap"
      >
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Day</th>
              <th>Status</th>
              <th>Writing Words</th>
              <th>AI Band</th>
              <th>Teacher Note</th>
              <th className="text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {sortedSubs.map((sub, idx) => {
              const wr = typeof sub.writing === "string" ? sub.writing : "";
              const band = getBand(sub.user_id, sub.n);
              return (
                <tr key={sub.id || `${sub.user_id}-${sub.n}-${idx}`}>
                  <th scope="row">{studentName(sub.user_id)}</th>
                  <td data-label="Day" className="font-mono tabular">
                    DAY {padDay(sub.n)}
                  </td>
                  <td data-label="Status">
                    <Badge variant={sub.status === "submitted" ? "success" : "outline"} className="capitalize">
                      {sub.status}
                    </Badge>
                  </td>
                  <td data-label="Writing Words" className="font-mono tabular">
                    {countWords(wr)} words
                  </td>
                  <td data-label="AI Band" className="font-mono tabular">
                    {band ? `Band ${Number(band).toFixed(1)}` : "—"}
                  </td>
                  <td data-label="Teacher Note" className="max-w-xs truncate text-xs text-muted-foreground">
                    {sub.teacher_note || "None yet"}
                  </td>
                  <td data-label="Inspect" className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openInspector(sub)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Review
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submission Inspector Dialog */}
      <Dialog open={Boolean(inspecting)} onOpenChange={(o) => !o && setInspecting(null)}>
        <DialogContent className="max-w-2xl">
          {inspecting ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {studentName(inspecting.user_id)} — Day {padDay(inspecting.n)} Submission
                </DialogTitle>
                <DialogDescription>
                  Status: {inspecting.status} · Last updated{" "}
                  {inspecting.updated_at
                    ? new Date(inspecting.updated_at).toLocaleString()
                    : "recently"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {inspecting.article ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Article Summary</p>
                    <div className="rounded-md border border-border bg-muted/30 p-3 font-serif leading-relaxed whitespace-pre-line">
                      {inspecting.article}
                    </div>
                  </div>
                ) : null}

                {typeof inspecting.writing === "string" && inspecting.writing.trim() ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      IELTS Writing Response ({countWords(inspecting.writing)} words)
                    </p>
                    <div className="rounded-md border border-border bg-muted/30 p-3 font-serif leading-relaxed whitespace-pre-line">
                      {inspecting.writing}
                    </div>
                  </div>
                ) : null}

                {inspecting.reflection ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Daily Reflection</p>
                    <div className="rounded-md border border-border bg-muted/30 p-3 leading-relaxed">
                      {inspecting.reflection}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5 border-t border-border pt-3">
                  <label htmlFor="teacher-note" className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Teacher Feedback Note (visible to student)
                  </label>
                  <Textarea
                    id="teacher-note"
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add encouraging feedback or specific grammar corrections..."
                  />
                  {saved ? (
                    <p className="text-xs font-semibold text-success inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Note saved to student submission.
                    </p>
                  ) : null}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInspecting(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    adminAddTeacherNote(inspecting.user_id, inspecting.n, noteDraft);
                    setSaved(true);
                  }}
                >
                  Save Teacher Note
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
