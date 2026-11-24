"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import daysSeed from "@/data/seed/days.json";
import testsSeed from "@/data/seed/tests.json";
import filmsSeed from "@/data/seed/films.json";
import filmSamplesSeed from "@/data/seed/film_samples.json";
import grammar2Seed from "@/data/seed/grammar2.json";
import answerKeysSeed from "@/data/seed/answer_keys.json";
import readingTopicsSeed from "@/data/seed/reading_topics.json";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  AnswerKeyRecord,
  CartoonItem,
  CourseDay,
  FilmItem,
  GrammarQuestion,
  GroupRecord,
  ProfileRecord,
  RankingEntry,
  ReadingRequestRecord,
  ReadingTopicCatalog,
  RecordingRecord,
  SubmissionRecord,
  TestRecord,
  TestResultRecord,
  UserRole,
  VocabItem,
  WritingFeedbackRecord,
} from "@/lib/types";

const STORAGE_KEY = "ielts_max_clean_state_v3";
const LOCAL_ADMIN_ID = "local-admin-001";
const LOCAL_STUDENT_ID = "local-student-001";

interface PersistedState {
  role: UserRole;
  isLoggedIn: boolean;
  days: CourseDay[];
  grammar2: Record<string, GrammarQuestion[]>;
  tests: TestRecord[];
  groups: GroupRecord[];
  students: ProfileRecord[];
  currentUserId: string;
  submissions: SubmissionRecord[];
  writingFeedback: WritingFeedbackRecord[];
  vocab: VocabItem[];
  recordings: RecordingRecord[];
  testResults: TestResultRecord[];
  answerKeys: AnswerKeyRecord[];
  homeworkTime: Record<number, number>;
  ranking: RankingEntry[];
  readingTopicsSelected: string[];
  readingUnlocked: string[];
  readingRequests: ReadingRequestRecord[];
  readingProgress: Record<string, { level: string; completed: boolean; score?: number }>;
}

function createCleanState(liveSupabase: boolean): PersistedState {
  const defaultStudents: ProfileRecord[] = liveSupabase
    ? []
    : [
        {
          id: LOCAL_ADMIN_ID,
          email: "rakhmanovbilolbek04@gmail.com",
          full_name: "Bilolbek Rakhmanov",
          role: "admin",
          group_id: null,
          level: "C2",
          pace: 24,
          open_days: Array.from({ length: 24 }, (_, i) => i + 1),
        },
        {
          id: LOCAL_STUDENT_ID,
          email: "student@ieltsmax.edu",
          full_name: "Demo Student",
          role: "student",
          group_id: null,
          level: "A1",
          pace: 24,
          open_days: [1],
        },
      ];

  return {
    role: liveSupabase ? "student" : "admin",
    isLoggedIn: !liveSupabase,
    days: (daysSeed as unknown as CourseDay[]).sort((a, b) => a.n - b.n),
    grammar2: grammar2Seed as unknown as Record<string, GrammarQuestion[]>,
    tests: testsSeed as unknown as TestRecord[],
    groups: [],
    students: defaultStudents,
    currentUserId: liveSupabase ? "" : LOCAL_ADMIN_ID,
    submissions: [],
    writingFeedback: [],
    vocab: [],
    recordings: [],
    testResults: [],
    answerKeys: answerKeysSeed as unknown as AnswerKeyRecord[],
    homeworkTime: {},
    ranking: [],
    readingTopicsSelected: [],
    readingUnlocked: [],
    readingRequests: [],
    readingProgress: {},
  };
}

interface AppContextValue {
  ready: boolean;
  isLiveSupabase: boolean;
  isLoggedIn: boolean;
  profile: ProfileRecord;
  isAdmin: boolean;
  days: CourseDay[];
  grammar2: Record<string, GrammarQuestion[]>;
  films: FilmItem[];
  cartoons: CartoonItem[];
  filmSamples: Record<string, string>;
  tests: TestRecord[];
  groups: GroupRecord[];
  students: ProfileRecord[];
  submissions: SubmissionRecord[];
  writingFeedback: WritingFeedbackRecord[];
  vocab: VocabItem[];
  recordings: RecordingRecord[];
  testResults: TestResultRecord[];
  answerKeys: AnswerKeyRecord[];
  homeworkTime: Record<number, number>;
  ranking: RankingEntry[];
  readingTopics: ReadingTopicCatalog[];
  readingTopicsSelected: string[];
  readingUnlocked: string[];
  readingRequests: ReadingRequestRecord[];
  readingProgress: Record<string, { level: string; completed: boolean; score?: number }>;

  switchRole: (role: UserRole) => void;
  loginDemo: (role: UserRole, email?: string) => void;
  signInSupabase: (email: string, password: string) => Promise<{ error?: string }>;
  signUpSupabase: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;

  isDayOpen: (n: number) => boolean;
  getSubmission: (n: number, userId?: string) => SubmissionRecord | undefined;
  saveSubmission: (n: number, patch: Partial<SubmissionRecord>, submit?: boolean) => void;
  saveWritingFeedback: (record: WritingFeedbackRecord) => void;
  addRecording: (rec: Omit<RecordingRecord, "id" | "created_at">) => void;
  setPace: (pace: 24 | 48) => void;
  chooseGroup: (groupId: string) => void;
  addStudySeconds: (day: number, seconds: number) => void;
  saveTestResult: (result: TestResultRecord) => void;

  addVocabWord: (word: Omit<VocabItem, "id" | "created_at">) => void;
  updateVocabStatus: (id: string, correct: boolean) => void;
  deleteVocabWord: (id: string) => void;

  setReadingTopics: (topics: string[]) => void;
  requestReadingArticle: (articleId: string, articleTitle: string) => void;
  saveReadingProgress: (articleId: string, level: string, completed: boolean, score?: number) => void;

  adminCreateUser: (payload: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    group_id: string | null;
    level: string;
    pace: 24 | 48;
    open_days: number[];
  }) => Promise<{ error?: string }>;
  adminUpdateDay: (n: number, data: CourseDay["data"], grammar2List?: GrammarQuestion[]) => void;
  adminUpdateAnswerKey: (n: number, answers: string[], speakAnswers: string[]) => void;
  adminUpdateTest: (test: TestRecord) => void;
  adminCreateGroup: (name: string) => void;
  adminUpdateGroupOpenDays: (groupId: string, openDays: number[]) => void;
  adminUpdateStudent: (studentId: string, patch: Partial<ProfileRecord>) => void;
  adminResetStudentProgress: (studentId: string) => void;
  adminDeleteStudent: (studentId: string) => void;
  adminResolveReadingRequest: (reqId: string, approve: boolean) => void;
  adminAddTeacherNote: (userId: string, day: number, note: string) => void;
  resetLocalSeed: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isLiveSupabase = isSupabaseConfigured();
  const [state, setState] = useState<PersistedState>(() => createCleanState(isLiveSupabase));
  const [ready, setReady] = useState(false);

  // Hydrate persisted state only when NOT in live Supabase mode
  useEffect(() => {
    if (!isLiveSupabase) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<PersistedState>;
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Ignore storage errors
      }
      setReady(true);
    }
  }, [isLiveSupabase]);

  useEffect(() => {
    if (!ready || isLiveSupabase) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state, ready, isLiveSupabase]);

  // Live Supabase hydration
  const loadFromSupabase = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    if (!sb) {
      setReady(true);
      return;
    }

    const { data: sessionData } = await sb.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setState((prev) => ({
        ...createCleanState(true),
        days: prev.days,
        tests: prev.tests,
      }));
      setReady(true);
      return;
    }

    const user = session.user;
    const [
      daysRes,
      testsRes,
      groupsRes,
      profilesRes,
      subsRes,
      trRes,
      vocabRes,
      wfRes,
      recRes,
      hwRes,
      rPrefsRes,
      rProgRes,
      rUnlockRes,
      rReqRes,
      akRes,
      rankRes,
    ] = await Promise.all([
      sb.from("days").select("*").order("n"),
      sb.from("tests").select("*"),
      sb.from("groups").select("*").order("name"),
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("submissions").select("*"),
      sb.from("test_results").select("*"),
      sb.from("vocab").select("*").order("created_at", { ascending: false }),
      sb.from("writing_feedback").select("*"),
      sb.from("recordings").select("*").order("created_at", { ascending: false }),
      sb.from("homework_time").select("*"),
      sb.from("reading_prefs").select("*").eq("user_id", user.id).maybeSingle(),
      sb.from("reading_progress").select("*").eq("user_id", user.id),
      sb.from("reading_unlocks").select("*"),
      sb.from("reading_requests").select("*").order("created_at", { ascending: false }),
      sb.rpc("my_answer_keys"),
      sb.rpc("class_ranking"),
    ]);

    const profilesList = (profilesRes.data || []) as ProfileRecord[];
    const myProfile = profilesList.find((p) => p.id === user.id);
    const resolvedRole = (myProfile?.role ||
      (user.user_metadata?.role as UserRole) ||
      "student") as UserRole;

    const hwMap: Record<number, number> = {};
    for (const row of (hwRes.data || []) as Array<{ n: number; seconds: number }>) {
      hwMap[row.n] = row.seconds || 0;
    }

    const rProgMap: Record<string, { level: string; completed: boolean; score?: number }> = {};
    for (const row of (rProgRes.data || []) as Array<{
      article: string;
      level: string;
      state?: { completed?: boolean; score?: number };
    }>) {
      rProgMap[row.article] = {
        level: row.level || "B1",
        completed: Boolean(row.state?.completed ?? true),
        score: row.state?.score,
      };
    }

    const g2Map: Record<string, GrammarQuestion[]> = {
      ...(grammar2Seed as unknown as Record<string, GrammarQuestion[]>),
    };
    const daysRows = (daysRes.data || []) as Array<{
      n: number;
      data: CourseDay["data"];
      grammar2?: GrammarQuestion[];
      updated_at?: string;
    }>;
    for (const dr of daysRows) {
      if (Array.isArray(dr.grammar2) && dr.grammar2.length > 0) {
        g2Map[String(dr.n)] = dr.grammar2;
      }
    }

    const mappedRequests: ReadingRequestRecord[] = ((rReqRes.data || []) as Array<Record<string, unknown>>).map(
      (r) => {
        const stu = profilesList.find((p) => p.id === r.user_id);
        return {
          id: String(r.id),
          user_id: String(r.user_id),
          student_name: stu?.full_name || stu?.email || "Student",
          article_id: String(r.article),
          article_title: String(r.article),
          status: (r.status as ReadingRequestRecord["status"]) || "pending",
          created_at: String(r.created_at || new Date().toISOString()),
        };
      }
    );

    const mappedRanking: RankingEntry[] = ((rankRes.data || []) as Array<Record<string, unknown>>).map(
      (r, idx) => ({
        user_id: String(r.user_id || `rank-${idx + 1}`),
        full_name: String(r.full_name || "Student"),
        name: String(r.full_name || "Student"),
        group_id: (r.group_id as string | null) ?? null,
        days: Number(r.submitted_days ?? 0),
        submitted_days: Number(r.submitted_days ?? 0),
        tests: Number(r.tests_done ?? 0),
        tests_done: Number(r.tests_done ?? 0),
        points: Number(r.points ?? 0),
        rank: idx + 1,
      })
    );

    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      currentUserId: user.id,
      role: resolvedRole,
      days: daysRows.length
        ? daysRows.map((d) => ({ n: d.n, data: d.data, updated_at: d.updated_at }))
        : prev.days,
      grammar2: g2Map,
      tests: testsRes.data?.length ? (testsRes.data as TestRecord[]) : prev.tests,
      groups: (groupsRes.data || []) as GroupRecord[],
      students: profilesList.length
        ? profilesList
        : [
            {
              id: user.id,
              email: user.email || "",
              full_name: String(user.user_metadata?.full_name || user.email || "User"),
              role: resolvedRole,
              group_id: null,
              level: "A1",
              pace: 24,
              open_days: resolvedRole === "admin" ? Array.from({ length: 24 }, (_, i) => i + 1) : [1],
            },
          ],
      submissions: (subsRes.data || []) as SubmissionRecord[],
      testResults: (trRes.data || []) as TestResultRecord[],
      vocab: (vocabRes.data || []) as VocabItem[],
      writingFeedback: (wfRes.data || []) as WritingFeedbackRecord[],
      recordings: (recRes.data || []) as RecordingRecord[],
      homeworkTime: hwMap,
      answerKeys: akRes.data?.length ? (akRes.data as AnswerKeyRecord[]) : prev.answerKeys,
      ranking: mappedRanking,
      readingTopicsSelected: (rPrefsRes.data?.topics as string[]) || [],
      readingUnlocked: ((rUnlockRes.data || []) as Array<{ article: string }>).map((x) => x.article),
      readingRequests: mappedRequests,
      readingProgress: rProgMap,
    }));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!isLiveSupabase) return;
    void loadFromSupabase();
    const sb = createSupabaseBrowserClient();
    if (!sb) return;
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      void loadFromSupabase();
    });
    return () => subscription.unsubscribe();
  }, [isLiveSupabase, loadFromSupabase]);

  const profile = useMemo<ProfileRecord>(() => {
    const found = state.students.find((s) => s.id === state.currentUserId);
    if (found) return { ...found, role: state.role };
    if (!isLiveSupabase && (state.role === "admin" || state.role === "teacher")) {
      const adm = state.students.find((s) => s.role === "admin" || s.role === "teacher");
      if (adm) return adm;
    }
    return {
      id: state.currentUserId || "guest",
      email: "",
      full_name: state.isLoggedIn ? "Learner" : "Guest",
      role: state.role,
      group_id: null,
      level: "A1",
      pace: 24,
      open_days: [1],
    };
  }, [state.students, state.currentUserId, state.role, state.isLoggedIn, isLiveSupabase]);

  const isAdmin = state.role === "admin" || state.role === "teacher" || state.role === "assistant";

  const isDayOpen = useCallback(
    (n: number) => {
      if (isAdmin) return true;
      if (n === 1) return true;
      if (profile.open_days?.includes(n)) return true;
      const grp = state.groups.find((g) => g.id === profile.group_id);
      if (grp?.open_days?.includes(n)) return true;
      return state.submissions.some(
        (s) => s.user_id === profile.id && s.n === n - 1 && s.status === "submitted"
      );
    },
    [isAdmin, profile, state.groups, state.submissions]
  );

  const getSubmission = useCallback(
    (n: number, userId?: string) => {
      const uid = userId || profile.id;
      return state.submissions.find((s) => s.n === n && s.user_id === uid);
    },
    [state.submissions, profile.id]
  );

  const saveSubmission = useCallback(
    (n: number, patch: Partial<SubmissionRecord>, submit = false) => {
      const now = new Date().toISOString();
      let updatedRow: SubmissionRecord | null = null;

      setState((prev) => {
        const uid = prev.currentUserId || profile.id;
        const idx = prev.submissions.findIndex((s) => s.n === n && s.user_id === uid);
        const nextStatus: "draft" | "submitted" = submit
          ? "submitted"
          : idx >= 0
          ? prev.submissions[idx].status
          : "draft";

        updatedRow = {
          ...(idx >= 0 ? prev.submissions[idx] : { user_id: uid, n, status: "draft" }),
          ...patch,
          user_id: uid,
          n,
          status: nextStatus,
          submitted_at: submit ? now : idx >= 0 ? prev.submissions[idx].submitted_at : null,
          updated_at: now,
        };

        const nextSubs = [...prev.submissions];
        if (idx >= 0) nextSubs[idx] = updatedRow;
        else nextSubs.push(updatedRow);

        const nextStudents = submit
          ? prev.students.map((st) =>
              st.id === uid
                ? {
                    ...st,
                    open_days: Array.from(new Set([...(st.open_days || []), n, Math.min(24, n + 1)])),
                  }
                : st
            )
          : prev.students;

        return { ...prev, submissions: nextSubs, students: nextStudents };
      });

      if (isLiveSupabase && updatedRow) {
        const sb = createSupabaseBrowserClient();
        const row = updatedRow as SubmissionRecord;
        if (sb && row.user_id && row.user_id !== "guest") {
          void sb.from("submissions").upsert(
            {
              user_id: row.user_id,
              n: row.n,
              status: row.status,
              podcast: row.podcast || {},
              article: row.article || "",
              answers: row.answers || {},
              speak_answers: row.speak_answers || {},
              writing: typeof row.writing === "string" ? { text: row.writing } : row.writing || {},
              film_text: row.film_text || "",
              cartoon_text: row.cartoon_text || "",
              reflection: row.reflection || "",
              practice: row.practice || {},
              submitted_at: row.submitted_at,
              updated_at: now,
            },
            { onConflict: "user_id,n" }
          );
        }
      }
    },
    [isLiveSupabase, profile.id]
  );

  const saveWritingFeedback = useCallback(
    (record: WritingFeedbackRecord) => {
      setState((prev) => {
        const idx = prev.writingFeedback.findIndex(
          (w) => w.user_id === record.user_id && w.n === record.n
        );
        const next = [...prev.writingFeedback];
        if (idx >= 0) next[idx] = record;
        else next.push(record);
        return { ...prev, writingFeedback: next };
      });

      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb && record.user_id && record.user_id !== "guest") {
          void sb.from("writing_feedback").upsert(
            {
              user_id: record.user_id,
              n: record.n,
              feedback: record.feedback || {},
              model: record.model || {},
              band: record.band ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,n" }
          );
        }
      }
    },
    [isLiveSupabase]
  );

  const addRecording = useCallback(
    (rec: Omit<RecordingRecord, "id" | "created_at">) => {
      setState((prev) => ({
        ...prev,
        recordings: [
          { ...rec, id: `rec-${Date.now()}`, created_at: new Date().toISOString() },
          ...prev.recordings,
        ],
      }));
    },
    []
  );

  const setPace = useCallback(
    (pace: 24 | 48) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === prev.currentUserId ? { ...s, pace } : s
        ),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.rpc("set_my_pace", { p_pace: pace });
      }
    },
    [isLiveSupabase]
  );

  const chooseGroup = useCallback(
    (groupId: string) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === prev.currentUserId ? { ...s, group_id: groupId } : s
        ),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.rpc("choose_group", { p_group_id: groupId });
      }
    },
    [isLiveSupabase]
  );

  const addStudySeconds = useCallback(
    (day: number, seconds: number) => {
      setState((prev) => ({
        ...prev,
        homeworkTime: {
          ...prev.homeworkTime,
          [day]: (prev.homeworkTime[day] || 0) + seconds,
        },
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.rpc("hw_time", { p_day: day, p_add_seconds: seconds });
      }
    },
    [isLiveSupabase]
  );

  const saveTestResult = useCallback(
    (result: TestResultRecord) => {
      setState((prev) => {
        const idx = prev.testResults.findIndex(
          (tr) => tr.test_id === result.test_id && tr.user_id === result.user_id
        );
        const next = [...prev.testResults];
        if (idx >= 0) next[idx] = result;
        else next.push(result);
        return { ...prev, testResults: next };
      });
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb && result.user_id && result.user_id !== "guest") {
          void sb.from("test_results").upsert(
            {
              user_id: result.user_id,
              test_id: result.test_id,
              status: result.status,
              answers: result.answers,
              flagged: result.flagged || [],
              score: result.score,
              total: result.total,
              band: result.band,
              finished_at: result.finished_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,test_id" }
          );
        }
      }
    },
    [isLiveSupabase]
  );

  const addVocabWord = useCallback(
    (word: Omit<VocabItem, "id" | "created_at">) => {
      const uid = state.currentUserId || profile.id;
      const newItem: VocabItem = {
        ...word,
        id: `vocab-${Date.now()}`,
        user_id: uid,
        due_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setState((prev) => {
        if (prev.vocab.some((v) => v.word.toLowerCase() === word.word.trim().toLowerCase())) {
          return prev;
        }
        return { ...prev, vocab: [newItem, ...prev.vocab] };
      });

      if (isLiveSupabase && uid && uid !== "guest") {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb.from("vocab").upsert(
            {
              user_id: uid,
              word: word.word.trim(),
              ipa: word.ipa ?? null,
              uz: word.uz ?? null,
              en: word.en ?? null,
              example: word.example ?? null,
              day: word.day ?? null,
              status: word.status || "new",
            },
            { onConflict: "user_id,word" }
          );
        }
      }
    },
    [isLiveSupabase, state.currentUserId, profile.id]
  );

  const updateVocabStatus = useCallback(
    (id: string, correct: boolean) => {
      let updated: VocabItem | null = null;
      setState((prev) => ({
        ...prev,
        vocab: prev.vocab.map((v) => {
          if (v.id !== id) return v;
          const reps = correct ? (v.reps || 0) + 1 : 0;
          const interval = correct ? (reps === 1 ? 1 : reps === 2 ? 3 : Math.min(30, reps * 4)) : 0;
          const status: VocabItem["status"] =
            reps >= 4 ? "mastered" : reps >= 1 ? "learning" : "new";
          const due = new Date(Date.now() + interval * 86400_000).toISOString();
          updated = { ...v, reps, interval_days: interval, status, due_at: due };
          return updated;
        }),
      }));

      if (isLiveSupabase && updated) {
        const sb = createSupabaseBrowserClient();
        const u = updated as VocabItem;
        if (sb && !id.startsWith("vocab-")) {
          void sb
            .from("vocab")
            .update({
              reps: u.reps,
              interval_days: u.interval_days,
              status: u.status,
              due_at: u.due_at,
            })
            .eq("id", id);
        }
      }
    },
    [isLiveSupabase]
  );

  const deleteVocabWord = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, vocab: prev.vocab.filter((v) => v.id !== id) }));
      if (isLiveSupabase && !id.startsWith("vocab-")) {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.from("vocab").delete().eq("id", id);
      }
    },
    [isLiveSupabase]
  );

  const setReadingTopics = useCallback(
    (topics: string[]) => {
      const catalog = readingTopicsSeed as unknown as ReadingTopicCatalog[];
      setState((prev) => {
        const autoUnlocked = new Set(prev.readingUnlocked);
        for (const tKey of topics) {
          const topic = catalog.find((t) => t.key === tKey);
          if (topic?.arts?.[0]?.[0]) autoUnlocked.add(topic.arts[0][0]);
        }
        return {
          ...prev,
          readingTopicsSelected: topics,
          readingUnlocked: Array.from(autoUnlocked),
        };
      });
      if (isLiveSupabase && state.currentUserId) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("reading_prefs")
            .upsert({ user_id: state.currentUserId, topics, updated_at: new Date().toISOString() });
        }
      }
    },
    [isLiveSupabase, state.currentUserId]
  );

  const requestReadingArticle = useCallback(
    (articleId: string, articleTitle: string) => {
      const uid = state.currentUserId || profile.id;
      setState((prev) => {
        if (prev.readingRequests.some((r) => r.article_id === articleId && r.status === "pending")) {
          return prev;
        }
        const student = prev.students.find((s) => s.id === uid);
        return {
          ...prev,
          readingRequests: [
            {
              id: `req-${Date.now()}`,
              user_id: uid,
              student_name: student?.full_name || "Student",
              article_id: articleId,
              article_title: articleTitle,
              status: "pending",
              created_at: new Date().toISOString(),
            },
            ...prev.readingRequests,
          ],
        };
      });
      if (isLiveSupabase && uid && uid !== "guest") {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.from("reading_requests").insert({ user_id: uid, article: articleId });
      }
    },
    [isLiveSupabase, state.currentUserId, profile.id]
  );

  const saveReadingProgress = useCallback(
    (articleId: string, level: string, completed: boolean, score?: number) => {
      setState((prev) => ({
        ...prev,
        readingProgress: {
          ...prev.readingProgress,
          [articleId]: { level, completed, score },
        },
      }));
      if (isLiveSupabase && state.currentUserId) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb.from("reading_progress").upsert(
            {
              user_id: state.currentUserId,
              article: articleId,
              level,
              state: { completed, score },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,article,level" }
          );
        }
      }
    },
    [isLiveSupabase, state.currentUserId]
  );

  // Admin Mutations
  const adminCreateUser = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      password?: string;
      role: UserRole;
      group_id: string | null;
      level: string;
      pace: 24 | 48;
      open_days: number[];
    }): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.error || "Could not create user." };

        const created = json.user as ProfileRecord;
        setState((prev) => {
          if (prev.students.some((s) => s.email.toLowerCase() === created.email.toLowerCase())) {
            return prev;
          }
          return { ...prev, students: [created, ...prev.students] };
        });
        return {};
      } catch {
        return { error: "Network error while creating user." };
      }
    },
    []
  );

  const adminUpdateDay = useCallback(
    (n: number, data: CourseDay["data"], grammar2List?: GrammarQuestion[]) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.n === n ? { ...d, data, updated_at: now } : d)),
        grammar2: grammar2List
          ? { ...prev.grammar2, [String(n)]: grammar2List }
          : prev.grammar2,
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("days")
            .upsert({ n, data, ...(grammar2List ? { grammar2: grammar2List } : {}), updated_at: now });
        }
      }
    },
    [isLiveSupabase]
  );

  const adminUpdateAnswerKey = useCallback(
    (n: number, answers: string[], speakAnswers: string[]) => {
      setState((prev) => {
        const idx = prev.answerKeys.findIndex((k) => k.n === n);
        const next = [...prev.answerKeys];
        const rec = { n, answers, speak_answers: speakAnswers };
        if (idx >= 0) next[idx] = rec;
        else next.push(rec);
        return { ...prev, answerKeys: next };
      });
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb.from("answer_keys").upsert({
            n,
            answers,
            speak_answers: speakAnswers,
            updated_at: new Date().toISOString(),
          });
        }
      }
    },
    [isLiveSupabase]
  );

  const adminUpdateTest = useCallback(
    (test: TestRecord) => {
      setState((prev) => ({
        ...prev,
        tests: prev.tests.map((t) => (t.id === test.id ? test : t)),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("tests")
            .update({
              title: test.title,
              reveal: test.reveal,
              data: test.data,
              updated_at: new Date().toISOString(),
            })
            .eq("id", test.id);
        }
      }
    },
    [isLiveSupabase]
  );

  const adminCreateGroup = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("groups")
            .insert({ name: trimmed, open_days: [1] })
            .select("*")
            .single()
            .then(({ data }) => {
              if (data) {
                setState((prev) => ({ ...prev, groups: [...prev.groups, data as GroupRecord] }));
              }
            });
          return;
        }
      }
      setState((prev) => ({
        ...prev,
        groups: [
          ...prev.groups,
          { id: `grp-${Date.now()}`, name: trimmed, open_days: [1], created_at: new Date().toISOString() },
        ],
      }));
    },
    [isLiveSupabase]
  );

  const adminUpdateGroupOpenDays = useCallback(
    (groupId: string, openDays: number[]) => {
      setState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.id === groupId ? { ...g, open_days: openDays } : g)),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb.rpc("set_open_days", {
            p_target_type: "group",
            p_target_id: groupId,
            p_days: openDays,
          });
        }
      }
    },
    [isLiveSupabase]
  );

  const adminUpdateStudent = useCallback(
    (studentId: string, patch: Partial<ProfileRecord>) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === studentId ? { ...s, ...patch } : s)),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("profiles")
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq("id", studentId);
        }
      }
    },
    [isLiveSupabase]
  );

  const adminResetStudentProgress = useCallback(
    (studentId: string) => {
      setState((prev) => ({
        ...prev,
        submissions: prev.submissions.filter((s) => s.user_id !== studentId),
        testResults: prev.testResults.filter((tr) => tr.user_id !== studentId),
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, open_days: [1] } : s
        ),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb.from("submissions").delete().eq("user_id", studentId);
          void sb.from("test_results").delete().eq("user_id", studentId);
          void sb.from("profiles").update({ open_days: [1] }).eq("id", studentId);
        }
      }
    },
    [isLiveSupabase]
  );

  const adminDeleteStudent = useCallback(
    (studentId: string) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== studentId),
        submissions: prev.submissions.filter((s) => s.user_id !== studentId),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) void sb.from("profiles").delete().eq("id", studentId);
      }
    },
    [isLiveSupabase]
  );

  const adminResolveReadingRequest = useCallback(
    (reqId: string, approve: boolean) => {
      let targetReq: ReadingRequestRecord | undefined;
      setState((prev) => {
        targetReq = prev.readingRequests.find((r) => r.id === reqId);
        const unlocked = new Set(prev.readingUnlocked);
        if (approve && targetReq) unlocked.add(targetReq.article_id);
        return {
          ...prev,
          readingUnlocked: Array.from(unlocked),
          readingRequests: prev.readingRequests.map((r) =>
            r.id === reqId ? { ...r, status: approve ? "approved" : "declined" } : r
          ),
        };
      });
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("reading_requests")
            .update({ status: approve ? "approved" : "declined" })
            .eq("id", reqId);
          if (approve && targetReq) {
            void sb.from("reading_unlocks").insert({
              user_id: targetReq.user_id,
              article: targetReq.article_id,
              unlocked_by: state.currentUserId || null,
            });
          }
        }
      }
    },
    [isLiveSupabase, state.currentUserId]
  );

  const adminAddTeacherNote = useCallback(
    (userId: string, day: number, note: string) => {
      setState((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.user_id === userId && s.n === day ? { ...s, teacher_note: note } : s
        ),
      }));
      if (isLiveSupabase) {
        const sb = createSupabaseBrowserClient();
        if (sb) {
          void sb
            .from("submissions")
            .update({ teacher_note: note })
            .eq("user_id", userId)
            .eq("n", day);
        }
      }
    },
    [isLiveSupabase]
  );

  // Auth handlers
  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => ({
      ...prev,
      role,
      currentUserId: role === "admin" || role === "teacher" ? LOCAL_ADMIN_ID : LOCAL_STUDENT_ID,
    }));
  }, []);

  const loginDemo = useCallback((role: UserRole, email?: string) => {
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      role,
      currentUserId: role === "admin" || role === "teacher" ? LOCAL_ADMIN_ID : LOCAL_STUDENT_ID,
      students: email
        ? prev.students.map((s) =>
            s.id === (role === "admin" ? LOCAL_ADMIN_ID : LOCAL_STUDENT_ID) ? { ...s, email } : s
          )
        : prev.students,
    }));
  }, []);

  const signInSupabase = useCallback(
    async (email: string, password: string) => {
      const sb = createSupabaseBrowserClient();
      if (!sb) {
        setState((prev) => ({ ...prev, isLoggedIn: true }));
        return {};
      }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      await loadFromSupabase();
      return {};
    },
    [loadFromSupabase]
  );

  const signUpSupabase = useCallback(
    async (email: string, password: string, fullName: string) => {
      const sb = createSupabaseBrowserClient();
      if (!sb) {
        setState((prev) => ({ ...prev, isLoggedIn: true }));
        return {};
      }
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      await loadFromSupabase();
      return {};
    },
    [loadFromSupabase]
  );

  const logout = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    if (sb) await sb.auth.signOut();
    setState((prev) => ({ ...prev, isLoggedIn: false }));
  }, []);

  const resetLocalSeed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createCleanState(false));
  }, []);

  const value: AppContextValue = {
    ready,
    isLiveSupabase,
    isLoggedIn: state.isLoggedIn,
    profile,
    isAdmin,
    days: state.days,
    grammar2: state.grammar2,
    films: (filmsSeed as unknown as { films: FilmItem[]; cartoons: CartoonItem[] }).films,
    cartoons: (filmsSeed as unknown as { films: FilmItem[]; cartoons: CartoonItem[] }).cartoons,
    filmSamples: filmSamplesSeed as unknown as Record<string, string>,
    tests: state.tests,
    groups: state.groups,
    students: state.students,
    submissions: state.submissions,
    writingFeedback: state.writingFeedback,
    vocab: state.vocab,
    recordings: state.recordings,
    testResults: state.testResults,
    answerKeys: state.answerKeys,
    homeworkTime: state.homeworkTime,
    ranking: state.ranking,
    readingTopics: readingTopicsSeed as unknown as ReadingTopicCatalog[],
    readingTopicsSelected: state.readingTopicsSelected,
    readingUnlocked: state.readingUnlocked,
    readingRequests: state.readingRequests,
    readingProgress: state.readingProgress,
    switchRole,
    loginDemo,
    signInSupabase,
    signUpSupabase,
    logout,
    isDayOpen,
    getSubmission,
    saveSubmission,
    saveWritingFeedback,
    addRecording,
    setPace,
    chooseGroup,
    addStudySeconds,
    saveTestResult,
    addVocabWord,
    updateVocabStatus,
    deleteVocabWord,
    setReadingTopics,
    requestReadingArticle,
    saveReadingProgress,
    adminCreateUser,
    adminUpdateDay,
    adminUpdateAnswerKey,
    adminUpdateTest,
    adminCreateGroup,
    adminUpdateGroupOpenDays,
    adminUpdateStudent,
    adminResetStudentProgress,
    adminDeleteStudent,
    adminResolveReadingRequest,
    adminAddTeacherNote,
    resetLocalSeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
