export interface Term {
  termId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  isHidden: boolean;
  isClosed: boolean;
  isFee: boolean;
  termOrder: number;
  academicStartYear: number;
  academicEndYear: number;
  isCurrentTerm: boolean;
  campusId: string;
  campusId1: string;
  campusId2: string;
  isMultiCampus: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface FeedbackStatus {
  unDoneFeedbacks: unknown[];
  feedbacks: unknown[];
  hasFeedback: boolean;
  hasFavoriteSubjects: boolean;
}

export interface Course {
  courseId: string;
  studentId: string;
  subjectName: string;
  lecturerName: string | null;
  averageMark: string;
  averageMarkCN: string;
  commentGK: string;
  comment: string | null;
  commentCN: string;
  isJustUpdatedAverageMark: boolean;
  isMain: boolean;
  isFPT: boolean;
  showingMarkOnStudentPage: boolean;
  markDTO: Record<string, unknown>;
}

export interface BlockMarkPeriod {
  blockMarkPeriodId: string;
  blockMarkPeriodCode: string;
  description: string;
  startDate: string;
  endDate: string;
  termId: string;
  campusId: string;
  isCommon: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface MainClass {
  classId: string;
  classTypeId: string;
  classType: unknown;
  className: string;
  startYear: number;
  endYear: number;
  teacherLogin: string;
  gradeId: string;
  observers: unknown;
  giaoVienBanTru: string;
  noReport: boolean;
  campusId: string;
  campusId1: string;
  campusId2: string;
  isMultiCampus: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface MarkCommon {
  courseId: string;
  studentId: string;
  subjectName: string;
  lecturerName: string | null;
  averageMark: string;
  averageMarkCN: string;
  commentGK: string;
  comment: string | null;
  commentCN: string;
  isJustUpdatedAverageMark: boolean;
  isMain: boolean;
  isFPT: boolean;
  showingMarkOnStudentPage: boolean;
  markDTO: Record<string, unknown>;
}

export interface KqrlResult {
  studentId: string;
  termResult: {
    termId: string;
    termName: string;
    average: string | null;
    capacity: string | null;
    rankConduct: string | null;
    reasonDown: string | null;
    comment: string | null;
  };
  academicResult: unknown;
}

export interface Grade {
  gradeId: string;
  gradeCode: string;
  schoolType: number;
  description: string;
  createdDate: string;
  updatedDate: string;
}

export interface Club {
  clubId: string;
  clubName: string;
  termId: string;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface DisciplineLevel {
  disciplineLevelId: string;
  academicString: string;
  disciplineLevelNumber: number;
  description: string;
  rankConductId: string;
  rankConduct: unknown;
  isActive: boolean;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface DisciplineRuleStudent {
  disciplineRuleStudentId: string;
  disciplineRuleId: string;
  studentId: string;
  description: string;
  date: string;
  academic: string;
  disciplineLevelId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface DisciplineRule {
  disciplineRuleId: string;
  code: string;
  description: string;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface RewardBonusType {
  rewardBonusTypeId: string;
  code: string;
  description: string;
  campusId: string;
  isCommon: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface RewardFrequency {
  rewardFrequencyId: string;
  code: string;
  description: string;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface RewardStudent {
  rewardStudentId: string;
  rewardId: string;
  reward: unknown;
  studentId: string;
  date: string | null;
  academic: string;
  description: string;
  descriptionEnglish: string | null;
  rewardBonusTypeId: string;
  rewardBonusType: unknown;
  bonusDetail: unknown;
  decisionCode: string | null;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface Reward {
  rewardId: string;
  code: string;
  title: string;
  nameEnglish: string;
  description: string;
  decisionCode: string;
  date: string;
  startYear: number;
  rewardFrequencyId: string;
  organization: string;
  isShowMark: boolean;
  isCommon: boolean;
  hasTeacherRegister: boolean;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface EventStudent {
  event: {
    eventId: string;
    eventCode: string;
    eventNameEnglish: string;
    eventTypeId: string;
    eventType: unknown;
    termId: string;
    organization: string;
    numberOfSlots: number;
    registeredStartDate: string;
    registeredEndDate: string;
    startDate: string;
    endDate: string;
    feedbackStartDate: string;
    feedbackEndDate: string;
    location: string;
    currentOption: string;
    hasAttendance: boolean;
    hasIssuingCertificate: boolean;
    hasCreateStudent: boolean;
    eventGender: boolean;
    isMultiCampus: boolean;
    isCommon: boolean;
    isShowMark: boolean;
    title: string;
    content: string;
    campusId: string;
    campusId1: string;
    campusId2: string;
    approvedBy: unknown;
    isApproved: boolean;
    createdDate: string;
    updatedDate: string;
    logs: unknown;
  };
  eventStudent: unknown;
  currentServerDate: string;
  organization: unknown;
}

export interface Homework {
  homeWorkStudentId: string;
  homeWorkId: string;
  studentId: string;
  termId: string;
  subjectName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isDone: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface Campus {
  campusId: string;
  campusCode: string;
  flmCampusCode: string;
  eduNextLiteCampusCode: string;
  campusName: string;
  parentCampusCode: string;
  contact: string;
  provinceCode: string;
  parentCampusName: string;
  parentCampusNameEnglish: string;
  soGD: string;
  createdDate: string;
  updatedDate: string;
}

export interface ClubSubject {
  clubSubjectId: string;
  clubSubjectName: string;
  clubSubjectTypeId: string;
  description: string;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface ClubSubjectType {
  clubSubjectTypeId: string;
  clubSubjectTypeName: string;
  description: string;
  campusId: string;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface StudentContext {
  studentId: string;
  userId: string;
  email: string;
  username: string;
  campusId: string;
  campusCode: string;
  role: string;
  userType: string;
  termOrder: number;
  academicYear: string;
}
