import React from 'react';
import { 
  BookOpen, Flame, Target, Info, 
  ChevronRight, ArrowDownCircle, Scale, Activity 
} from 'lucide-react';

const InfoPage = () => {
  const nutritionTips = [
    {
      title: "TDEE là gì?",
      content: "Total Daily Energy Expenditure là tổng số calo cơ thể bạn đốt cháy trong 24 giờ thông qua vận động, tiêu hóa và trao đổi chất cơ bản.",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Quy tắc 7.700 Calo",
      content: "Để giảm được 1kg mỡ thừa, bạn cần tạo ra sự thâm hụt khoảng 7.700 calo so với mức duy trì cân nặng.",
      color: "bg-orange-50 text-orange-700"
    },
    {
      title: "Chỉ số BMR là gì?",
      content: "BMR (Basal Metabolic Rate – tỷ lệ trao đổi chất cơ bản) biểu thị lượng calo tối thiểu cơ thể cần tiêu hao để duy trì các chức năng thiết yếu để duy trì sự sống.",
      color: "bg-orange-50 text-orange-700"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="text-center py-4">
        <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
          <BookOpen className="text-emerald-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-800">Kiến Thức Dinh Dưỡng</h1>
        <p className="text-sm text-gray-400">Chỉ số chuẩn từ chuyên gia VietFit</p>
      </div>

      {/* 1. Bảng mục tiêu Calo */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="text-red-500" size={20} /> Công thức điều chỉnh Calo
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-2xl border border-red-100">
            <span className="text-xs font-bold text-red-800">Giảm cân nhanh</span>
            <span className="font-black text-red-600">TDEE - 700 kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800">Giảm cân bền vững</span>
            <span className="font-black text-emerald-600">TDEE - 500 kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-600">Duy trì cân nặng</span>
            <span className="font-black text-gray-800">Bằng TDEE</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-blue-800">Tăng cân / Tăng cơ</span>
            <span className="font-black text-blue-600">TDEE + 300 kcal</span>
          </div>
        </div>
      </div>

      {/* 2. Thành phần TDEE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="text-indigo-500" size={20} /> Năng lượng tiêu hao gồm những gì?
        </h3>
        
        

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-[10px] font-bold text-gray-400 uppercase">BMR (60-70%)</div>
            <div className="text-xs text-gray-600">Năng lượng nghỉ ngơi</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-[10px] font-bold text-gray-400 uppercase">Vận động (20-30%)</div>
            <div className="text-xs text-gray-600">Đi lại, tập luyện</div>
          </div>
        </div>
      </div>

      {/* 3. Tỷ lệ Macro chuẩn (Carb/Protein/Fat) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Scale className="text-amber-500" size={20} /> Tỷ lệ dinh dưỡng khuyến nghị
        </h3>
        
        <div className="flex items-center justify-around text-center py-2">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 font-bold">45%</div>
            <span className="text-[10px] font-bold text-gray-400">CARBS</span>
          </div>
          <div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600 font-bold">30%</div>
            <span className="text-[10px] font-bold text-gray-400">PROTEIN</span>
          </div>
          <div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-600 font-bold">25%</div>
            <span className="text-[10px] font-bold text-gray-400">FATS</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-4 italic">
          * Tỷ lệ có thể thay đổi tùy theo mục tiêu tập luyện (tăng cơ cần nhiều đạm hơn).
        </p>
      </div>

      {/* 4. Tips & Kiến thức */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase px-2">Mẹo nhỏ mỗi ngày</h3>
        {nutritionTips.map((tip, index) => (
          <div key={index} className={`${tip.color} p-5 rounded-3xl`}>
            <h4 className="font-bold mb-1">{tip.title}</h4>
            <p className="text-xs leading-relaxed opacity-90">{tip.content}</p>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default InfoPage;