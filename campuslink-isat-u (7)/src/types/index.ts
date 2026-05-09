export type UserRole = 'student' | 'professor' | 'registrar';

export interface UserProfile {
  uid: string;
  studentId: string;
  surname: string;
  firstName: string;
  role: UserRole;
  college?: string;
  program?: string;
  yearLevel?: number;
  address?: string;
  contact?: string;
  maxUnits: number;
}

export interface Subject {
  id: string;
  code: string;
  title: string;
  units: number;
  prerequisites: string[];
  yearLevel: number;
  semester: '1' | '2' | 'Summer';
  status: 'open' | 'full';
  college: string;
  section: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  subjectId: string;
  academicYear: string;
  semester: string;
  status: 'pending' | 'approved' | 'dropped' | 'pending_drop';
  requestedAt: Date;
}

export interface Grade {
  id: string;
  userId: string;
  subjectId: string;
  professorId: string;
  grade: number;
  status: 'pending' | 'posted';
  academicYear: string;
  semester: string;
}

export interface SystemConfig {
  currentSemester: string;
  currentAcademicYear: string;
  midtermDate: Date;
}
