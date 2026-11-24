"use client";

import React, { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Search, Trash2, Unlock, UserPlus } from "lucide-react";
import { useApp } from "@/lib/store";
import type { ProfileRecord, UserRole } from "@/lib/types";
import { cn, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StudentsGroupsPanel() {
  const {
    students,
    groups,
    submissions,
    isLiveSupabase,
    adminCreateUser,
    adminCreateGroup,
    adminUpdateGroupOpenDays,
    adminUpdateStudent,
    adminResetStudentProgress,
    adminDeleteStudent,
  } = useApp();

  const [newGroupName, setNewGroupName] = useState("");
  const [unlockTargetType, setUnlockTargetType] = useState<"group" | "student">("group");
  const [unlockTargetId, setUnlockTargetId] = useState<string>(groups[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  // Add User modal state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("IeltsMax2026!");
  const [uRole, setURole] = useState<UserRole>("student");
  const [uGroup, setUGroup] = useState<string>(groups[0]?.id || "none");
  const [uLevel, setULevel] = useState("B1");
  const [uPace, setUPace] = useState<24 | 48>(24);
  const [uMaxDay, setUMaxDay] = useState(1);
  const [uError, setUError] = useState("");
  const [uBusy, setUBusy] = useState(false);
  const [banner, setBanner] = useState("");

  const [confirmAction, setConfirmAction] = useState<{
    kind: "reset" | "delete";
    student: ProfileRecord;
  } | null>(null);

  const selectedGroup = groups.find((g) => g.id === unlockTargetId);
  const selectedStudent = students.find((s) => s.id === unlockTargetId);
  const currentOpenDays: number[] =
    unlockTargetType === "group"
      ? selectedGroup?.open_days || []
      : selectedStudent?.open_days || [];

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((st) => {
      if (roleFilter !== "all" && st.role !== roleFilter) return false;
      if (!q) return true;
      return (
        st.full_name.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery, roleFilter]);

  const toggleUnlockDay = (dayNum: number) => {
    const set = new Set(currentOpenDays);
    if (set.has(dayNum)) set.delete(dayNum);
    else set.add(dayNum);
    const next = Array.from(set).sort((a, b) => a - b);

    if (unlockTargetType === "group" && selectedGroup) {
      adminUpdateGroupOpenDays(selectedGroup.id, next);
    } else if (unlockTargetType === "student" && selectedStudent) {
      adminUpdateStudent(selectedStudent.id, { open_days: next });
    }
  };

  const applyPresetDays = (maxDay: number) => {
    const next = Array.from({ length: maxDay }, (_, i) => i + 1);
    if (unlockTargetType === "group" && selectedGroup) {
      adminUpdateGroupOpenDays(selectedGroup.id, next);
    } else if (unlockTargetType === "student" && selectedStudent) {
      adminUpdateStudent(selectedStudent.id, { open_days: next });
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    adminCreateGroup(newGroupName);
    setNewGroupName("");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUError("");
    setUBusy(true);
    try {
      const openDays = Array.from({ length: Math.min(24, Math.max(1, uMaxDay)) }, (_, i) => i + 1);
      const res = await adminCreateUser({
        full_name: uName.trim(),
        email: uEmail.trim(),
        password: uPassword,
        role: uRole,
        group_id: uGroup === "none" ? null : uGroup,
        level: uLevel,
        pace: uPace,
        open_days: openDays,
      });
      if (res.error) {
        setUError(res.error);
        return;
      }
      setBanner(`Enrolled ${uName.trim()} (${uRole}) successfully.`);
      setTimeout(() => setBanner(""), 3500);
      setUName("");
      setUEmail("");
      setUPassword("IeltsMax2026!");
      setURole("student");
      setUMaxDay(1);
      setAddUserOpen(false);
    } finally {
      setUBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          role="status"
          className="rounded-lg border border-success/30 bg-success-bg px-4 py-2.5 text-sm font-medium text-success flex items-center gap-2"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{banner}</span>
        </div>
      ) : null}

      {/* Cohort Groups + Open Days Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 rounded-lg border border-border bg-card p-5 space-y-4 shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
          <h2 className="text-base font-bold">Cohort Groups ({groups.length})</h2>

          <form onSubmit={handleAddGroup} className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name (e.g. Band 7.5 Evening)"
            />
            <Button type="submit" size="sm" className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
          </form>

          <ul className="divide-y divide-border">
            {groups.map((g) => {
              const count = students.filter((s) => s.group_id === g.id).length;
              return (
                <li key={g.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground font-mono tabular">
                      {count} students · {(g.open_days || []).length} days open
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUnlockTargetType("group");
                      setUnlockTargetId(g.id);
                    }}
                  >
                    <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                    Days
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 24-Day Open Days Matrix */}
        <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5 space-y-4 shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">Open Course Days Control</h2>
            <div className="flex gap-1.5">
              <Button type="button" size="sm" variant="outline" onClick={() => applyPresetDays(12)}>
                Open 1–12
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyPresetDays(24)}>
                Open All 24
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Select
              value={unlockTargetType}
              onValueChange={(v) => {
                const mode = v as "group" | "student";
                setUnlockTargetType(mode);
                setUnlockTargetId(mode === "group" ? groups[0]?.id || "" : students[0]?.id || "");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Target: Whole Group</SelectItem>
                <SelectItem value="student">Target: Individual Student</SelectItem>
              </SelectContent>
            </Select>

            <Select value={unlockTargetId} onValueChange={setUnlockTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose target..." />
              </SelectTrigger>
              <SelectContent>
                {unlockTargetType === "group"
                  ? groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))
                  : students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((dayNum) => {
              const active = currentOpenDays.includes(dayNum);
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => toggleUnlockDay(dayNum)}
                  className={cn(
                    "h-9 rounded-md border font-mono text-xs font-semibold transition-colors cursor-pointer tabular",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/60"
                  )}
                >
                  {padDay(dayNum)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Students Directory Header + Search + Add User Button */}
      <section className="space-y-3" aria-labelledby="students-table-caption">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="students-table-caption" className="text-base font-bold">
            Enrolled Students &amp; Staff ({filteredStudents.length} / {students.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" aria-hidden="true" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or email..."
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as "all" | UserRole)}
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="assistant">Assistants</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" onClick={() => setAddUserOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add User
            </Button>
          </div>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="students-table-caption"
          className="responsive-table-wrap shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
        >
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Student / Staff</th>
                <th>Group</th>
                <th>Role</th>
                <th>Submitted</th>
                <th>Open Days</th>
                <th className="text-right">Safety Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => {
                const subCount = submissions.filter(
                  (s) => s.user_id === st.id && s.status === "submitted"
                ).length;

                return (
                  <tr key={st.id}>
                    <th scope="row">
                      <div>
                        <div className="font-semibold">{st.full_name}</div>
                        <div className="text-xs font-normal text-muted-foreground">{st.email}</div>
                      </div>
                    </th>
                    <td data-label="Group">
                      <Select
                        value={st.group_id || "none"}
                        onValueChange={(val) =>
                          adminUpdateStudent(st.id, { group_id: val === "none" ? null : val })
                        }
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td data-label="Role">
                      <Select
                        value={st.role}
                        onValueChange={(val) =>
                          adminUpdateStudent(st.id, { role: val as UserRole })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td data-label="Submitted" className="font-mono tabular">
                      {subCount} / 24
                    </td>
                    <td data-label="Open Days">
                      <Badge variant="outline" className="font-mono">
                        {(st.open_days || []).length} open
                      </Badge>
                    </td>
                    <td data-label="Safety Actions">
                      <div className="flex items-center justify-end gap-2 pl-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction({ kind: "reset", student: st })}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          Reset
                        </Button>
                        {st.role === "student" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmAction({ kind: "delete", student: st })}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enroll New User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              {isLiveSupabase
                ? "Creates a verified Supabase Auth account and profile row via /api/admin/users."
                : "Adds a new student, assistant, or teacher directly to your cohort roster."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="nu-name" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="nu-name"
                required
                value={uName}
                onChange={(e) => setUName(e.target.value)}
                placeholder="e.g., Jasur Karimov"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="nu-email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="nu-email"
                  type="email"
                  required
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  placeholder="jasur@ieltsmax.edu"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="nu-pass" className="text-sm font-medium">
                  Temporary password
                </label>
                <Input
                  id="nu-pass"
                  type="text"
                  required
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-sm font-medium block">Role</span>
                <Select value={uRole} onValueChange={(v) => setURole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium block">Cohort Group</span>
                <Select value={uGroup} onValueChange={setUGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-sm font-medium block">Level</span>
                <Select value={uLevel} onValueChange={setULevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                      <SelectItem key={lv} value={lv}>
                        {lv}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium block">Pace</span>
                <Select
                  value={String(uPace)}
                  onValueChange={(v) => setUPace(Number(v) === 48 ? 48 : 24)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 days</SelectItem>
                    <SelectItem value="48">48 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label htmlFor="nu-days" className="text-sm font-medium">
                  Unlock up to Day
                </label>
                <Input
                  id="nu-days"
                  type="number"
                  min={1}
                  max={24}
                  value={uMaxDay}
                  onChange={(e) => setUMaxDay(Number(e.target.value))}
                />
              </div>
            </div>

            {uError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {uError}
              </p>
            ) : null}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uBusy}>
                {uBusy ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Destructive Actions */}
      <Dialog open={Boolean(confirmAction)} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.kind === "delete"
                ? `Delete ${confirmAction.student.full_name}?`
                : `Reset progress for ${confirmAction?.student.full_name}?`}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.kind === "delete"
                ? "This removes the student profile and all associated submissions from the roster."
                : "This clears all submitted days and exam results for this student and locks Days 2–24."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive-solid"
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.kind === "delete") {
                  adminDeleteStudent(confirmAction.student.id);
                } else {
                  adminResetStudentProgress(confirmAction.student.id);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.kind === "delete" ? "Confirm Delete" : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
