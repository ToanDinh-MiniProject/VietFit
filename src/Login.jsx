import React, { useState } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup 
} from "firebase/auth"; 
import { 
  Flame, Mail, Lock, User, ArrowRight, RefreshCw, ChevronLeft 
} from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // --- HÀM ĐĂNG NHẬP GOOGLE (GIỮ LẠI TỪ BẢN CŨ) ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setMessage({ type: 'error', text: "Lỗi Google: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM ĐĂNG NHẬP/ĐĂNG KÝ EMAIL ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName });
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage({ type: 'success', text: 'Đã gửi email khôi phục! Hãy kiểm tra hòm thư.' });
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (error) {
      let errorText = "Tài khoản hoặc mật khẩu đã sai. Hãy kiểm tra lại";
      if (error.code === 'auth/user-not-found') errorText = "Email này chưa được đăng ký.";
      if (error.code === 'auth/wrong-password') errorText = "Mật khẩu không chính xác.";
      if (error.code === 'auth/email-already-in-use') errorText = "Email này đã được sử dụng.";
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner transform rotate-12">
            <Flame className="w-8 h-8 text-emerald-600 fill-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            {mode === 'login' ? "VietFit Pro" : mode === 'register' ? "Tham gia cùng chúng tôi" : "Khôi phục tài khoản"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Trợ lý dinh dưỡng thông minh</p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium text-center ${
            message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}>{message.text}</div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Họ và tên" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="email" placeholder="Email" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" placeholder="Mật khẩu" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 block ml-auto px-2">Quên mật khẩu?</button>
          )}

          <button disabled={loading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="animate-spin" /> : <>{mode === 'login' ? "Đăng nhập" : mode === 'register' ? "Tạo tài khoản" : "Gửi yêu cầu"} <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* --- DẢI NGĂN CÁCH --- */}
        {mode === 'login' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Hoặc tiếp tục với</span></div>
            </div>

            {/* --- NÚT GOOGLE --- */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          {mode === 'login' ? (
            <p className="text-sm text-gray-500 font-medium">Chưa có tài khoản? <button onClick={() => setMode('register')} className="ml-1 text-emerald-600 font-bold hover:underline">Đăng ký ngay</button></p>
          ) : (
            <button onClick={() => setMode('login')} className="flex items-center gap-2 text-sm font-bold text-gray-500 mx-auto hover:text-gray-800"><ChevronLeft size={16} /> Quay lại</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;