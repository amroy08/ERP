// Core ERP Types

export type Role = 'super_admin' | 'admin' | 'principal' | 'teacher' | 'clerk' | 'clerk' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profilePhoto?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  schoolId?: string | null;
  permissions: string[];
  student?: {
    id: string;
    fullName: string;
    admissionNumber: string;
    classId: string;
    sectionId?: string;
    balanceDue?: number;
  };
  teacher?: {
    id: string;
  };
  parent?: {
    id: string;
    fatherName: string;
    children: Array<{
      id: string;
      fullName: string;
      classId: string;
    }>;
  };
}

export type PermissionType = 
  | 'student:view' | 'student:create' | 'student:update' | 'student:delete' | 'student:export'
  | 'admission:view' | 'admission:create' | 'admission:update' | 'admission:delete' | 'admission:approve'
  | 'teacher:view' | 'teacher:create' | 'teacher:update' | 'teacher:delete'
  | 'staff:view' | 'staff:create' | 'staff:update' | 'staff:delete'
  | 'attendance:view' | 'attendance:mark' | 'attendance:export'
  | 'fee:view' | 'fee:create' | 'fee:collect' | 'fee:export' | 'fee:report'
  | 'exam:view' | 'exam:create' | 'exam:update' | 'exam:marks_entry'
  | 'class:view' | 'class:create' | 'class:update' | 'class:delete'
  | 'notice:view' | 'notice:create' | 'notice:update' | 'notice:delete'
  | 'homework:view' | 'homework:create' | 'homework:update' | 'homework:delete'
  | 'timetable:view' | 'timetable:manage'
  | 'enquiry:view' | 'enquiry:create' | 'enquiry:update'
  | 'transport:view' | 'transport:manage'
  | 'library:view' | 'library:manage'
  | 'inventory:view' | 'inventory:manage'
  | 'report:view' | 'report:export'
  | 'settings:view' | 'settings:update'
  | 'role:view' | 'role:manage'
  | 'dashboard:view' | 'dashboard:full';

export interface School {
  id: string;
  name: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  principalName?: string;
  establishedYear?: number;
  board?: string;
  currency: string;
  currencySymbol: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  scopedSchoolId?: string | null;
  scopedSchoolName?: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Student
export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePhoto?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  religion?: string;
  category?: string;
  class: ClassDoc & { name: string };
  section: SectionDoc & { name: string };
  academicYear: string;
  house?: string;
  parent: Parent;
  address: Address;
  emergencyContact: { name: string; phone: string; relation: string };
  medicalNote?: string;
  status: 'active' | 'inactive' | 'transferred' | 'alumni';
  createdAt: string;
  leaveRequests?: LeaveRequest[];
  activityLogs?: ActivityLog[];
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  studentId: string;
  action: string;
  description?: string;
  performedBy?: string;
  createdAt: string;
}

export interface Parent {
  id: string;
  fatherName: string;
  motherName?: string;
  fatherPhone: string;
  motherPhone?: string;
  email: string;
  fatherOccupation?: string;
  children: string[];
  address: Address;
}

export interface Teacher {
  id: string;
  userId: string;
  user?: {
    name: string;
    fullName: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
  };
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePhoto?: string;
  email: string;
  phone: string;
  qualification: string;
  subjects: SubjectDoc[];
  assignedClasses: ClassDoc[];
  classTeacherOf: SectionDoc[];
  joiningDate: string;
  salary?: number;
  status: 'active' | 'inactive' | 'resigned';
}

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  joiningDate: string;
  status: 'active' | 'inactive' | 'resigned';
}

export interface ClassDoc {
  id: string;
  name: string;
  numericValue: number;
  sections: SectionDoc[];
  subjects: SubjectDoc[];
  maxStrength: number;
  isActive: boolean;
}

export interface SectionDoc {
  id: string;
  name: string;
  class: string;
  classTeacher?: Teacher;
  maxStrength: number;
}

export interface SubjectDoc {
  id: string;
  name: string;
  code: string;
  isOptional: boolean;
  isActive: boolean;
  class?: { id: string; name: string };
  teacher?: { id: string; fullName: string; profilePhoto?: string; user?: { name: string; profilePhoto?: string } };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Admission {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  classAppliedFor: string;
  fatherName: string;
  parentPhone: string;
  parentEmail?: string;
  status: 'new' | 'under_review' | 'accepted' | 'rejected' | 'converted' | 'enrolled';
  applicationNo?: string;
  remarks?: string;
  dateOfBirth?: string;
  enquiryDate: string;
  assignedFees?: { 
    feeStructureId: string; 
    customAmount?: number;
    feeStructure: { name: string; amount: number; category: string } 
  }[];
  createdAt: string;
}

export interface FeeStructureDoc {
  id: string;
  name: string;
  totalAmount: number;
  components: Array<{
    category: string;
    name: string;
    amount: number;
    frequency: string;
  }>;
  classId?: string;
  class?: { name: string };
  academicYear?: { name: string };
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  dueDate: string;
  fileUrl?: string;
  assignedById: string;
  subject?: SubjectDoc;
  section?: SectionDoc;
  assignedBy?: Teacher;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'text' | 'file';
  fileUrl?: string;
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  createdBy: { name: string };
  createdAt: string;
}

export interface Enquiry {
  id: string;
  visitorName: string;
  parentName?: string;
  phone: string;
  purpose: string;
  classEnquiry?: string;
  status: 'new' | 'contacted' | 'follow_up' | 'closed' | 'converted';
  remarks?: string;
  followUpDate?: string;
  enquiryDate: string;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  student: Student;
  receiptNumber: string;
  amountPaid: number;
  totalFee: number;
  balanceDue: number;
  paymentDate: string;
  paymentMode: string;
  collectedBy: { name: string };
}

export interface Exam {
  id: string;
  name: string;
  type: string;
  class: ClassDoc;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface DashboardStats {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    pendingAdmissions: number;
    totalEnquiries: number;
    monthlyFeeCollection: number;
  };
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
    total: number;
  };
  recentNotices: Notice[];
  upcomingExams: Exam[];
  studentsByClass: Array<{ class: string; count: number }>;
  admissionChartData: Array<{ month: string; count: number }>;
  attendanceTrend: Array<{ id: { date: string; status: string }; count: number }>;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

// Library
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
}

// Inventory
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}
