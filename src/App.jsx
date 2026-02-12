import React, { useState, useEffect, useRef } from 'react';
import HealthPage from './Health'; 
import InfoPage from './Info';
import { BookOpen } from 'lucide-react';
// 1. IMPORT CÁC THƯ VIỆN
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc,
  setDoc
} from "firebase/firestore";

// --- IMPORT THƯ VIỆN BIỂU ĐỒ (MỚI) ---
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

import { 
  Utensils, Trash2, Flame, Scale, 
  RotateCcw, Info, ChevronRight, ChevronLeft, Calendar,
  Home, User, Plus, Download, Settings,
  Camera, Loader2, Sun, Moon, Coffee, X, Sparkles, Weight, BarChart2
} from 'lucide-react';

// 2. CẤU HÌNH FIREBASE & API
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
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// DANH SÁCH MODEL DỰ PHÒNG
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro-vision",
  "gemini-flash-latest" 
];

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 3. DỮ LIỆU MẪU
const COMMON_FOODS = [
  { name: 'Cơm trắng (1 bát)', weight: 150, calories: 130, carbs: 28, protein: 2.7, fat: 0.3, fiber: 0.4 },
  { name: 'Phở bò', weight: 400, calories: 450, carbs: 70, protein: 25, fat: 12, fiber: 2 },
  { name: 'Bánh mì thịt', weight: 200, calories: 400, carbs: 50, protein: 15, fat: 18, fiber: 3 },
  { name: 'Trứng luộc', weight: 50, calories: 78, carbs: 0.6, protein: 6, fat: 5, fiber: 0 },
  { name: 'Ức gà luộc', weight: 100, calories: 165, carbs: 0, protein: 31, fat: 3.6, fiber: 0 },
  { name: 'Chuối (1 quả)', weight: 100, calories: 90, carbs: 23, protein: 1.1, fat: 0.3, fiber: 2.6 },
  { name: 'Cà phê sữa đá', weight: 250, calories: 300, carbs: 40, protein: 5, fat: 10, fiber: 0 },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Bữa Sáng', icon: <Coffee size={18} className="text-orange-500"/> },
  { id: 'lunch', label: 'Bữa Trưa', icon: <Sun size={18} className="text-yellow-500"/> },
  { id: 'dinner', label: 'Bữa Chiều/Tối', icon: <Moon size={18} className="text-indigo-500"/> },
];

// 4. MÀN HÌNH ĐĂNG NHẬP
const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4 font-sans">
    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Flame className="w-10 h-10 text-emerald-600 fill-emerald-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-800 mb-2">VietFit Pro</h1>
      <p className="text-gray-500 mb-8 font-medium">Trợ lý dinh dưỡng AI của bạn</p>
      
      <button 
        onClick={onLogin} 
        className="w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
      >
        <div className="w-6 h-6">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
        </div>
        Đăng nhập với Google
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
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('home');
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  
  // Data State
  const [meals, setMeals] = useState([]); 
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Form State
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealWeight, setNewMealWeight] = useState('');  
  const [newMealMacros, setNewMealMacros] = useState({ carbs: '', protein: '', fat: '', fiber: '' });

  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [showInfoModal, setShowInfoModal] = useState(false);
  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [isTextSearching, setIsTextSearching] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);
  const [originalNutrients, setOriginalNutrients] = useState(null);
  // --- AUTH & LOAD DATA ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timer);
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserInfo(data.userInfo || userInfo);
            setTdee(data.tdee || 0);
            setTargetCalories(data.targetCalories || 0);
            setStep(2); 
          } else {
            setStep(1); 
          }
        } catch (error) { 
          console.error("Lỗi tải profile:", error); 
        }

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

  // --- HÀM NÉN ẢNH ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 800 / img.width; 
          canvas.width = 800;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({
            base64: dataUrl.split(',')[1],
            preview: dataUrl
          });
        };
      };
    });
  };

  // --- API VISION (ẢNH) ---
  const callGeminiWithFallback = async (base64Data, modelIndex = 0) => {
    if (modelIndex >= GEMINI_MODELS.length) throw new Error("Hệ thống AI đang bận.");
    const currentModel = GEMINI_MODELS[modelIndex];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Bạn là chuyên gia dinh dưỡng. Nhìn ảnh này. Trả về kết quả CHỈ LÀ MỘT JSON duy nhất: { \"name\": \"Tên món tiếng Việt ngắn gọn\", \"weight\": số_gam_ước_lượng, \"calories\": số_calo_nguyên, \"carbs\": số_gam_carb, \"protein\": số_gam_đạm, \"fat\": số_gam_béo, \"fiber\": số_gam_xơ }. Không thêm dấu ```json." },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
              ]
            }]
          })
        }
      );
      if (!response.ok) return await callGeminiWithFallback(base64Data, modelIndex + 1);
      return await response.json();
    } catch (error) {
      return await callGeminiWithFallback(base64Data, modelIndex + 1);
    }
  };

  // --- API TEXT ---
  const callGeminiTextOnly = async (foodName, modelIndex = 0) => {
    if (modelIndex >= GEMINI_MODELS.length) throw new Error("Hệ thống bận.");
    const currentModel = GEMINI_MODELS[modelIndex];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `Bạn là chuyên gia dinh dưỡng Việt Nam. Hãy ước lượng dinh dưỡng cho 1 khẩu phần ăn phổ biến của món: "${foodName}". 
                Trả về JSON duy nhất: { "name": "Tên món chuẩn hóa", "weight": số_gam_ước_lượng_cho_1_phần, "calories": số_calo_nguyên, "carbs": số_gam_carb, "protein": số_gam_đạm, "fat": số_gam_béo, "fiber": số_gam_xơ, "description": "Mô tả ngắn gọn khẩu phần" }. 
                Không giải thích thêm. Không dùng markdown block.` 
              }]
            }]
          })
        }
      );

      if (!response.ok) return await callGeminiTextOnly(foodName, modelIndex + 1);
      const data = await response.json();
      return data;
    } catch (error) {
      return await callGeminiTextOnly(foodName, modelIndex + 1);
    }
  };

  // --- XỬ LÝ ẢNH ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const { base64, preview } = await compressImage(file);
      const data = await callGeminiWithFallback(base64);
      
      if (data && data.candidates && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        const cleanText = text.replace(/```json|```/g, '').trim();
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            const finalJson = cleanText.substring(firstBrace, lastBrace + 1);
            const resultData = JSON.parse(finalJson);
            
            setOriginalNutrients({...resultData}); // Lưu mốc gốc
            setScanResult({ ...resultData, image: preview });
            setNewMealName(resultData.name);
            setNewMealWeight(resultData.weight || 100);
            setNewMealCalories(resultData.calories);
            setNewMealMacros({
                carbs: resultData.carbs || 0,
                protein: resultData.protein || 0,
                fat: resultData.fat || 0,
                fiber: resultData.fiber || 0
            });
        } else {
            throw new Error("AI không nhận diện được món ăn.");
        }
      }
    } catch (error) {
      alert(`⚠️ Không thể nhận diện ảnh: ${error.message}`);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelScan = () => {
    setScanResult(null);
    setNewMealName('');
    setNewMealWeight('');
    setNewMealCalories('');
    setNewMealMacros({ carbs: '', protein: '', fat: '', fiber: '' });
  };

  // --- XỬ LÝ TEXT SEARCH ---
  const handleTextAnalysis = async () => {
    if (!newMealName.trim()) return alert("Vui lòng nhập tên món ăn trước!");
    
    setIsTextSearching(true);
    try {
      const data = await callGeminiTextOnly(newMealName);
      
      if (data && data.candidates && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        const cleanText = text.replace(/```json|```/g, '').trim();
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
           const result = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
           setOriginalNutrients({...result}); // Lưu mốc gốc
          setNewMealName(result.name);
          setNewMealWeight(result.weight || 100);
          setNewMealCalories(result.calories);
          setNewMealMacros({
              carbs: result.carbs || 0,
              protein: result.protein || 0,
              fat: result.fat || 0,
              fiber: result.fiber || 0
          });
        }
      }
    } catch (error) {
      alert("Không tìm thấy thông tin món này. Bạn hãy tự nhập nhé!");
    } finally {
      setIsTextSearching(false);
    }
  };

  // --- CÁC HÀM FIREBASE DATA ---
  const saveUserProfile = async () => {
    let bmr = userInfo.gender === 'male' 
      ? (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) + 5
      : (10 * userInfo.weight) + (6.25 * userInfo.height) - (5 * userInfo.age) - 161;
    const tdeeVal = Math.round(bmr * parseFloat(userInfo.activityLevel));
    const targetVal = tdeeVal - 500; 
    
    setTdee(tdeeVal); setTargetCalories(targetVal);
    
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        userInfo: userInfo, tdee: tdeeVal, targetCalories: targetVal, updatedAt: new Date().toISOString()
      }, { merge: true });
      setStep(2); setActiveTab('home');
    } catch (error) { alert("Lỗi lưu hồ sơ: " + error.message); }
  };

  const addMeal = async (e) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) return;
    try {
      await addDoc(collection(db, "users", currentUser.uid, "meals"), {
        name: newMealName, 
        weight: parseInt(newMealWeight) || 0, // Lưu khối lượng
        calories: parseInt(newMealCalories),
        carbs: parseInt(newMealMacros.carbs) || 0,
        protein: parseInt(newMealMacros.protein) || 0,
        fat: parseInt(newMealMacros.fat) || 0,
        fiber: parseInt(newMealMacros.fiber) || 0,
        type: selectedMealType, 
        date: currentDate, 
        createdAt: new Date().toISOString()
      });
      // Reset form
      setNewMealName(''); 
      setNewMealWeight('');
      setNewMealCalories(''); 
      setNewMealMacros({ carbs: '', protein: '', fat: '', fiber: '' });
      setScanResult(null);
      setActiveTab('home');
    } catch (error) { alert("Lỗi lưu dữ liệu: " + error.message); }
  };
  
  const addCommonFood = async (food) => {
    try {
      await addDoc(collection(db, "users", currentUser.uid, "meals"), {
        name: food.name, 
        weight: food.weight || 0,
        calories: food.calories, 
        carbs: food.carbs || 0,
        protein: food.protein || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        type: selectedMealType, 
        date: currentDate, 
        createdAt: new Date().toISOString()
      });
      setActiveTab('home');
    } catch (error) { alert("Lỗi lưu dữ liệu."); }
  };

  const removeMeal = async (id) => {
    if (window.confirm("Bạn muốn xóa món này?")) await deleteDoc(doc(db, "users", currentUser.uid, "meals", id));
  };

  const handleGoogleLogin = async () => { 
      try { await signInWithPopup(auth, googleProvider); } 
      catch (e) { alert("Lỗi đăng nhập Google: " + e.message); } 
  };
  
  const handleLogout = () => { signOut(auth); setStep(1); setMeals([]); setActiveTab('home'); };
  const handleInputChange = (e) => setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  
  const exportData = () => {
    const dataStr = JSON.stringify({ userInfo, meals }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `vietfit_data_${currentDate}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const editProfile = () => { setStep(1); };

  // --- TÍNH TOÁN CALO ---
  const mealsByDate = meals.filter(meal => meal.date === currentDate);
  const totalCaloriesConsumed = mealsByDate.reduce((acc, meal) => acc + meal.calories, 0);
  const remainingCalories = targetCalories - totalCaloriesConsumed;
  const progressPercentage = Math.min((totalCaloriesConsumed / targetCalories) * 100, 100);

  // --- LOGIC XỬ LÝ DỮ LIỆU BIỂU ĐỒ (7 NGÀY) ---
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const displayDay = `${d.getDate()}/${d.getMonth() + 1}`; // VD: 28/1
      
      // Lọc món ăn trong ngày đó
      const mealsInDay = meals.filter(m => m.date === dateKey);
      const totalCal = mealsInDay.reduce((acc, m) => acc + m.calories, 0);
      
      data.push({
        day: displayDay,
        cal: totalCal
      });
    }
    return data;
  };
  
  const chartData = getLast7DaysData();

  // --- UI RENDER: TAB HOME ---
  const renderHomeTab = () => (
    
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} className="text-gray-500"/></button>
        <div className="flex items-center gap-2 font-bold text-gray-700">
          <Calendar size={18} className="text-emerald-600"/> {getDisplayDate()}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} className="text-gray-500"/></button>
      </div>
      
      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 text-center">
            <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Còn lại hôm nay</h2>
            <div className={`text-5xl font-extrabold my-2 transition-colors ${remainingCalories < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{remainingCalories}</div>
            <div className="text-sm text-gray-400 mb-6">Kcal</div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                <div className={`h-3 rounded-full transition-all duration-1000 ease-out ${remainingCalories < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                <span>0</span>
                <span>Mục tiêu: {targetCalories}</span>
            </div>
        </div>
      </div>

      {/* --- BIỂU ĐỒ 7 NGÀY (MỚI THÊM) --- */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
         <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-600"/> Thống kê 7 ngày
         </h3>
         <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF'}} />
                  <Tooltip 
                     cursor={{fill: '#ECFDF5'}} 
                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="cal" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cal > targetCalories ? '#EF4444' : '#10B981'} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="flex justify-center gap-4 mt-2 text-[10px] font-medium text-gray-400">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Đạt mục tiêu</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Vượt quá</div>
         </div>
      </div>
      {/* ------------------------------- */}

      {/* Meal Lists */}
      <div>
        {MEAL_TYPES.map((type) => {
          const typeMeals = mealsByDate.filter(m => m.type === type.id);
          const typeCalories = typeMeals.reduce((acc, m) => acc + m.calories, 0);
          return (
            <div key={type.id} className="mb-6">
              <div className="flex justify-between items-center mb-3 px-2">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">{type.icon} {type.label}</h4>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{typeCalories} kcal</span>
              </div>
              {typeMeals.length === 0 ? (
                <div className="text-xs text-center text-gray-300 py-3 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">Chưa có món nào</div>
              ) : (
                <div className="space-y-2">
                  {typeMeals.map((meal) => (
                    <div key={meal.id} className="flex flex-col p-4 bg-white rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-800 text-lg">
                            {meal.name}
                            {/* Hiển thị Khối lượng ngay cạnh tên */}
                            {meal.weight > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">({meal.weight}g)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-emerald-600">{meal.calories} kcal</span>
                            <button onClick={() => removeMeal(meal.id)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 text-xs text-gray-500 font-medium">
                          <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">C: {meal.carbs || 0}g</span>
                          <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">P: {meal.protein || 0}g</span>
                          <span className="text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">F: {meal.fat || 0}g</span>
                          {(meal.fiber > 0) && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">X: {meal.fiber}g</span>}
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
  const handleWeightChange = (value) => {
    const weight = parseFloat(value);
    setNewMealWeight(value);

    // Nếu đã có dữ liệu gốc và cân nặng hợp lệ
    if (originalNutrients && weight > 0) {
        const ratio = weight / (originalNutrients.weight || 100);
        
        setNewMealCalories(Math.round(originalNutrients.calories * ratio));
        setNewMealMacros({
            carbs: Math.round(originalNutrients.carbs * ratio * 10) / 10,
            protein: Math.round(originalNutrients.protein * ratio * 10) / 10,
            fat: Math.round(originalNutrients.fat * ratio * 10) / 10,
            fiber: Math.round(originalNutrients.fiber * ratio * 10) / 10,
        });
    }
};
  // --- UI RENDER: TAB ADD ---
  const renderAddTab = () => (
    <div className="space-y-6 animate-fade-in pb-24 h-full flex flex-col">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
           <Calendar size={20} className="text-emerald-600"/> 
           Thêm vào: <span className="text-emerald-600">{getDisplayDate()}</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          {MEAL_TYPES.map(t => (
            <button 
              key={t.id}
              onClick={() => setSelectedMealType(t.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${selectedMealType === t.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              {t.icon}
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* AI Scanner Block */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 rounded-2xl shadow-lg shadow-indigo-200 text-white mb-6 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           
           <div className="flex justify-between items-center mb-3 relative z-10">
             <div>
                <div className="font-bold text-lg flex items-center gap-2"><Camera size={20}/> AI Scanner</div>
                <div className="text-xs text-indigo-100 opacity-80">Nhận diện món ăn tự động</div>
             </div>
             {isScanning && <Loader2 size={24} className="animate-spin text-white"/>}
           </div>

           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleImageUpload} 
            />
           
           <button 
             onClick={() => fileInputRef.current.click()}
             disabled={isScanning}
             className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              {isScanning ? 'Đang phân tích...' : '📸 Chụp / Tải ảnh lên'}
           </button>
        </div>

        {/* Scan Result Preview */}
        {scanResult && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-fade-in relative">
                <img src={scanResult.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white shadow-sm" />
                <div className="flex-1">
                    <div className="text-xs text-emerald-600 font-bold uppercase mb-0.5">AI Phát hiện</div>
                    <div className="font-bold text-gray-800 line-clamp-1">{scanResult.name}</div>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-gray-600 bg-gray-200 px-1 rounded">{scanResult.weight ? `${scanResult.weight}g` : '???g'}</span>
                        <span className="text-xs text-gray-500">~{scanResult.calories} kcal</span>
                    </div>
                </div>
                <button onClick={cancelScan} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
            </div>
        )}

        <form onSubmit={addMeal} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tên món</label>
              <div className="relative">
                <input 
                    type="text" 
                    value={newMealName} 
                    onChange={(e) => setNewMealName(e.target.value)} 
                    placeholder="Nhập tên món (VD: Bún bò)..." 
                    className="w-full p-4 pr-12 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-medium text-gray-800 outline-none" 
                />
                <button 
                  type="button"
                  onClick={handleTextAnalysis}
                  disabled={isTextSearching || !newMealName}
                  className="absolute right-2 top-2 bottom-2 bg-white text-emerald-600 p-2 rounded-lg border border-gray-100 shadow-sm hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                  title="AI Tự động tính Calo"
                >
                  {isTextSearching ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Sparkles size={20} className="group-hover:scale-110 transition-transform"/>
                  )}
                </button>
              </div>
          </div>

          {/* Grid nhập Macro */}
          <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'carbs', label: 'Carb', color: 'text-blue-600', bg: 'bg-blue-50' },
                { key: 'protein', label: 'Đạm', color: 'text-red-600', bg: 'bg-red-50' },
                { key: 'fat', label: 'Béo', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { key: 'fiber', label: 'Xơ', color: 'text-green-600', bg: 'bg-green-50' }
              ].map((item) => (
                <div key={item.key}>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">{item.label} (g)</label>
                   <input 
                      type="number" 
                      value={newMealMacros[item.key]} 
                      onChange={(e) => setNewMealMacros({...newMealMacros, [item.key]: e.target.value})}
                      placeholder="0"
                      className={`w-full p-2 text-center font-bold rounded-lg outline-none border border-transparent focus:border-gray-300 transition-all ${item.color} ${item.bg}`}
                   />
                </div>
              ))}
          </div>
          
          {/* CỘT KHỐI LƯỢNG VÀ CALO ĐẶT CẠNH NHAU */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 text-center">Khối lượng (g)</label>
                  <div className="relative">
                      {/* Tìm đoạn này trong code của bạn */}
                  <input 
                      type="number" 
                      value={newMealWeight} 
                      onChange={(e) => handleWeightChange(e.target.value)} // Thay đổi ở đây
                      placeholder="0" 
                      className={`w-full p-4 text-center text-xl font-extrabold bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-700 outline-none ${isTextSearching ? 'animate-pulse' : ''}`} 
                  />
                      <div className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-300 pointer-events-none"><Scale size={16}/></div>
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 text-center">Calo (kcal)</label>
                  <div className="relative">
                      <input 
                        type="number" 
                        value={newMealCalories} 
                        onChange={(e) => setNewMealCalories(e.target.value)} 
                        placeholder="0" 
                        className={`w-full p-4 text-center text-xl font-extrabold bg-emerald-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-emerald-600 outline-none ${isTextSearching ? 'animate-pulse' : ''}`} 
                       />
                       <div className="absolute top-1/2 -translate-y-1/2 right-3 text-emerald-300 pointer-events-none"><Flame size={16}/></div>
                  </div>
              </div>
          </div>

          <button type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform ${scanResult ? 'bg-emerald-600 shadow-emerald-200' : 'bg-gray-800 shadow-gray-300'}`}>
            {scanResult ? '✅ Lưu kết quả AI' : 'Lưu Món Ăn'}
          </button>
        </form>
      </div>
      
      {/* Quick Suggestions */}
      <div className="flex-1">
         <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">Gợi ý nhanh</h3>
         <div className="grid grid-cols-2 gap-3">
            {COMMON_FOODS.map((f, i) => (
                <button key={i} onClick={()=>addCommonFood(f)} className="bg-white p-3 rounded-xl border border-gray-100 text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm">
                    <div className="font-medium text-gray-800 group-hover:text-emerald-700">{f.name}</div>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="text-emerald-600 font-bold">{f.calories} kcal</span>
                        <span className="text-gray-400">| {f.weight}g</span>
                    </div>
                </button>
            ))}
         </div>
      </div>
    </div>
  );

  // --- UI RENDER: TAB PROFILE ---
  const renderProfileTab = () => (
    <div className="bg-white rounded-3xl p-6 text-center relative shadow-sm border border-gray-100 animate-fade-in">
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-red-500 font-bold border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors">Đăng xuất</button>
        
        <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-emerald-50 shadow-lg overflow-hidden bg-gray-100">
            {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-400 m-auto mt-6" />}
        </div>
        
        <h2 className="text-xl font-bold text-gray-800">{currentUser?.displayName}</h2>
        <div className="text-emerald-600 font-medium text-sm mt-1 mb-6 bg-emerald-50 inline-block px-3 py-1 rounded-full">
            Mục tiêu: {targetCalories} kcal/ngày
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
            <div className="text-center"><div className="text-xs text-gray-400 uppercase font-bold mb-1">Cân nặng</div><div className="font-extrabold text-gray-800 text-lg">{userInfo.weight} <span className="text-xs font-normal">kg</span></div></div>
            <div className="text-center border-l border-r border-gray-200"><div className="text-xs text-gray-400 uppercase font-bold mb-1">Chiều cao</div><div className="font-extrabold text-gray-800 text-lg">{userInfo.height} <span className="text-xs font-normal">cm</span></div></div>
            <div className="text-center"><div className="text-xs text-gray-400 uppercase font-bold mb-1">TDEE</div><div className="font-extrabold text-gray-800 text-lg">{tdee}</div></div>
        </div>

        <div className="space-y-3">
            <button onClick={editProfile} className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"><Settings size={18} /> Cài đặt lại chỉ số</button>
            <button onClick={exportData} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"><Download size={18} /> Xuất dữ liệu báo cáo</button>
        </div>
    </div>
  );

  // --- MAIN RENDER ---
  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
            <Loader2 size={48} className="animate-spin text-emerald-600 mb-4" />
            <div className="font-bold text-gray-500 animate-pulse">Đang đồng bộ dữ liệu...</div>
        </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleGoogleLogin} />;
  
  if (step === 1) return (
     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-xl">
           <div className="text-center mb-8">
               <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                   <Scale className="text-white w-8 h-8" />
               </div>
               <h1 className="text-2xl font-extrabold text-gray-800">Thiết lập hồ sơ</h1>
               <p className="text-sm text-gray-500 mt-2">Để AI tính toán lộ trình cho bạn</p>
           </div>
           
           <div className="space-y-5">
              <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-2 tracking-wider">Giới tính</label>
                  <div className="flex gap-3">
                      {['male', 'female'].map(g=>(
                          <button key={g} onClick={()=>setUserInfo({...userInfo, gender:g})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${userInfo.gender===g?'bg-emerald-600 text-white shadow-md transform scale-105':'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              {g==='male'?'Nam':'Nữ'}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-emerald-500 transition-colors">
                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Tuổi</label>
                      <input type="number" name="age" value={userInfo.age} onChange={handleInputChange} className="w-full bg-transparent font-extrabold text-2xl text-gray-800 outline-none" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-emerald-500 transition-colors">
                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Cao (cm)</label>
                      <input type="number" name="height" value={userInfo.height} onChange={handleInputChange} className="w-full bg-transparent font-extrabold text-2xl text-gray-800 outline-none" />
                  </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-emerald-500 transition-colors">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase">Cân nặng (kg)</label>
                  <input type="number" name="weight" value={userInfo.weight} onChange={handleInputChange} className="w-full bg-transparent font-extrabold text-3xl text-emerald-600 outline-none" />
              </div>
              
              <button onClick={saveUserProfile} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-xl shadow-gray-200 mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  Lưu & Bắt đầu ngay <ChevronRight size={18}/>
              </button>
           </div>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 md:p-4 font-sans">
      <div className="bg-gray-50 w-full max-w-md md:rounded-[2.5rem] md:border-[8px] md:border-white shadow-2xl overflow-hidden h-screen md:h-[850px] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-white p-4 pt-8 md:pt-6 shadow-sm flex justify-between sticky top-0 z-20 items-center">
          <div className="font-extrabold text-lg flex gap-2 items-center text-gray-800">
              <div className="bg-orange-500 p-1.5 rounded-lg text-white"><Flame size={18} fill="currentColor"/></div>
              Xin Chào {currentUser?.displayName}
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              {currentUser.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover"/> : <span className="text-xs font-bold text-emerald-600">VF</span>}
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'add' && renderAddTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'health' && <HealthPage />}
          {activeTab === 'info' && <InfoPage />}
        </div>
        
        {/* Bottom Nav */}
        <div className="bg-white border-t border-gray-100 p-2 px-6 pb-6 md:pb-2 absolute bottom-0 w-full z-30 flex justify-between items-center shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab==='home'?'text-emerald-600':'text-gray-300 hover:text-gray-400'}`}>
              <Home size={24} strokeWidth={activeTab==='home'?2.5:2} />
              <span className="text-[10px] font-bold">Trang chủ</span>
          </button>
          <button onClick={() => setActiveTab('info')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'info' ? 'text-emerald-600' : 'text-gray-300'}`}>
          <BookOpen size={24} strokeWidth={activeTab === 'info' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Kiến thức</span>
          </button>
          <div className="-mt-10">
              <button onClick={() => setActiveTab('add')} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 border-4 border-gray-50 ${activeTab==='add'?'bg-emerald-600':'bg-emerald-500 hover:bg-emerald-600'}`}>
                  <Plus size={32} />
              </button>
          </div>
          <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab==='health'?'text-emerald-600':'text-gray-300 hover:text-gray-400'}`}>
              <User size={24} strokeWidth={activeTab==='health'?2.5:2} />
              <span className="text-[10px] font-bold">Sức khỏe</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab==='profile'?'text-emerald-600':'text-gray-300 hover:text-gray-400'}`}>
              <User size={24} strokeWidth={activeTab==='profile'?2.5:2} />
              <span className="text-[10px] font-bold">Hồ sơ</span>
          </button>
          
          
        </div>
        
      </div>
    </div>
  );
}