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
// Thêm thư viện Firestore: getDoc, setDoc để xử lý Profile
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";

import { 
  Utensils, Trash2, Flame, Scale, 
  RotateCcw, Info, ChevronRight, ChevronLeft, Calendar,
  Home, User, Plus, Download, Settings,
  Camera, Loader2, Sun, Moon, Coffee
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

// API KEY GEMINI CỦA BẠN
const GEMINI_API_KEY = "AIzaSyAkdi_vvpFHRptsZGwMxBx4jdC_6qYqoCs";

// Khởi tạo
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 3. DỮ LIỆU MẪU
const COMMON_FOODS = [
  { name: 'Cơm trắng (1 bát)', calories: 130 },
  { name: 'Phở bò', calories: 450 },
  { name: 'Bánh mì thịt', calories: 400 },
  { name: 'Trứng luộc', calories: 78 },
  { name: 'Ức gà luộc (100g)', calories: 165 },
  { name: 'Chuối (1 quả)', calories: 90 },
  { name: 'Cà phê sữa đá', calories: 300 },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Bữa Sáng', icon: <Coffee size={18} className="text-orange-500"/> },
  { id: 'lunch', label: 'Bữa Trưa', icon: <Sun size={18} className="text-yellow-500"/> },
  { id: 'dinner', label: 'Bữa Chiều/Tối', icon: <Moon size={18} className="text-indigo-500"/> },
];

// 4. MÀN HÌNH ĐĂNG NHẬP
const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Flame className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Xin Chào  </h1>
      <p className="text-gray-500 mb-8">Đồng bộ dữ liệu sức khỏe của bạn.</p>
      
      <button onClick={onLogin} className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 active:scale-95">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
        Tiếp tục với Google
      </button>
    </div>
  </div>
);

// 5. APP CHÍNH
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // User State
  const [userInfo, setUserInfo] = useState({ gender: 'male', age: 25, height: 170, weight: 70, activityLevel: '1.375' });
  const [step, setStep] = useState(1); // 1: Setup, 2: Dashboard
  const [activeTab, setActiveTab] = useState('home');
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  
  // Data State
  const [meals, setMeals] = useState([]); 
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Add Meal Form State
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  
  const [isScanning, setIsScanning] = useState(false);

  // --- QUẢN LÝ AUTH & DỮ LIỆU (QUAN TRỌNG) ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 8000); // Timeout dự phòng

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timer);
      if (user) {
        setCurrentUser(user);
        
        // 1. Tải Profile người dùng từ Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            // Nếu ĐÃ CÓ profile -> Load dữ liệu và vào thẳng Dashboard (Step 2)
            const data = userSnap.data();
            setUserInfo(data.userInfo || userInfo);
            setTdee(data.tdee || 0);
            setTargetCalories(data.targetCalories || 0);
            setStep(2); 
          } else {
            // Nếu CHƯA CÓ profile -> Ở lại Step 1 để thiết lập
            setStep(1);
          }
        } catch (error) {
          console.error("Lỗi tải profile:", error);
        }

        // 2. Lắng nghe danh sách bữa ăn
        const q = query(collection(db, "users", user.uid, "meals"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
          const loadedMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMeals(loadedMeals);
        });

      } else {
        setCurrentUser(null);
        setMeals([]);
        setStep(1);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- XỬ LÝ DATE ---
  const changeDate = (days) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    setCurrentDate(date.toISOString().slice(0, 10));
  };

  const getDisplayDate = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (currentDate === today) return "Hôm nay";
    const [y, m, d] = currentDate.split('-');
    return `${d}/${m}/${y}`;
  };

  // --- GEMINI AI ---
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const imagePart = await fileToGenerativePart(file);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Nhìn món ăn này. Trả về JSON: { \"name\": \"Tên món tiếng Việt\", \"calories\": số_calo }. Không thêm text khác.";
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      const cleanText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText);

      setNewMealName(data.name);
      setNewMealCalories(data.calories);
      alert(`Đã nhận diện: ${data.name} (~${data.calories} kcal)`);
    } catch (error) {
      console.error(error);
      alert("Không nhận diện được. Thử lại nhé!");
    } finally {
      setIsScanning(false);
    }
  };

  // --- LƯU DỮ LIỆU ---
  const saveUserProfile = async () => {
    // Tính toán chỉ số
    let bmr = userInfo.gender === 'male' 
      ? (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) + 5
      : (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) - 161;
    const tdeeVal = Math.round(bmr * parseFloat(userInfo.activityLevel));
    const targetVal = tdeeVal - 500;

    // Cập nhật State
    setTdee(tdeeVal);
    setTargetCalories(targetVal);
    
    // LƯU LÊN FIRESTORE (Để lần sau không phải nhập lại)
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        userInfo: userInfo,
        tdee: tdeeVal,
        targetCalories: targetVal,
        updatedAt: new Date().toISOString()
      }, { merge: true }); // merge: true giúp giữ lại các trường khác nếu có
      
      setStep(2); // Chuyển sang Dashboard
      setActiveTab('home');
    } catch (error) {
      console.error("Lỗi lưu profile:", error);
      alert("Không thể lưu hồ sơ. Kiểm tra kết nối mạng.");
    }
  };

  const addMeal = async (e) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) return;

    try {
      await addDoc(collection(db, "users", currentUser.uid, "meals"), {
        name: newMealName,
        calories: parseInt(newMealCalories),
        type: selectedMealType,
        date: currentDate,
        createdAt: new Date().toISOString()
      });
      setNewMealName('');
      setNewMealCalories('');
      setActiveTab('home');
    } catch (error) {
      alert("Lỗi lưu dữ liệu.");
    }
  };
  
  const addCommonFood = async (food) => {
    try {
      await addDoc(collection(db, "users", currentUser.uid, "meals"), {
        name: food.name,
        calories: food.calories,
        type: selectedMealType,
        date: currentDate,
        createdAt: new Date().toISOString()
      });
      setActiveTab('home');
    } catch (error) {
      alert("Lỗi lưu dữ liệu.");
    }
  };

  const removeMeal = async (id) => {
    if (window.confirm("Bạn muốn xóa món này?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "meals", id));
    }
  };

  // --- LOGIC ---
  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { alert("Lỗi đăng nhập"); } };
  const handleLogout = () => { signOut(auth); setStep(1); setMeals([]); setActiveTab('home'); };
  const handleInputChange = (e) => setUserInfo({ ...userInfo, [e.target.name]: e.target.value });

  const exportData = () => {
    const dataStr = JSON.stringify({ userInfo, meals }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `vietfit_data.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const editProfile = () => {
    // Cho phép quay lại Step 1 để chỉnh sửa, nhưng giữ nguyên dữ liệu cũ
    setStep(1);
  };

  // --- LỌC DỮ LIỆU ---
  const mealsByDate = meals.filter(meal => meal.date === currentDate);
  const totalCaloriesConsumed = mealsByDate.reduce((acc, meal) => acc + meal.calories, 0);
  const remainingCalories = targetCalories - totalCaloriesConsumed;
  const progressPercentage = Math.min((totalCaloriesConsumed / targetCalories) * 100, 100);

  // --- UI RENDER FUNCTIONS ---

  const renderHomeTab = () => (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} className="text-gray-500"/></button>
        <div className="flex items-center gap-2 font-bold text-gray-700">
          <Calendar size={18} className="text-emerald-600"/>
          {getDisplayDate()}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} className="text-gray-500"/></button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 text-center">
            <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Còn lại hôm nay</h2>
            <div className={`text-5xl font-extrabold my-2 ${remainingCalories < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{remainingCalories}</div>
            <div className="text-sm text-gray-400 mb-6">Kcal</div>
            <div className="mt-6 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${remainingCalories < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>
      </div>

      <div>
        {MEAL_TYPES.map((type) => {
          const typeMeals = mealsByDate.filter(m => m.type === type.id);
          const typeCalories = typeMeals.reduce((acc, m) => acc + m.calories, 0);
          return (
            <div key={type.id} className="mb-6">
              <div className="flex justify-between items-center mb-3 px-2">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">{type.icon} {type.label}</h4>
                <span className="text-xs font-medium text-gray-400">{typeCalories} kcal</span>
              </div>
              {typeMeals.length === 0 ? (
                <div className="text-xs text-center text-gray-300 py-2 border-2 border-dashed border-gray-100 rounded-xl">Chưa có món nào</div>
              ) : (
                <div className="space-y-2">
                  {typeMeals.map((meal) => (
                    <div key={meal.id} className="flex justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-50">
                      <div className="font-medium text-gray-800">{meal.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {meal.calories} kcal
                        <button onClick={() => removeMeal(meal.id)}><Trash2 size={14} className="text-gray-300 hover:text-red-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAddTab = () => (
    <div className="space-y-6 animate-fade-in pb-24 h-full flex flex-col">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
           <Calendar size={20} className="text-emerald-600"/> 
           Thêm vào: {getDisplayDate()}
        </h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {MEAL_TYPES.map(t => (
            <button 
              key={t.id}
              onClick={() => setSelectedMealType(t.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${selectedMealType === t.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-100 text-gray-400'}`}
            >
              {t.icon}
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-md text-white mb-6">
           <div className="flex justify-between items-center mb-2">
             <div className="font-bold flex items-center gap-2"><Camera size={18}/> AI Scanner</div>
             {isScanning && <Loader2 size={18} className="animate-spin"/>}
           </div>
           <label className="block w-full bg-white/20 hover:bg-white/30 text-center py-2 rounded-xl cursor-pointer text-sm font-medium transition-colors">
              {isScanning ? 'Đang phân tích...' : 'Chụp ảnh món ăn'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
           </label>
        </div>
        <form onSubmit={addMeal} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên món</label>
              <input type="text" value={newMealName} onChange={(e) => setNewMealName(e.target.value)} placeholder="Ví dụ: Bún bò" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calo (kcal)</label>
              <input type="number" value={newMealCalories} onChange={(e) => setNewMealCalories(e.target.value)} placeholder="0" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Lưu Món Ăn</button>
        </form>
      </div>
      <div className="flex-1">
         <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">Gợi ý nhanh</h3>
         <div className="grid grid-cols-2 gap-3">
            {COMMON_FOODS.map((f, i) => (<button key={i} onClick={()=>addCommonFood(f)} className="bg-white p-3 rounded-xl border border-gray-100 text-left hover:border-emerald-500"><div className="font-medium">{f.name}</div><div className="text-xs text-gray-400">{f.calories} kcal</div></button>))}
         </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="bg-white rounded-3xl p-6 text-center relative shadow-sm border border-gray-100">
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-red-500 font-bold border border-red-100 px-3 py-1 rounded-full">Đăng xuất</button>
        <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-md overflow-hidden bg-gray-100">{currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-400" />}</div>
        <h2 className="text-xl font-bold text-gray-800">{currentUser?.displayName}</h2>
        <div className="text-emerald-600 font-medium text-sm mt-1">Mục tiêu: {targetCalories} kcal/ngày</div>
        
        <div className="grid grid-cols-3 gap-2 mt-6 mb-6 border-t border-b border-gray-50 py-4">
            <div><div className="text-xs text-gray-400">Cân nặng</div><div className="font-bold text-gray-700">{userInfo.weight} kg</div></div>
            <div><div className="text-xs text-gray-400">Chiều cao</div><div className="font-bold text-gray-700">{userInfo.height} cm</div></div>
            <div><div className="text-xs text-gray-400">TDEE</div><div className="font-bold text-gray-700">{tdee}</div></div>
        </div>

        <div className="space-y-2">
            <button onClick={editProfile} className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200"><Settings size={18} /> Cài đặt lại hồ sơ</button>
            <button onClick={exportData} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-medium flex items-center justify-center gap-2"><Download size={18} /> Xuất dữ liệu</button>
        </div>
    </div>
  );

  // --- RENDER CHÍNH ---
  
  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-emerald-600 font-bold bg-white">
            <Loader2 size={48} className="animate-spin mb-4" />
            <div>Đang tải dữ liệu...</div>
        </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleGoogleLogin} />;
  
  if (step === 1) return (
     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl">
           <div className="text-center mb-6"><div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Scale className="text-white" /></div><h1 className="text-2xl font-bold">Thiết lập hồ sơ</h1></div>
           <div className="space-y-4">
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Giới tính</label><div className="flex gap-3">{['male', 'female'].map(g=><button key={g} onClick={()=>setUserInfo({...userInfo, gender:g})} className={`flex-1 py-3 rounded-xl font-bold ${userInfo.gender===g?'bg-emerald-600 text-white':'bg-gray-100 text-gray-500'}`}>{g==='male'?'Nam':'Nữ'}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl"><label className="text-xs font-bold text-gray-400 block">TUỔI</label><input type="number" name="age" value={userInfo.age} onChange={handleInputChange} className="w-full bg-transparent font-bold text-xl" /></div>
                  <div className="bg-gray-50 p-3 rounded-xl"><label className="text-xs font-bold text-gray-400 block">CAO (CM)</label><input type="number" name="height" value={userInfo.height} onChange={handleInputChange} className="w-full bg-transparent font-bold text-xl" /></div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl"><label className="text-xs font-bold text-gray-400 block">CÂN NẶNG (KG)</label><input type="number" name="weight" value={userInfo.weight} onChange={handleInputChange} className="w-full bg-transparent font-bold text-2xl text-emerald-600" /></div>
              {/* Thay đổi ở đây: Gọi hàm saveUserProfile thay vì calculateMetrics */}
              <button onClick={saveUserProfile} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg mt-4">Lưu & Bắt đầu ngay</button>
           </div>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 md:p-4 font-sans">
      <div className="bg-gray-50 w-full max-w-md md:rounded-[2.5rem] md:border-[8px] md:border-white shadow-2xl overflow-hidden h-screen md:h-[850px] flex flex-col relative">
        <div className="bg-white p-4 pt-8 shadow-sm flex justify-between sticky top-0 z-20 items-center">
          <div className="font-bold text-lg flex gap-2 items-center text-gray-800"><Flame className="text-orange-500 fill-orange-500" size={20}/> Xin Chào {currentUser?.displayName}</div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">{currentUser.photoURL?<img src={currentUser.photoURL} className="w-full h-full object-cover"/>:<span className="text-xs font-bold text-emerald-600">VF</span>}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'add' && renderAddTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>
        <div className="bg-white border-t border-gray-100 p-2 pb-6 absolute bottom-0 w-full z-30 flex justify-between items-center px-6">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab==='home'?'text-emerald-600':'text-gray-400'}`}><Home size={24}/><span className="text-[10px] font-bold">Trang chủ</span></button>
          <div className="-mt-8"><button onClick={() => setActiveTab('add')} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${activeTab==='add'?'bg-emerald-700':'bg-emerald-600'}`}><Plus size={28}/></button></div>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab==='profile'?'text-emerald-600':'text-gray-400'}`}><User size={24}/><span className="text-[10px] font-bold">Hồ sơ</span></button>
        </div>
      </div>
    </div>
  );
}