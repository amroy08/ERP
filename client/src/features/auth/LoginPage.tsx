import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, School, LogIn } from 'lucide-react';
import { setCredentials } from './authSlice';
import { setSchoolSettings } from '../../store/settingsSlice';
import axiosInstance from '../../api/axiosInstance';
import { RootState } from '../../store/store';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken, school } = res.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      if (school) dispatch(setSchoolSettings(school));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const errData = err as { response?: { data?: { message?: string } } };
      setError(errData?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Super Admin', email: 'superadmin@vidyaschool.edu.in', password: 'Admin@123', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { role: 'Admin', email: 'admin@vidyaschool.edu.in', password: 'Admin@123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { role: 'Teacher', email: 'amit.patel@vidyaschool.edu.in', password: 'Teacher@123', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { role: 'Clerk', email: 'clerk@vidyaschool.edu.in', password: 'Admin@123', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { role: 'Parent', email: 'rohit.sharma@gmail.com', password: 'Parent@123', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { role: 'Student', email: 'arjun.sharma@vidyaschool.edu.in', password: 'Student@123', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vidya Public School</h1>
              <p className="text-blue-300 text-sm">School Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Manage your school<br />
            <span className="text-blue-300">smarter & better</span>
          </h2>
          <p className="text-blue-200 text-lg mb-10 leading-relaxed">
            A complete ERP solution for students, teachers, staff, and parents.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Students', value: '1,200+', icon: '🎓' },
              { label: 'Teachers', value: '80+', icon: '👨‍🏫' },
              { label: 'Modules', value: '20+', icon: '📚' },
              { label: 'Years Trust', value: '25+', icon: '🏆' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-blue-300 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-800/30 blur-3xl" />
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Vidya Public School</div>
              <div className="text-xs text-slate-400">ERP System</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-8">Sign in to your ERP account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@vidyaschool.edu.in"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">Demo Accounts</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:opacity-80 ${acc.color}`}
                  >
                    <div className="font-semibold">{acc.role}</div>
                    <div className="opacity-70 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
