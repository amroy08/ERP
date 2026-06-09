export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'principal' | 'teacher' | 'clerk' | 'parent' | 'student';
  profilePhoto?: string | null;
  phone?: string | null;
  schoolId?: string | null;
  permissions?: string[];
  student?: any;
  parent?: any;
  teacher?: any;
}

export interface SchoolContext {
  id: string;
  name: string;
  logo?: string | null;
  phone: string;
  email: string;
}

export interface AuthState {
  user: UserProfile | null;
  school: SchoolContext | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
