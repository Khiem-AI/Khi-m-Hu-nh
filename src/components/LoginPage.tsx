import React, { useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { UI_TEXTS } from '../config/uiTexts';
import {
  Wrench,
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    login,
    changePassword,
    theme,
    toggleTheme,
    connectCloudWithGoogle,
    cloudSyncStatus,
    cloudSyncError,
  } = useCMMS();

  const [mode, setMode] = useState<'login' | 'change_password'>('login');

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Change password form
  const [cpUsername, setCpUsername] = useState('');
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [showCpPasswords, setShowCpPasswords] = useState(false);
  const [cpSuccessMessage, setCpSuccessMessage] = useState('');

  const switchMode = (nextMode: 'login' | 'change_password') => {
    setMode(nextMode);
    setErrorMessage('');
    setCpSuccessMessage('');
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const res = await connectCloudWithGoogle();
      if (!res.success) {
        setErrorMessage(res.message || 'Không thể đăng nhập bằng Google Cloud.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc mã nhân viên!');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu đăng nhập!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    }, 300);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setCpSuccessMessage('');

    if (!cpUsername.trim() || !cpCurrentPassword.trim() || !cpNewPassword.trim() || !cpConfirmPassword.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường thông tin!');
      return;
    }

    if (cpNewPassword.trim() !== cpConfirmPassword.trim()) {
      setErrorMessage('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    if (cpNewPassword.trim() === cpCurrentPassword.trim()) {
      setErrorMessage('Mật khẩu mới phải khác mật khẩu hiện tại!');
      return;
    }

    const res = changePassword(cpUsername, cpCurrentPassword, cpNewPassword);
    if (res.success) {
      setCpSuccessMessage(res.message);
      setUsername(cpUsername.trim());
      setPassword('');
      setCpCurrentPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#eef2f6] text-slate-900' : 'bg-[#060a14] text-slate-100'
      }`}
    >
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {UI_TEXTS.brand.appName}
              </span>
            </div>
            {UI_TEXTS.brand.subtitle && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium hidden sm:block">
                {UI_TEXTS.brand.subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={toggleTheme}
          type="button"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-amber-300 text-xs">Nền Sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-indigo-700 text-xs">Nền Tối</span>
            </>
          )}
        </button>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-3xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 backdrop-blur-md">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => switchMode('change_password')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === 'change_password'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Đổi Mật Khẩu
              </button>
            </div>

            {/* Title */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                {mode === 'login' ? <Lock className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Đổi Mật Khẩu Tài Khoản'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Nhập thông tin tài khoản được cấp để truy cập hệ thống quản lý vận hành'
                  : 'Xác thực mật khẩu hiện tại để thiết lập mật khẩu đăng nhập mới'}
              </p>
            </div>

            {(errorMessage || cloudSyncError) && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{errorMessage || cloudSyncError}</span>
              </div>
            )}

            {cpSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span>{cpSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shrink-0"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            {mode === 'login' ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || cloudSyncStatus === 'connecting'}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 border border-slate-800 dark:border-slate-200"
                >
                  {isGoogleLoading || cloudSyncStatus === 'connecting' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
                  )}
                  <span>
                    {isGoogleLoading || cloudSyncStatus === 'connecting'
                      ? 'Đang kết nối Google Cloud...'
                      : 'Đăng nhập bằng Google (Đồng bộ Đám mây)'}
                  </span>
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="shrink-0 mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Hoặc đăng nhập nội bộ
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tên đăng nhập / Mã nhân viên *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nhập mã nhân viên hoặc email..."
                        autoFocus
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng Nhập Vào Hệ Thống</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tên đăng nhập / Mã nhân viên *
                  </label>
                  <input
                    type="text"
                    value={cpUsername}
                    onChange={(e) => setCpUsername(e.target.value)}
                    placeholder="Nhập mã nhân viên hoặc email..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mật khẩu hiện tại *
                  </label>
                  <input
                    type={showCpPasswords ? 'text' : 'password'}
                    value={cpCurrentPassword}
                    onChange={(e) => setCpCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mật khẩu mới (tối thiểu 4 ký tự) *
                  </label>
                  <input
                    type={showCpPasswords ? 'text' : 'password'}
                    value={cpNewPassword}
                    onChange={(e) => setCpNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Xác nhận mật khẩu mới *
                  </label>
                  <input
                    type={showCpPasswords ? 'text' : 'password'}
                    value={cpConfirmPassword}
                    onChange={(e) => setCpConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCpPasswords}
                    onChange={(e) => setShowCpPasswords(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>Hiển thị mật khẩu</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Cập Nhật Mật Khẩu Mới</span>
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Xác thực & phân quyền bảo mật theo vai trò vận hành nhà máy</span>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-[11px] text-slate-500 border-t border-slate-800">
        {UI_TEXTS.brand.appName}
      </footer>
    </div>
  );
};
