import React, { useState, useEffect } from 'react';
// 1. IMPORT CÁC THƯ VIỆN
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  Activity, Utensils, Trash2, Flame, Target, Scale, 
  RotateCcw, PlusCircle, Info, ChevronRight, TrendingDown, 
  Home, User, Plus, ArrowLeft, Download,
  Camera, Loader2 // <--- Đã thêm icon Camera và Loader
} from 'lucide-react';

// --- IMPORT GEMINI ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// 2. CẤU HÌNH FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD-2QpFWAYbZM_MK46ccOVdd-yFZiPf-cE",
  authDomain: "vietfit.firebaseapp.com",
  projectId: "vietfit",
  storageBucket: "vietfit.firebasestorage.app",
  messagingSenderId: "433726638124",
  appId: "1:433726638124:web:7959bd358715b99cd4a989",
  measurementId: "G-DPCBN0B3KN"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// API KEY GEMINI CỦA BẠN
const GEMINI_API_KEY = "AIzaSyAkdi_vvpFHRptsZGwMxBx4jdC_6qYqoCs";

const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider(); 

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 3. DỮ LIỆU MẪU
const COMMON_FOODS = [
  { name: 'Cơm trắng (1 bát)', calories: 130 },
  { name: 'Phở bò', calories: 450 },
  { name: 'Bánh mì thịt', calories: 400 },
  { name: 'Trứng luộc (1 quả)', calories: 78 },
  { name: 'Ức gà luộc (100g)', calories: 165 },
  { name: 'Chuối (1 quả)', calories: 90 },
  { name: 'Cà phê sữa đá', calories: 300 },
  { name: 'Rau muống xào tỏi', calories: 140 },
  { name: 'Bún chả', calories: 400 },
  { name: 'Sữa chua', calories: 100 },
];

// 4. COMPONENT MÀN HÌNH ĐĂNG NHẬP
const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Flame className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">VietFit</h1>
      <p className="text-gray-500 mb-8">Đăng nhập để đồng bộ dữ liệu sức khỏe của bạn.</p>
      
      <button
        onClick={onLogin}
        className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 active:scale-95"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
        Tiếp tục với Google
      </button>
    </div>
  </div>
);

// 5. COMPONENT CHÍNH (APP)
export default function App() {
  // --- STATE QUẢN LÝ USER ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- STATE ỨNG DỤNG ---
  const [userInfo, setUserInfo] = useState({
    gender: 'male',
    age: 25,
    height: 170, 
    weight: 70, 
    activityLevel: '1.375', 
  });

  const [step, setStep] = useState(1); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  
  const [meals, setMeals] = useState([]);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');

  // --- STATE CHO AI SCANNER ---
  const [isScanning, setIsScanning] = useState(false);

  // --- EFFECT: KIỂM TRA ĐĂNG NHẬP ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- HÀM XỬ LÝ ẢNH CHO GEMINI ---
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  // --- HÀM GỌI GEMINI AI ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // 1. Chuẩn bị ảnh
      const imagePart = await fileToGenerativePart(file);
      
      // 2. Chọn Model (Flash chạy nhanh và rẻ)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 3. Câu lệnh (Prompt) yêu cầu trả về JSON
      const prompt = "Hãy nhìn món ăn trong ảnh này. Trả về đúng định dạng JSON duy nhất như sau: { \"name\": \"Tên món tiếng Việt ngắn gọn\", \"calories\": số_calo_ước_tính_nguyên_dương }. Không thêm bất kỳ ký tự nào khác ngoài JSON.";
      
      // 4. Gửi lên Google
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // 5. Xử lý kết quả (Lọc bỏ markdown ```json nếu có)
      const cleanText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText);

      // 6. Điền dữ liệu vào form
      setNewMealName(data.name);
      setNewMealCalories(data.calories);
      alert(`AI đã nhận diện: ${data.name} (~${data.calories} kcal)`);

    } catch (error) {
      console.error("Gemini Error:", error);
      alert("Không nhận diện được món ăn. Vui lòng thử ảnh khác rõ hơn.");
    } finally {
      setIsScanning(false);
    }
  };

  // --- HÀM XỬ LÝ AUTH ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setStep(1);
    setMeals([]);
    setActiveTab('home');
  };

  // --- CÁC HÀM LOGIC CŨ ---
  const calculateMetrics = () => {
    let bmr = 0;
    if (userInfo.gender === 'male') {
      bmr = (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) + 5;
    } else {
      bmr = (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) - 161;
    }

    const tdeeVal = Math.round(bmr * parseFloat(userInfo.activityLevel));
    setTdee(tdeeVal);
    setTargetCalories(tdeeVal - 500);
    setStep(2);
    setActiveTab('home');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const addMeal = (e) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) return;

    const meal = {
      id: Date.now(),
      name: newMealName,
      calories: parseInt(newMealCalories),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMeals([...meals, meal]);
    setNewMealName('');
    setNewMealCalories('');
    setActiveTab('home');
  };

  const addCommonFood = (food) => {
    const meal = {
      id: Date.now(),
      name: food.name,
      calories: food.calories,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setMeals([...meals, meal]);
    setActiveTab('home');
  };

  const removeMeal = (id) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ userInfo, meals }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat_ky_giam_can_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetApp = () => {
    setStep(1);
    setMeals([]);
    setActiveTab('home');
  };

  const totalCaloriesConsumed = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const remainingCalories = targetCalories - totalCaloriesConsumed;
  const progressPercentage = Math.min((totalCaloriesConsumed / targetCalories) * 100, 100);

  // --- UI COMPONENTS CON ---
  
  const HomeTab = () => (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 text-center">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Còn lại hôm nay</h2>
          <div className={`text-5xl font-extrabold my-2 ${remainingCalories < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {remainingCalories}
          </div>
          <div className="text-sm text-gray-400 mb-6">Kcal</div>
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
            <div><div className="text-xs text-gray-400">Mục tiêu</div><div className="font-bold text-gray-700">{targetCalories}</div></div>
            <div><div className="text-xs text-gray-400">Đã nạp</div><div className="font-bold text-gray-700">{totalCaloriesConsumed}</div></div>
            <div><div className="text-xs text-gray-400">Đã đốt</div><div className="font-bold text-gray-700">--</div></div>
          </div>
          <div className="mt-6 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${remainingCalories < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-end mb-4 px-2">
          <h3 className="font-bold text-lg text-gray-800">Nhật ký hôm nay</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-md">{meals.length} món</span>
        </div>
        {meals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><Utensils className="text-gray-300" /></div>
            <p className="text-gray-400 text-sm">Chưa có gì trong bụng cả!</p>
            <button onClick={() => setActiveTab('add')} className="mt-3 text-emerald-600 font-medium text-sm hover:underline">+ Thêm bữa ăn đầu tiên</button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.slice().reverse().map((meal) => (
              <div key={meal.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500"><Utensils size={18} /></div>
                   <div><div className="font-bold text-gray-800">{meal.name}</div><div className="text-xs text-gray-400">{meal.time} • {meal.calories} kcal</div></div>
                </div>
                <button onClick={() => removeMeal(meal.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-blue-500 rounded-3xl p-5 text-white shadow-lg shadow-blue-200">
        <div className="flex gap-3 items-start"><Info className="flex-shrink-0 mt-1" size={20} /><div><h4 className="font-bold mb-1">Mẹo nhỏ</h4><p className="text-sm opacity-90 text-blue-50">Đừng quên uống nước! Đôi khi cơ thể nhầm lẫn giữa khát và đói.</p></div></div>
      </div>
    </div>
  );

  const AddTab = () => (
    <div className="space-y-6 animate-fade-in pb-24 h-full flex flex-col">
      {/* --- PHẦN AI SCANNER THÊM VÀO --- */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg text-white">
         <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
           <Camera className="text-white" /> Gemini AI Scanner
         </h2>
         <p className="text-indigo-100 text-sm mb-4">Chụp ảnh món ăn để AI tự động tính calo.</p>
         
         <label className={`w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-white/30 transition-all ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
            {isScanning ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
            <span>{isScanning ? 'Đang phân tích...' : 'Bấm để chụp ảnh'}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
         </label>
      </div>
      {/* --- KẾT THÚC PHẦN AI --- */}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nhập thủ công</h2>
        <form onSubmit={addMeal} className="space-y-4">
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên món</label><input type="text" value={newMealName} onChange={(e) => setNewMealName(e.target.value)} placeholder="Ví dụ: Bún bò" className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" /></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calo (kcal)</label><input type="number" value={newMealCalories} onChange={(e) => setNewMealCalories(e.target.value)} placeholder="0" className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium" /></div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform">Lưu Món Ăn</button>
        </form>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">Gợi ý nhanh</h3>
        <div className="grid grid-cols-2 gap-3">
          {COMMON_FOODS.map((food, index) => (
            <button key={index} onClick={() => addCommonFood(food)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
              <div className="font-medium text-gray-800 group-hover:text-emerald-700">{food.name}</div>
              <div className="text-xs text-gray-400 mt-1">{food.calories} kcal</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative">
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded-full border border-red-100 transition-colors">Đăng xuất</button>
        
        <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-md overflow-hidden bg-gray-100">
           {currentUser?.photoURL ? (
             <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <User size={40} className="text-gray-400" />
           )}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{currentUser?.displayName || "Người dùng"}</h2>
        <div className="text-xs text-gray-400 mb-2">{currentUser?.email}</div>
        <div className="text-emerald-600 font-medium text-sm">Mục tiêu: {targetCalories} kcal/ngày</div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center"><span className="text-gray-500">Cân nặng</span><span className="font-bold text-gray-800">{userInfo.weight} kg</span></div>
        <div className="p-4 border-b border-gray-50 flex justify-between items-center"><span className="text-gray-500">Chiều cao</span><span className="font-bold text-gray-800">{userInfo.height} cm</span></div>
        <div className="p-4 border-b border-gray-50 flex justify-between items-center"><span className="text-gray-500">TDEE (Tiêu hao)</span><span className="font-bold text-gray-800">{tdee} kcal</span></div>
      </div>

      <div>
        <button onClick={exportData} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 mb-3"><Download size={18} /> Xuất dữ liệu (JSON)</button>
        <button onClick={resetApp} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"><RotateCcw size={18} /> Thiết lập lại từ đầu</button>
      </div>
    </div>
  );

  // --- RENDER CHÍNH ---
  
  // 1. Nếu đang tải (đang kiểm tra đăng nhập) -> Hiển thị Loading
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-emerald-600 font-bold bg-gray-50">Đang tải dữ liệu...</div>;
  }

  // 2. Nếu chưa đăng nhập -> Hiển thị LoginScreen
  if (!currentUser) {
    return <LoginScreen onLogin={handleGoogleLogin} />;
  }

  // 3. Nếu đã đăng nhập nhưng chưa Setup -> Hiển thị Setup Step 1
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 md:p-4 font-sans">
        <div className="bg-white w-full max-w-md md:rounded-3xl shadow-2xl overflow-hidden min-h-screen md:min-h-[800px] flex flex-col">
          <div className="bg-emerald-600 p-8 text-white rounded-b-[3rem] shadow-lg z-10 mb-6">
             <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"><Scale className="w-8 h-8 text-white" /></div>
             <h1 className="text-3xl font-bold">Chào {currentUser.displayName?.split(' ')[0] || 'bạn'}!</h1>
             <p className="opacity-90 mt-2 text-emerald-50">Hãy thiết lập hồ sơ để bắt đầu hành trình giảm cân.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-10">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Giới tính</label>
              <div className="flex gap-3">
                {['male', 'female'].map((g) => (
                  <button key={g} onClick={() => setUserInfo({...userInfo, gender: g})} className={`flex-1 py-3 rounded-xl font-medium transition-all ${userInfo.gender === g ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {g === 'male' ? 'Nam' : 'Nữ'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="text-xs text-gray-500 font-bold uppercase block mb-1">Tuổi</label><input type="number" name="age" value={userInfo.age} onChange={handleInputChange} className="w-full bg-transparent text-2xl font-bold text-gray-800 focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors" /></div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="text-xs text-gray-500 font-bold uppercase block mb-1">Cao (cm)</label><input type="number" name="height" value={userInfo.height} onChange={handleInputChange} className="w-full bg-transparent text-2xl font-bold text-gray-800 focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors" /></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="text-xs text-gray-500 font-bold uppercase block mb-1">Cân nặng (kg)</label><input type="number" name="weight" value={userInfo.weight} onChange={handleInputChange} className="w-full bg-transparent text-3xl font-bold text-emerald-600 focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors" /></div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Mức độ vận động</label>
              <div className="relative">
                <select name="activityLevel" value={userInfo.activityLevel} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="1.2">Ít vận động (Văn phòng)</option>
                  <option value="1.375">Nhẹ nhàng (1-3 ngày/tuần)</option>
                  <option value="1.55">Trung bình (3-5 ngày/tuần)</option>
                  <option value="1.725">Năng động (6-7 ngày/tuần)</option>
                  <option value="1.9">Rất năng động (VĐV)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white border-t border-gray-100">
            <button onClick={calculateMetrics} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-2">Bắt đầu ngay <ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Màn hình chính (Dashboard)
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 md:p-4 font-sans">
      <div className="bg-gray-50 w-full max-w-md md:rounded-[2.5rem] md:border-[8px] md:border-white shadow-2xl overflow-hidden h-screen md:h-[850px] flex flex-col relative">
        <div className="bg-white p-4 pt-8 md:pt-6 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg"><Flame size={18} className="text-white fill-white" /></div>
            <span className="font-bold text-gray-800 text-lg">VietFit</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-100">
             {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold text-xs">VF</div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'add' && <AddTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>

        <div className="bg-white border-t border-gray-100 p-2 px-6 pb-6 md:pb-2 absolute bottom-0 w-full z-30 flex justify-between items-center">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} /><span className="text-[10px] font-medium">Trang chủ</span></button>
          <div className="-mt-8">
            <button onClick={() => setActiveTab('add')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 transition-transform active:scale-95 ${activeTab === 'add' ? 'bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}><Plus size={28} className="text-white" /></button>
          </div>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} /><span className="text-[10px] font-medium">Hồ sơ</span></button>
        </div>
      </div>
    </div>
  );
}