// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

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

export interface FeedbackQuestion {
  feedbackQuestionId: string;
  content?: string;
  order?: number;
}

export interface FeedbackAnswer {
  feedbackAnswerId: string;
  content?: string;
  order?: number;
}

export interface FeedbackQuestionResponse {
  feedbackQuestion: FeedbackQuestion;
  feedbackAnswers?: FeedbackAnswer[];
}

export interface StudentFeedbackLecturerResult {
  feedbackLecturerId: string;
  className: string;
  lecturerName: string;
  lecturerUsername: string;
  subjectName: string;
  studentId: string;
  status: boolean;
  description: string;
  comment1: string;
  comment2: string;
  termId: string;
  chosenAnswers?: Record<string, string>;
  questions?: FeedbackQuestionResponse[];
  templateString?: string | null;
  html?: string | null;
}

export interface FeedbackStatus {
  unDoneFeedbacks: StudentFeedbackLecturerResult[];
  feedbacks: StudentFeedbackLecturerResult[];
  hasFeedback: boolean;
  hasFavoriteSubjects: boolean;
}

export interface FeedbackAnswerUpdate {
  feedbackLecturerId: string;
  studentId: string;
  feedbackQuestionId: string;
  feedbackAnswerId: string;
}

export interface FeedbackCommentUpdate {
  feedbackLecturerId: string;
  studentId: string;
  comment: string;
}

export interface FeedbackStatusUpdate {
  feedbackLecturerId: string;
  studentId: string;
  status: boolean;
}

export interface StudentHomeWork {
  homeWorkStudentId: string;
  homeworkId: string;
  courseId: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  teacherUsername: string;
  homeworkTitle: string;
  homeworkContent: string;
  fromDateTime: string;
  expiredDateTime: string;
  homeworkFiles: string[];
  studentId: string;
  studentName: string;
  rollNumber: string;
  studentFiles: string[];
  isClosed: boolean;
  isDone: boolean;
  completedAt: string;
  studentContent: string;
  studentTitle: string;
  teacherComment: string;
  mark: number | null;
  campusId: string;
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

export interface NotificationType {
  notificationTypeId: string;
  code: string;
  description: string;
  isCommon: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface Notification {
  notificationId: string;
  notificationTypeId: string;
  fromUserId: string;
  groupId: string;
  relationId: string;
  userId: string;
  appliedUserId: string;
  isRead: boolean;
  canBroadcast: boolean;
  previousValueJson: string;
  currentValueJson: string;
  title: string;
  content: string;
  campusId: string;
  userType: string;
  createdDate: string;
  updatedDate: string;
}

export interface NotificationsResult {
  numberOfUnreadNotifications: number;
  notifications: Notification[];
}

export interface MenuItem {
  menuId: string;
  name: string;
  description: string;
  level: number;
  parentMenuId: string;
  roleId: string;
  order: number;
  isMobile: boolean;
  segment1: string;
  path: string;
  iconType: string;
  icon: string;
  clazz: string | null;
  groupTitle: boolean;
  badge: string;
  badgeClass: string;
  createdDate: string;
  updatedDate: string;
}

export interface User {
  id: string;
  campusId: string;
  name: string;
  userName: string;
  rollNumber: string;
  userType: string;
  isActive: boolean;
  email: string;
  emailFe: string;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  googleMeetLink: string;
  gender: boolean;
  alternativeEmail: string | null;
  citizenCardId: string | null;
  lastLoginedInAt: string | null;
  hasInstalledAppMobile: boolean;
}

export interface Student {
  studentId: string;
  rollNumber: string;
  altStudentCode: string;
  middleName: string | null;
  cardID: string;
  dateOfIssue: string | null;
  placeOfIssue: string | null;
  address: string;
  street: string;
  ward: string;
  province: string;
  homePhone: string | null;
  enrolDate: string | null;
  academicStartYear: number;
  academicEndYear: number;
  currentStatus: boolean;
  currentStatusNote: string | null;
  healthInsuranceNumber: string | null;
  externalID: string;
  nationality: string | null;
  ethnicity: string | null;
  religion: string | null;
  login: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isAvailable: boolean;
  gender: boolean;
  dateOfBirth: string;
  campusId: string;
  isIssuedAccount: boolean;
  isChangedPassword: boolean;
  isActive: boolean;
  synchronizedUserIdWithFeId: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface TimeSlot {
  timeSlotId: string;
  slot: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  slotLabel: string;
  termId: string;
  campusId: string;
  isAttendance: boolean;
  createdDate: string;
  updatedDate: string;
  logs: unknown;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  startDateTime: string;
  endDateTime: string;
  roomNo: string;
  lecturerName: string;
  subjectName: string;
  expectedStyle: string | null;
  schedulePlanContent: string;
  flmSessionNo: number;
  className: string;
  slotNo: number;
  timeSlotId: string;
  status: string;
  hasAbsenceRequest: boolean;
  absenceRequestReason: string | null;
  comment: string | null;
  proctorComment: string | null;
  eduNextUrl: string | null;
  googleMeetLink: string | null;
}

export interface SurveyLink {
  status: boolean;
  data: unknown;
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
