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
  Campus,
  ClubSubject,
  ClubSubjectType,
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

export async function getStudentContext(): Promise<StudentContext> {
  const token = getToken();
  const payload = JSON.parse(atob(token.split(".")[1]));
  const campusId = payload.campusId || payload.campusID;
  const campusCode = payload.campusCode || "";

  let termOrder = 1;
  let academicYear = "2026-2027";

  try {
    const term = await getDefaultTerm(campusId);
    termOrder = term.termOrder;
    academicYear = `${term.academicStartYear}-${term.academicEndYear}`;
  } catch {
    // Fallback to defaults if term fetch fails
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

// --- Campuses ---

export function getCampusesByIds(campusIds: string[]): Promise<Campus[]> {
  return gmFetch<Campus[]>(
    `${BASE}/identity-management/campuses/entities/ids`,
    "POST",
    campusIds,
  );
}

// --- Club Subjects ---

export function getClubSubjectsByIds(
  clubSubjectIds: string[],
): Promise<ClubSubject[]> {
  return gmFetch<ClubSubject[]>(
    `${BASE}/education-management/club-subjects/entities/ids`,
    "POST",
    clubSubjectIds,
  );
}

export function getClubSubjectTypesByIds(
  clubSubjectIds: string[],
): Promise<ClubSubjectType[]> {
  return gmFetch<ClubSubjectType[]>(
    `${BASE}/education-management/club-subject-types/by-club-subject-ids`,
    "POST",
    clubSubjectIds,
  );
}

export function getClubStudentStatistics(
  studentIds: string[],
): Promise<Record<string, unknown>> {
  return gmFetch<Record<string, unknown>>(
    `${BASE}/education-management/clubs/statistic/cache-students`,
    "POST",
    studentIds,
  );
}

export function getDiscountAndPriceByStudent(
  termId: string,
  studentId: string,
): Promise<unknown> {
  return gmFetch<unknown>(
    `${BASE}/education-management/clubs/discount-club-student/${termId}/${studentId}/get-discount-and-price-by-student`,
  );
}

// --- Events (extras) ---

export function getEventStatistics(
  eventIds: string[],
): Promise<Record<string, unknown>> {
  return gmFetch<Record<string, unknown>>(
    `${BASE}/student-service/events/statistic/students`,
    "POST",
    eventIds,
  );
}

export function getEventImages(
  eventIds: string[],
): Promise<Record<string, unknown>> {
  return gmFetch<Record<string, unknown>>(
    `${BASE}/student-service/events/images/by-id`,
    "POST",
    eventIds,
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
