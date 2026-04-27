export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  CLERK: 'clerk',
  PARENT: 'parent',
  STUDENT: 'student',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard:view', 'student:view', 'student:create', 'student:update', 'student:delete',
    'teacher:view', 'teacher:create', 'teacher:update', 'teacher:delete',
    'staff:view', 'staff:create', 'staff:update', 'staff:delete',
    'admission:view', 'admission:create', 'admission:update', 'admission:delete',
    'attendance:view', 'attendance:mark', 'fee:view', 'fee:create', 'fee:update', 'fee:delete', 'fee:collect',
    'exam:view', 'exam:create', 'exam:update', 'exam:delete',
    'notice:view', 'notice:create', 'notice:update', 'notice:delete',
    'enquiry:view', 'enquiry:create', 'enquiry:update',
    'class:view', 'class:create', 'class:update', 'class:delete',
    'report:view', 'settings:view', 'settings:update',
    'transport:view', 'library:view', 'inventory:view',
    'homework:view', 'homework:create', 'timetable:view',
  ],
  admin: [
    'dashboard:view', 'student:view', 'student:create', 'student:update', 'student:delete',
    'teacher:view', 'teacher:create', 'teacher:update',
    'staff:view', 'staff:create',
    'admission:view', 'admission:create', 'admission:update',
    'attendance:view', 'attendance:mark',
    'fee:view', 'fee:create', 'fee:collect',
    'exam:view', 'exam:create', 'exam:update',
    'notice:view', 'notice:create', 'notice:update',
    'enquiry:view', 'enquiry:create', 'enquiry:update',
    'class:view', 'class:create', 'report:view', 'settings:view',
  ],
  principal: [
    'dashboard:view', 'student:view', 'teacher:view', 'staff:view',
    'attendance:view', 'attendance:mark', 'fee:view',
    'exam:view', 'exam:create', 'exam:update',
    'notice:view', 'notice:create', 'report:view', 'class:view', 'settings:view',
  ],
  teacher: [
    'dashboard:view', 'student:view', 'attendance:view', 'attendance:mark',
    'exam:view', 'notice:view',
    'homework:view', 'homework:create', 'timetable:view', 'class:view',
  ],
  clerk: [
    'dashboard:view', 'student:view', 'admission:view', 'admission:create', 'admission:update',
    'enquiry:view', 'enquiry:create', 'enquiry:update',
    'fee:view', 'fee:create', 'fee:collect', 'report:view',
    'notice:view',
  ],
  parent: [
    'dashboard:view', 'student:view', 'attendance:view', 'fee:view', 'exam:view', 'notice:view', 'homework:view',
  ],
  student: [
    'dashboard:view', 'attendance:view', 'fee:view', 'exam:view', 'notice:view', 'homework:view', 'timetable:view',
  ],
};

export const APP_NAME = 'Vidya Public School ERP';
export const SCHOOL_NAME = 'Vidya Public School';
export const CURRENT_ACADEMIC_YEAR = '2025-2026';
