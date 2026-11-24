"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  FileEdit,
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCmsPanel } from "@/components/admin/course-cms";
import { ExamCmsPanel } from "@/components/admin/exam-cms";
import { StudentsGroupsPanel } from "@/components/admin/students-panel";
import { SubmissionsReviewPanel } from "@/components/admin/submissions-panel";

type AdminTab = "overview" | "days" | "exams" | "students" | "submissions";

export default function AdminPanelPage() {
  const {
    isAdmin,
    isLiveSupabase,
    students,
    groups,
    submissions,
    tests,
    readingRequests,
    switchRole,
    adminResolveReadingRequest,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>("overview");

  const pendingRequests = readingRequests.filter((r) => r.status === "pending");
  const submittedCount = submissions.filter((s) => s.status === "submitted").length;

  // Guard non-admin users cleanly, offering instant role switch in Local Seed Mode
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="rounded-lg border border-border bg-card p-8 max-w-lg mx-auto text-center space-y-4 my-8">
          <ShieldAlert className="h-9 w-9 mx-auto text-milestone" aria-hidden="true" />
          <h1 className="text-xl font-bold">Teacher &amp; Admin Access Required</h1>
          <p className="text-sm text-muted-foreground">
            {isLiveSupabase
              ? "Your Supabase profile currently has the student role. Ask an administrator to assign teacher or admin privileges in public.profiles."
              : "You are currently viewing IELTS Max as a Student. Switch to Admin / Teacher mode below to explore the full Course CMS, IELTS Exam Editor, Student Roster, and Unlock Controls."}
          </p>
          {isLiveSupabase ? (
            <div className="rounded-md border border-border bg-muted/40 p-3.5 text-left space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                Promote your account to Admin in Supabase SQL Editor:
              </p>
              <code className="block text-xs font-mono text-primary break-all">
                update public.profiles set role = &apos;admin&apos; where email = &apos;your-email@example.com&apos;;
              </code>
            </div>
          ) : (
            <Button type="button" onClick={() => switchRole("admin")}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Switch to Admin / Teacher Mode
            </Button>
          )}
        </div>
      </AppShell>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "days", label: "Course CMS (24 Days)", icon: FileEdit },
    { id: "exams", label: "IELTS Exam Editor", icon: ClipboardCheck },
    { id: "students", label: "Students, Groups & Unlocks", icon: Users },
    { id: "submissions", label: "Submissions Review", icon: Inbox },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="border-b border-border pb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default">Admin Console</Badge>
              {pendingRequests.length > 0 ? (
                <Badge variant="milestone" className="font-mono">
                  {pendingRequests.length} pending unlock{pendingRequests.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              IELTS Max — Teacher &amp; Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage all 24 course days, computer-delivered IELTS exams, cohort groups, day/article unlocks, and student reviews.
            </p>
          </div>
        </div>

        {/* Admin Section Tabs */}
        <div role="tablist" aria-label="Admin console sections" className="task-tablist">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`admin-tab-${t.id}`}
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="task-tab inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby={`admin-tab-${tab}`}>
          {tab === "overview" ? (
            <div className="space-y-6">
              {/* Hairline KPI Ledger */}
              <section className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-lg border border-border bg-card">
                <div className="p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Total Students</span>
                  <div className="text-2xl font-bold font-mono tabular">
                    {students.filter((s) => s.role === "student").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Across {groups.length} active groups</p>
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Stamped Submissions</span>
                  <div className="text-2xl font-bold font-mono tabular">{submittedCount}</div>
                  <p className="text-xs text-muted-foreground">{submissions.length} total records</p>
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Published Curriculum</span>
                  <div className="text-2xl font-bold font-mono tabular">24 / 9</div>
                  <p className="text-xs text-muted-foreground">24 days · {tests.length} IELTS/Placement exams</p>
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Reading Unlock Queue</span>
                  <div className="text-2xl font-bold font-mono text-milestone tabular">
                    {pendingRequests.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting teacher decision</p>
                </div>
              </section>

              {/* Pending Reading Room Unlock Requests */}
              <section className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="text-base font-bold">Reading Room Unlock Requests</h2>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {pendingRequests.length} pending
                  </Badge>
                </div>

                {readingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reading unlock requests yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {readingRequests.map((req) => (
                      <li
                        key={req.id}
                        className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {req.student_name}{" "}
                            <span className="font-normal text-muted-foreground">requested</span>{" "}
                            &ldquo;{req.article_title}&rdquo;
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Article ID: {req.article_id} · Status: {req.status}
                          </p>
                        </div>

                        {req.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => adminResolveReadingRequest(req.id, true)}
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Approve &amp; Unlock
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => adminResolveReadingRequest(req.id, false)}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant={req.status === "approved" ? "success" : "destructive"}
                            className="capitalize self-start sm:self-center"
                          >
                            {req.status}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Group Health Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => {
                  const members = students.filter((s) => s.group_id === g.id);
                  return (
                    <div key={g.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">{g.name}</h3>
                        <Badge variant="outline" className="font-mono">
                          {members.length} students
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Open days for cohort:{" "}
                        <span className="font-mono text-foreground">
                          {(g.open_days || []).length
                            ? (g.open_days || []).join(", ")
                            : "Sequential only"}
                        </span>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTab("students")}
                      >
                        Manage Cohort &amp; Unlocks
                      </Button>
                    </div>
                  );
                })}
              </section>
            </div>
          ) : null}

          {tab === "days" ? <CourseCmsPanel /> : null}
          {tab === "exams" ? <ExamCmsPanel /> : null}
          {tab === "students" ? <StudentsGroupsPanel /> : null}
          {tab === "submissions" ? <SubmissionsReviewPanel /> : null}
        </div>
      </div>
    </AppShell>
  );
}
