import type {
  Term,
  FeedbackStatus,
  Course,
  BlockMarkPeriod,
  MainClass,
  MarkCommon,
  KqrlResult,
  Grade,
  Club,
  DisciplineLevel,
  DisciplineRuleStudent,
  DisciplineRule,
  RewardBonusType,
  RewardFrequency,
  RewardStudent,
  Reward,
  EventStudent,
  Homework,
  StudentContext,
} from "./types/fsp";

const BASE = "https://api.fpt.edu.vn/fsp/api";

function getToken(): string {
  const el = document.querySelector(
    'meta[name="Authorization"]',
  ) as HTMLMetaElement | null;
  if (el) return el.content.replace(/^Bearer\s+/i, "");

  const storage =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (storage) return storage;

  const match = document.cookie.match(/token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  throw new Error("No auth token found");
}

export function getStudentContext(): StudentContext {
  const token = getToken();
  const payload = JSON.parse(atob(token.split(".")[1]));
  const campusId = payload.campusId || payload.campusID;
  const campusCode = payload.campusCode || "";
  const raw = payload.projectCampuses;
  const termOrder = 1;
  let academicYear = "2026-2027";

  if (Array.isArray(raw)) {
    try {
      const parsed = typeof raw[0] === "string" ? JSON.parse(raw[0]) : raw[0];
      if (parsed?.RollNumber) {
        const match = parsed.RollNumber.match(/^(\d{2})(\d{2})/);
        if (match) {
          const y1 = 2000 + parseInt(match[1]);
          const y2 = y1 + 1;
          academicYear = `${y1}-${y2}`;
        }
      }
    } catch {
      // RollNumber parse failed — keep default academic year
    }
  }

  return {
    studentId: payload.userId || payload.sub,
    userId: payload.userId || payload.sub,
    email: payload.email || "",
    username: payload.username || "",
    campusId,
    campusCode,
    role: payload.role || "",
    userType: payload.userType || "",
    termOrder,
    academicYear,
  };
}

function gmFetch<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    };

    GM_xmlhttpRequest({
      method,
      url,
      headers,
      data: body != null ? JSON.stringify(body) : undefined,
      responseType: "json",
      onload(res) {
        if (res.status >= 200 && res.status < 300) {
          resolve(res.response as T);
        } else {
          reject(
            new Error(`HTTP ${res.status}: ${JSON.stringify(res.response)}`),
          );
        }
      },
      onerror(err) {
        reject(new Error(`Network error: ${err.statusText || "unknown"}`));
      },
    });
  });
}

function gmFetchRaw(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<{ status: number; response: unknown }> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      responseType: "json",
      onload(res) {
        resolve({ status: res.status, response: res.response });
      },
      onerror(err) {
        reject(new Error(`Network error: ${err.statusText || "unknown"}`));
      },
    });
  });
}

// --- Terms ---

export function getDefaultTerm(campusId: string): Promise<Term> {
  return gmFetch<Term>(
    `${BASE}/education-management/terms/get/default/${campusId}`,
  );
}

export function getTermsByCampus(campusId: string): Promise<Term[]> {
  return gmFetch<Term[]>(
    `${BASE}/education-management/terms/${campusId}/by-campus`,
  );
}

// --- Feedback ---

export function getFeedbackStatus(studentId: string): Promise<FeedbackStatus> {
  return gmFetch<FeedbackStatus>(
    `${BASE}/feedback-service/feedbacks/students/${studentId}/has-feedback`,
  );
}

// --- Courses ---

export function getCoursesByTerm(
  termId: string,
  studentId: string,
): Promise<Course[]> {
  return gmFetch<Course[]>(
    `${BASE}/education-management/courses/${termId}/${studentId}/by-term-student`,
  );
}

export function getAcademicYears(studentId: string): Promise<string[]> {
  return gmFetch<string[]>(
    `${BASE}/education-management/courses/academics/${studentId}/by-student`,
  );
}

export function getMarkCommonByStudent(
  academicYear: string,
  termOrder: number,
  studentId: string,
): Promise<MarkCommon[]> {
  return gmFetch<MarkCommon[]>(
    `${BASE}/education-management/courses/details/${academicYear}/${termOrder}/${studentId}/get-mark-common-by-student`,
  );
}

// --- Block Mark Periods ---

export function getBlockMarkPeriods(
  campusId: string,
): Promise<BlockMarkPeriod[]> {
  return gmFetch<BlockMarkPeriod[]>(
    `${BASE}/education-management/block-mark-periods/${campusId}`,
  );
}

// --- Classes ---

export function getMainClassesByStudent(
  studentId: string,
  termId: string,
): Promise<MainClass[]> {
  return gmFetch<MainClass[]>(
    `${BASE}/education-management/classes/${studentId}/${termId}/main-classes-by-student`,
  );
}

// --- KQRL (Learning Outcomes) ---

export function getKqrlByStudent(
  academicYear: string,
  termOrder: number,
  studentId: string,
): Promise<KqrlResult> {
  return gmFetch<KqrlResult>(
    `${BASE}/education-management/class-students/details/${academicYear}/${termOrder}/${studentId}/get-kqrl-by-student`,
  );
}

// --- NLPC (Attitude Quality) ---

export function getNlpcByStudent(
  academicYear: string,
  termOrder: number,
  studentId: string,
): Promise<void> {
  return gmFetchRaw(
    `${BASE}/education-management/attitude-quality-students/${academicYear}/${termOrder}/${studentId}/get-nlpc-by-student`,
  ).then(() => {});
}

// --- Grades ---

export function getGradesByCampus(campusId: string): Promise<Grade[]> {
  return gmFetch<Grade[]>(
    `${BASE}/identity-management/grades/${campusId}/by-campus`,
  );
}

// --- Clubs ---

export function getClubsByTerm(
  termId: string,
  studentId: string,
): Promise<Club[]> {
  return gmFetch<Club[]>(
    `${BASE}/education-management/clubs/${termId}/${studentId}/by-term-student`,
  );
}

// --- Homework ---

export function getUndoneHomework(
  studentId: string,
  termId: string,
): Promise<Homework[]> {
  return gmFetch<Homework[]>(
    `${BASE}/homework-service/home-work-students/${studentId}/${termId}/undone-home-work-student-by-term-id`,
  );
}

// --- Events ---

export function getEventsByTerm(
  termId: string,
  studentId: string,
): Promise<EventStudent[]> {
  return gmFetch<EventStudent[]>(
    `${BASE}/student-service/events/${termId}/${studentId}/by-term-student`,
  );
}

// --- Discipline ---

export function getDisciplineLevels(
  campusId: string,
): Promise<DisciplineLevel[]> {
  return gmFetch<DisciplineLevel[]>(
    `${BASE}/student-service/discipline-levels/${campusId}/by-campus`,
  );
}

export function getDisciplineRules(
  campusId: string,
): Promise<DisciplineRule[]> {
  return gmFetch<DisciplineRule[]>(
    `${BASE}/student-service/discipline-rules/${campusId}/by-campus`,
  );
}

export function getDisciplineRulesByStudent(
  studentId: string,
): Promise<DisciplineRuleStudent[]> {
  return gmFetch<DisciplineRuleStudent[]>(
    `${BASE}/student-service/discipline-rule-students/${studentId}/by-student`,
  );
}

// --- Rewards ---

export function getRewardBonusTypes(
  campusId: string,
): Promise<RewardBonusType[]> {
  return gmFetch<RewardBonusType[]>(
    `${BASE}/student-service/reward-bonus-types/${campusId}/by-campus`,
  );
}

export function getRewardFrequencies(
  campusId: string,
): Promise<RewardFrequency[]> {
  return gmFetch<RewardFrequency[]>(
    `${BASE}/student-service/reward-frequencies/${campusId}/by-campus`,
  );
}

export function getRewardsByCampus(campusId: string): Promise<Reward[]> {
  return gmFetch<Reward[]>(
    `${BASE}/student-service/rewards/${campusId}/by-campus`,
  );
}

export function getRewardsByStudent(
  studentId: string,
): Promise<RewardStudent[]> {
  return gmFetch<RewardStudent[]>(
    `${BASE}/student-service/reward-students/${studentId}/by-student`,
  );
}
