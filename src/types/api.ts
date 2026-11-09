export type Role = 'STUDENT' | 'LECTURER' | 'DEPT_ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type SemesterType = 'FIRST' | 'SECOND';
export type ResultStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type SheetStatus = ResultStatus | 'NOT_STARTED';

export interface Semester {
  id: string;
  type: SemesterType;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  session: { id: string; name: string } | null;
  label: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  semesters: Semester[];
}

export interface Ref {
  id: string;
  name: string;
  code: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  lastLoginAt: string | null;
  department: (Ref & { faculty: Ref | null }) | null;
  studentProfile: {
    matricNumber: string;
    level: number;
    entryYear: number;
    gender: string | null;
    dateOfBirth: string | null;
    address: string | null;
    program: (Ref & { degree: string }) | null;
  } | null;
  lecturerProfile: { staffNumber: string; title: string | null; rank: string | null } | null;
  permissions: string[];
  currentSemester: Semester | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  department: Ref | null;
  studentProfile: {
    matricNumber: string;
    level: number;
    entryYear: number;
    gender: string | null;
    dateOfBirth: string | null;
    address: string | null;
    program: Ref | null;
  } | null;
  lecturerProfile: { staffNumber: string; title: string | null; rank: string | null } | null;
}

export interface Faculty extends Ref {
  departmentCount: number;
}

export interface Department extends Ref {
  facultyId: string;
  faculty: Ref;
  programCount: number;
  courseCount: number;
  studentCount: number;
  lecturerCount: number;
}

export interface Program extends Ref {
  departmentId: string;
  degree: string;
  durationYears: number;
  levels: number[];
  studentCount: number;
  department: Ref;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  units: number;
  level: number;
  semesterType: SemesterType;
  isActive: boolean;
  department: Ref | null;
  programs: Ref[];
}

export interface Allocation {
  id: string;
  course: Course;
  semester: Semester;
  lecturer: { id: string; fullName: string; email: string; title: string | null; staffNumber: string | null };
  createdAt: string;
}

export interface AvailableCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  level: number;
  semesterType: SemesterType;
  department: Ref | null;
  lecturer: string | null;
  registrationId: string | null;
  locked: boolean;
}

export interface AvailableCourses {
  semester: Semester;
  student: {
    fullName: string;
    matricNumber: string;
    level: number;
    program: { id: string; name: string };
    department: { id: string; name: string } | null;
  };
  maxUnits: number;
  registeredUnits: number;
  courses: AvailableCourse[];
}

export interface RegistrationSlip {
  semester: Semester;
  student: {
    fullName: string;
    email: string;
    matricNumber: string;
    level: number;
    program: string;
    department: string | null;
  };
  registrations: {
    id: string;
    registeredAt: string;
    course: { id: string; code: string; title: string; units: number; department: string | null };
  }[];
  totalUnits: number;
}

export interface RegistrationRow {
  id: string;
  registeredAt: string;
  student: { id: string; fullName: string; email: string; matricNumber: string | null; level: number | null; program: string | null };
  course: { id: string; code: string; title: string; units: number };
  semester: Semester | null;
}

export interface SheetRow {
  registrationId: string;
  student: { id: string; fullName: string; matricNumber: string; level: number | null; program: string | null };
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradePoint: number | null;
}

export interface SheetSummary {
  registered: number;
  graded: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  passRate: number | null;
  distribution: Record<string, number>;
}

export interface SheetView {
  sheetId: string | null;
  status: SheetStatus;
  course: { id: string; code: string; title: string; units: number; level: number; department: Ref | null };
  semester: Semester;
  lecturer: { id: string; fullName: string; email: string } | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  rows: SheetRow[];
  summary: SheetSummary;
  capabilities: { canView: boolean; canEdit: boolean; canSubmit: boolean; canReview: boolean; canReopen: boolean };
}

export interface SheetListItem {
  id: string;
  status: ResultStatus;
  course: { id: string; code: string; title: string; units: number; level: number; department: { code: string; name: string } | null };
  semester: Semester;
  lecturer: { id: string; fullName: string } | null;
  reviewedBy: { id: string; fullName: string } | null;
  entries: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  updatedAt: string;
}

export interface TeachingCourse {
  allocationId: string;
  course: { id: string; code: string; title: string; units: number; level: number; department: string | null };
  registeredStudents: number;
  resultStatus: SheetStatus;
  sheetId: string | null;
  reviewComment: string | null;
  submittedAt: string | null;
}

export interface HistoryItem {
  id: string;
  action: string;
  actor: { id: string; fullName: string; role: string | null } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StudentResults {
  student: { fullName: string; matricNumber: string; level: number; program: string | null; department: string | null };
  semesters: {
    semester: { id: string; label: string; type: SemesterType; session: string };
    courses: {
      code: string;
      title: string;
      units: number;
      caScore: number | null;
      examScore: number | null;
      totalScore: number | null;
      grade: string | null;
      gradePoint: number;
    }[];
    totalUnits: number;
    totalGradePoints: number;
    gpa: number;
    cumulativeUnits: number;
    cgpa: number;
  }[];
  cgpa: number;
  totalUnits: number;
  classOfDegree: string | null;
}

export interface GradeBand {
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
  remark: string;
}

export interface AcademicSettings {
  gradeScale: GradeBand[];
  caMaxScore: number;
  examMaxScore: number;
  maxUnitsPerSemester: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  actorRole: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: { id: string; fullName: string; email: string } | null;
  actorRole: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}
