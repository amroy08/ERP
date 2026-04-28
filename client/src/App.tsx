import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudentsListPage = lazy(() => import('./features/students/StudentsListPage').then(m => ({ default: m.StudentsListPage })));
const StudentProfilePage = lazy(() => import('./features/students/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })));
const StudentFormPage = lazy(() => import('./features/students/StudentFormPage').then(m => ({ default: m.StudentFormPage })));
const StudentAttendancePage = lazy(() => import('./features/students/StudentAttendancePage').then(m => ({ default: m.StudentAttendancePage })));
const TeachersListPage = lazy(() => import('./features/teachers/TeachersListPage').then(m => ({ default: m.TeachersListPage })));
const TeacherProfilePage = lazy(() => import('./features/teachers/TeacherProfilePage').then(m => ({ default: m.TeacherProfilePage })));
const TeacherFormPage = lazy(() => import('./features/teachers/TeacherFormPage').then(m => ({ default: m.TeacherFormPage })));
const StaffListPage = lazy(() => import('./features/staff/StaffListPage').then(m => ({ default: m.StaffListPage })));
const StaffProfilePage = lazy(() => import('./features/staff/StaffProfilePage').then(m => ({ default: m.StaffProfilePage })));
const StaffFormPage = lazy(() => import('./features/staff/StaffFormPage').then(m => ({ default: m.StaffFormPage })));
const ParentsListPage = lazy(() => import('./features/parents/ParentsListPage').then(m => ({ default: m.ParentsListPage })));
const AdmissionsListPage = lazy(() => import('./features/admissions/AdmissionsListPage').then(m => ({ default: m.AdmissionsListPage })));
const AdmissionFormPage = lazy(() => import('./features/admissions/AdmissionFormPage').then(m => ({ default: m.AdmissionFormPage })));
const ClassesPage = lazy(() => import('./features/classes/ClassesPage').then(m => ({ default: m.ClassesPage })));
const SubjectsPage = lazy(() => import('./features/subjects/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const SectionDashboardPage = lazy(() => import('./features/classes/SectionDashboardPage').then(m => ({ default: m.SectionDashboardPage })));
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const FeesPage = lazy(() => import('./features/fees/FeesPage').then(m => ({ default: m.FeesPage })));
const FeeCollectPage = lazy(() => import('./features/fees/FeeCollectPage').then(m => ({ default: m.FeeCollectPage })));
const FeeStructurePage = lazy(() => import('./features/fees/FeeStructurePage').then(m => ({ default: m.FeeStructurePage })));
const StudentFeesPage = lazy(() => import('./features/fees/StudentFeesPage').then(m => ({ default: m.StudentFeesPage })));
const ExamsPage = lazy(() => import('./features/exams/ExamsPage').then(m => ({ default: m.ExamsPage })));
const NoticesPage = lazy(() => import('./features/notices/NoticesPage').then(m => ({ default: m.NoticesPage })));
const EnquiriesPage = lazy(() => import('./features/enquiries/EnquiriesPage').then(m => ({ default: m.EnquiriesPage })));
const ReportsPage = lazy(() => import('./features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const RolesPage = lazy(() => import('./features/roles/RolesPage').then(m => ({ default: m.RolesPage })));
const TimetablePage = lazy(() => import('./features/timetable/TimetablePage').then(m => ({ default: m.TimetablePage })));
const HomeworkPage = lazy(() => import('./features/homework/HomeworkPage').then(m => ({ default: m.HomeworkPage })));
const TransportPage = lazy(() => import('./features/transport/TransportPage').then(m => ({ default: m.TransportPage })));
const ModuleManagementPage = lazy(() => import('./features/settings/ModuleManagementPage').then(m => ({ default: m.ModuleManagementPage })));
const FeeTransactionsPage = lazy(() => import('./features/fees/FeeTransactionsPage').then(m => ({ default: m.FeeTransactionsPage })));
const ArchivePage = lazy(() => import('./features/settings/ArchivePage').then(m => ({ default: m.ArchivePage })));
const SuperAdminSchoolsPage = lazy(() => import('./features/superadmin/SuperAdminSchoolsPage').then(m => ({ default: m.SuperAdminSchoolsPage })));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex items-center gap-3 text-slate-400">
      <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span className="text-sm">Loading...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute requiredPermission="dashboard:view">
                    <DashboardPage />
                  </ProtectedRoute>
                </Suspense>
              }
            />

            {/* Students */}
            <Route path="/students" element={<Suspense fallback={<PageLoader />}><StudentsListPage /></Suspense>} />
            <Route path="/students/new" element={<Suspense fallback={<PageLoader />}><StudentFormPage /></Suspense>} />
            <Route path="/students/:id" element={<Suspense fallback={<PageLoader />}><StudentProfilePage /></Suspense>} />
            <Route path="/students/:id/edit" element={<Suspense fallback={<PageLoader />}><StudentFormPage /></Suspense>} />
            <Route path="/students/:id/attendance" element={<Suspense fallback={<PageLoader />}><StudentAttendancePage /></Suspense>} />

            {/* Teachers */}
            <Route path="/teachers" element={<Suspense fallback={<PageLoader />}><TeachersListPage /></Suspense>} />
            <Route path="/teachers/new" element={<Suspense fallback={<PageLoader />}><TeacherFormPage /></Suspense>} />
            <Route path="/teachers/:id" element={<Suspense fallback={<PageLoader />}><TeacherProfilePage /></Suspense>} />
            <Route path="/teachers/:id/edit" element={<Suspense fallback={<PageLoader />}><TeacherFormPage /></Suspense>} />

            {/* Staff */}
            <Route path="/staff" element={<Suspense fallback={<PageLoader />}><StaffListPage /></Suspense>} />
            <Route path="/staff/new" element={<Suspense fallback={<PageLoader />}><StaffFormPage /></Suspense>} />
            <Route path="/staff/:id" element={<Suspense fallback={<PageLoader />}><StaffProfilePage /></Suspense>} />
            <Route path="/staff/:id/edit" element={<Suspense fallback={<PageLoader />}><StaffFormPage /></Suspense>} />

            {/* Parents */}
            <Route path="/parents" element={<Suspense fallback={<PageLoader />}><ParentsListPage /></Suspense>} />

            {/* Admissions */}
            <Route path="/admissions" element={<Suspense fallback={<PageLoader />}><AdmissionsListPage /></Suspense>} />
            <Route path="/admissions/new" element={<Suspense fallback={<PageLoader />}><AdmissionFormPage /></Suspense>} />

            {/* Classes */}
            <Route path="/classes" element={<Suspense fallback={<PageLoader />}><ClassesPage /></Suspense>} />
            <Route path="/academics/sections/:sectionId" element={<Suspense fallback={<PageLoader />}><SectionDashboardPage /></Suspense>} />
            <Route path="/subjects" element={<Suspense fallback={<PageLoader />}><SubjectsPage /></Suspense>} />

            {/* Attendance */}
            <Route path="/attendance/students" element={<Suspense fallback={<PageLoader />}><AttendancePage /></Suspense>} />
            <Route path="/attendance/staff" element={<Suspense fallback={<PageLoader />}><AttendancePage /></Suspense>} />
            <Route path="/attendance/reports" element={<Suspense fallback={<PageLoader />}><AttendancePage /></Suspense>} />

            {/* Fees */}
            <Route path="/fees" element={<Suspense fallback={<PageLoader />}><FeesPage /></Suspense>} />
            <Route path="/fees/structure" element={<Suspense fallback={<PageLoader />}><FeeStructurePage /></Suspense>} />
            <Route path="/fees/structures" element={<Suspense fallback={<PageLoader />}><FeeStructurePage /></Suspense>} />
            <Route path="/fees/collect" element={<Suspense fallback={<PageLoader />}><FeeCollectPage /></Suspense>} />
            <Route path="/fees/payments" element={<Suspense fallback={<PageLoader />}><FeeTransactionsPage /></Suspense>} />
            <Route path="/fees/dues" element={<Suspense fallback={<PageLoader />}><FeesPage /></Suspense>} />
            <Route path="/student/attendance" element={<Suspense fallback={<PageLoader />}><StudentAttendancePage /></Suspense>} />
            <Route path="/student/fees" element={<Suspense fallback={<PageLoader />}><StudentFeesPage /></Suspense>} />

            {/* Exams */}
            <Route path="/exams" element={<Suspense fallback={<PageLoader />}><ExamsPage /></Suspense>} />
            <Route path="/exams/marks" element={<Suspense fallback={<PageLoader />}><ExamsPage /></Suspense>} />
            <Route path="/exams/results" element={<Suspense fallback={<PageLoader />}><ExamsPage /></Suspense>} />

            {/* Others */}
            <Route path="/timetable" element={<Suspense fallback={<PageLoader />}><TimetablePage /></Suspense>} />
            <Route path="/homework" element={<Suspense fallback={<PageLoader />}><HomeworkPage /></Suspense>} />
            <Route path="/notices" element={<Suspense fallback={<PageLoader />}><NoticesPage /></Suspense>} />
            <Route path="/enquiries" element={<Suspense fallback={<PageLoader />}><EnquiriesPage /></Suspense>} />
            <Route path="/transport" element={<Suspense fallback={<PageLoader />}><TransportPage /></Suspense>} />

            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="/settings/modules" element={<Suspense fallback={<PageLoader />}><ModuleManagementPage /></Suspense>} />
            <Route path="/settings/archive" element={<Suspense fallback={<PageLoader />}><ArchivePage /></Suspense>} />
            <Route path="/super-admin/schools" element={<Suspense fallback={<PageLoader />}><SuperAdminSchoolsPage /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
            <Route path="/roles" element={<Suspense fallback={<PageLoader />}><RolesPage /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
