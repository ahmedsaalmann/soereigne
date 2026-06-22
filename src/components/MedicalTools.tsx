import React, { useState } from "react";
import { 
  Activity, 
  Scale, 
  Flame, 
  Calculator, 
  Info, 
  ShieldAlert, 
  Search, 
  FileText, 
  Printer, 
  FileCheck, 
  History, 
  Scissors, 
  ArrowRight,
  Sparkles,
  Clipboard,
  CheckCircle2
} from "lucide-react";

// Types
interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  route?: "RAG" | "Web Search" | "Hybrid Fusion";
  matchedDocs?: string[];
  timestamp: string;
}

interface MedicalToolsProps {
  chatHistory: Message[];
  activeTraces: string[];
  onTriggerSearch: (query: string) => void;
}

export default function MedicalTools({ chatHistory = [], activeTraces = [], onTriggerSearch }: MedicalToolsProps) {
  const [activeTab, setActiveTab] = useState<"calculator" | "dosage" | "prescription" | "report">("calculator");

  // 1. Vital Calculator State
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState<string>("1.375"); // Lightly active

  // 2. Dosage State
  const [doseWeight, setDoseWeight] = useState<number>(15);
  const [medication, setMedication] = useState<"paracetamol" | "ibuprofen">("paracetamol");
  const [concentration, setConcentration] = useState<string>("120/5"); // Snoor/Adol ar-SA kids standard

  // 3. Prescription Dict & Parser State
  const [rxInput, setRxInput] = useState<string>("Tab Ibuprofen 400mg PO BID pc");
  const [rxParsedResult, setRxParsedResult] = useState<any>(null);

  // 4. Report Editor State
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("ذكر");
  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // --- VITAL CALCULATOR CALCULATIONS ---
  const heightInMeters = height / 100;
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)) : 0;
  
  // Harris-Benedict BMR
  let bmr = 0;
  if (gender === "male") {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  const dailyCalories = bmr * parseFloat(activity);

  const getBmiCategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return { label: "نقص في الوزن (Underweight)", color: "text-amber-600 bg-amber-50 border-amber-200", advice: "يُنصح بزيادة السعرات الحرارية الصحية واستشارة أخصائي تغذية." };
    if (bmiValue < 25) return { label: "وزن طبيعي ومثالي (Normal)", color: "text-emerald-700 bg-emerald-50 border-emerald-250", advice: "ممتاز! حافظ على نظامك الغذائي المتوازن وممارسة الرياضة بانتظام." };
    if (bmiValue < 30) return { label: "زيادة في الوزن (Overweight)", color: "text-amber-700 bg-amber-50 border-amber-200", advice: "يُنصح بتقليل تناول العجائن والسكريات وزيادة النشاط البدني الخفيف لمنع الانتقال لمرحلة السمنة." };
    return { label: "سمنة مفرطة (Obese)", color: "text-red-700 bg-red-50 border-red-200", advice: "خطر الإصابة بأمراض القلب والسكري مرتفع. يُوصى باتباع نظام حمية منخفض النشويات واستشارة طبيب باطني وأوعية دموية." };
  };
  const bmiInfo = getBmiCategory(bmi);


  // --- DRUG DOSAGE CALCULATIONS ---
  const getDosageCalculations = () => {
    const isPara = medication === "paracetamol";
    // Base dosage in mg/kg
    const minMgPerKg = isPara ? 10 : 5;
    const maxMgPerKg = isPara ? 15 : 10; // paracetamol: 10-15, ibuprofen: 5-10
    
    const minDoseMg = doseWeight * minMgPerKg;
    const maxDoseMg = doseWeight * maxMgPerKg;

    // Convert to mL if liquid concentration is provided
    // Concentration format: "120/5" means 120mg in 5ml
    const parts = concentration.split("/");
    const mgInUnit = parseFloat(parts[0]);
    const mlInUnit = parseFloat(parts[1]);

    const mgPerMl = mgInUnit / mlInUnit;
    const minDoseMl = minDoseMg / mgPerMl;
    const maxDoseMl = maxDoseMg / mgPerMl;

    const intervalHours = isPara ? "كل 4 إلى 6 ساعات" : "كل 6 إلى 8 ساعات";
    const maxDosesPerDay = isPara ? "أقصى حد 4 جرعات باليوم" : "أقصى حد 3 جرعات باليوم";
    const warningLimit = isPara ? doseWeight * 75 : doseWeight * 40; // Max daily limit in mg

    return {
      minDoseMg: Math.round(minDoseMg),
      maxDoseMg: Math.round(maxDoseMg),
      minDoseMl: parseFloat(minDoseMl.toFixed(1)),
      maxDoseMl: parseFloat(maxDoseMl.toFixed(1)),
      intervalHours,
      maxDosesPerDay,
      warningLimit
    };
  };
  const dosageRes = getDosageCalculations();


  // --- PRESCRIPTION DICTIONARY & PARSER ---
  const latinGlossary: { [key: string]: { ar: string; cat: string } } = {
    // Abbreviations
    "qd": { ar: "مرة واحدة يومياً (Once Daily)", cat: "التكرار (Frequency)" },
    "bid": { ar: "مرتين يومياً (Twice Daily)", cat: "التكرار (Frequency)" },
    "tid": { ar: "ثلاث مرات يومياً (Three Times Daily)", cat: "التكرار (Frequency)" },
    "qid": { ar: "أربع مرات يومياً (Four Times Daily)", cat: "التكرار (Frequency)" },
    "prn": { ar: "عند الحاجة / اللزوم (As Needed)", cat: "التكرار (Frequency)" },
    "ac": { ar: "قبل الأكل / وجبات الطعام (Before Meals)", cat: "التوقيت (Timing)" },
    "pc": { ar: "بعد الأكل / وجبات الطعام (After Meals)", cat: "التوقيت (Timing)" },
    "po": { ar: "عن طريق الفم (By Mouth / Oral)", cat: "طرق الإعطاء (Route)" },
    "hs": { ar: "عند النوم (At Bedtime)", cat: "التوقيت (Timing)" },
    "npo": { ar: "صائم / لا شيء بالفم (Nothing by Mouth)", cat: "تعليمات (Instruction)" },
    "gtt": { ar: "نقط / قطرة (Drops)", cat: "الشكل الصيدلاني" },
    // Forms
    "tab": { ar: "أقراص / حبوب (Tablet)", cat: "الشكل الصيدلاني (Form)" },
    "cap": { ar: "كبسولات (Capsule)", cat: "الشكل الصيدلاني (Form)" },
    "syr": { ar: "شراب سائل (Syrup)", cat: "الشكل الصيدلاني (Form)" },
    "susp": { ar: "معلق سائل (Suspension)", cat: "الشكل الصيدلاني (Form)" },
    "inj": { ar: "حقنة (Injection)", cat: "الشكل الصيدلاني (Form)" },
    "ung": { ar: "مرهم / دهان جل (Ointment)", cat: "الشكل الصيدلاني (Form)" },
  };

  const handleParsePrescription = () => {
    const rawText = rxInput.trim();
    if (!rawText) return;

    const words = rawText.toLowerCase().split(/\s+/);
    let parsedForm = "غير محدد";
    let parsedRoute = "غير محدد";
    let parsedFreq = "غير محدد";
    let parsedTiming = "غير محدد";
    let drugNameParts: string[] = [];
    let doseStrength = "غير محدد";

    // Regular parser loop
    words.forEach((word) => {
      // clean word
      const cleanWord = word.replace(/[,.;()]/g, "");
      
      if (cleanWord === "tab" || cleanWord === "tablet" || cleanWord === "tabs") {
        parsedForm = "حبوب / أقراص (Tablet)";
      } else if (cleanWord === "cap" || cleanWord === "capsule" || cleanWord === "caps") {
        parsedForm = "كبسولات (Capsule)";
      } else if (cleanWord === "syr" || cleanWord === "syrup") {
        parsedForm = "شراب طبي (Syrup)";
      } else if (latinGlossary[cleanWord]) {
        const item = latinGlossary[cleanWord];
        if (item.cat.includes("Frequency")) parsedFreq = item.ar;
        if (item.cat.includes("Timing")) parsedTiming = item.ar;
        if (item.cat.includes("Route")) parsedRoute = item.ar;
      } else if (/\d+(mg|g|ml|mcg|iu)/i.test(cleanWord)) {
        doseStrength = cleanWord.toUpperCase();
      } else {
        // Assume part of drug name if not a quantity
        if (!/^\d+$/.test(cleanWord) && cleanWord !== "po") {
          drugNameParts.push(word);
        }
      }
    });

    const parsedName = drugNameParts.join(" ") || "دواء غير مسمى";

    // Build the final clinical Arabic statement
    const explanation = `أوصى الطبيب بجرعة من **[${parsedName}]** بتركيز **[${doseStrength}]**، بالشكل الصيدلاني: **[${parsedForm}]**، وتؤخذ **[${parsedRoute}]**، بمعدل استخدام: **[${parsedFreq}]**، والتوقيت المفضل هو **[${parsedTiming}]**.`;

    setRxParsedResult({
      drugName: parsedName,
      strength: doseStrength,
      form: parsedForm,
      route: parsedRoute,
      frequency: parsedFreq,
      timing: parsedTiming,
      explanation
    });
  };


  // --- REPORT GENERATION SUMMARY ---
  const handleCopyReport = () => {
    const textReport = getReportText();
    navigator.clipboard.writeText(textReport);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("الرجاء السماح للنوافذ المنبثقة لطباعة التقرير الطبي.");
      return;
    }

    const reportHtml = `
      <html>
        <head>
          <title>Sovereign Medical RAG - تقرير استشارة طبية</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 40px; color: #334155; }
            .header { text-align: center; border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0f172a; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 12px; font-weight: bold; }
            .patient-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
            .patient-box table { width: 100%; border-collapse: collapse; }
            .patient-box td { padding: 6px; font-size: 14px; }
            .patient-box td.label { font-weight: bold; color: #475569; width: 15%; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; margin-bottom: 15px; }
            .advice-block { line-height: 1.6; font-size: 14px; text-align: justify; }
            .footer { margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 10px; color: #94a3b8; }
            .signature-area { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { border-top: 1px dashed #94a3b8; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sovereign Medical RAG AI - مشروع تخرج الوكيل الطبي الذكي</h1>
            <p>تقرير ملخص الاستشارة السريرية المعتمدة علمياً • قاعدة بيانات GALE الطبية</p>
          </div>

          <div class="patient-box">
            <table>
              <tr>
                <td class="label">اسم المريض:</td>
                <td>${patientName || "غير مسجل"}</td>
                <td class="label">تاريخ التقرير:</td>
                <td>${new Date().toLocaleDateString("ar-EG")}</td>
              </tr>
              <tr>
                <td class="label">العمر / الجنس:</td>
                <td>${patientAge ? patientAge + " سنة" : "غير محدد"} / ${patientGender}</td>
                <td class="label">الحالة التشخيصية:</td>
                <td>استشارة طبية أولية بالذكاء الاصطناعي</td>
              </tr>
              <tr>
                <td class="label">الشكوى الرئيسية:</td>
                <td colspan="3">${chiefComplaint || "فحص طبي وقائي واستفسار عام"}</td>
              </tr>
            </table>
          </div>

          <div class="section-title">🩺 التوصيات الطبية والتحليل السريري للذكاء الاصطناعي</div>
          <div class="advice-block">
            ${chatHistory.length > 1 
              ? chatHistory.filter(m => m.id !== "welcome").map(m => `
                  <p><strong>[${m.role === "user" ? "استفسار المريض" : "إجابة المساعد الطبي"}] (${m.timestamp}):</strong></p>
                  <p style="padding-right: 15px; border-right: 3px solid #3b82f6; white-space: pre-line;">${m.text.replace(/\*\*/g, "")}</p>
                `).join("")
              : "<p>لم يتم تسجيل محادثات نشطة بعد في هذه الوجبة. يمكنك بدء التحدث مع الوكيل لتوليد التقرير تلقائياً.</p>"
            }
          </div>

          <div class="section-title">📊 تفاصيل المؤشرات الحيوية المقاسة (إن وجدت)</div>
          <p style="font-size: 13px; line-height: 1.5;">
            • وزن المريض: ${weight} كجم | طول المريض: ${height} سم | مؤشر كتلة الجسم الحسابي: **${bmi.toFixed(1)}** (${getBmiCategory(bmi).label}) <br/>
            • كمية الاحتياج اليومي المقدر للطاقة (BMR): **${Math.round(dailyCalories)} سعرة حرارية**.
          </p>

          <div class="signature-area">
            <div class="signature-box">ختم وحدة التدقيق RAG AI</div>
            <div class="signature-box">توقيع الطبيب المتابع</div>
          </div>

          <div class="footer">
            تنبيه طبي صارم: هذا التقرير تم تجميعه آلياً عبر خوارزمية الذكاء الاصطناعي التوليدي التابعة لـ Sovereign Med RAG للأغراض التعليمية والأكاديمية، ولا يعتبر مستنداً طبياً قانونياً دون توقيع وختم الطبيب البشري المختص والمسؤول.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const getReportText = () => {
    return `=========================================
Sovereign Medical RAG AI - تقرير الاستشارة الطبية
=========================================
تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")}
اسم المريض: ${patientName || "غير مسجل"}
العمر: ${patientAge || "غير محدد"} | الجنس: ${patientGender}
الشكوى الرئيسية: ${chiefComplaint || "استعلام طبي وقائي عام"}

المؤشرات الحيوية المسجلة:
- الطول: ${height} سم | الوزن: ${weight} كجم
- مؤشر كتلة الجسم (BMI): ${bmi.toFixed(1)} [${bmiInfo.label}]
- السعرات اليومية المقدرة: ${Math.round(dailyCalories)} سعرة حرارية

ملخص جلسة الاستفسارات:
${chatHistory.length > 1 
  ? chatHistory.filter(m => m.id !== "welcome").map(m => `\n[${m.role === "user" ? "المريض" : "الذكاء الاصطناعي"}] ${m.timestamp}:\n${m.text.replace(/\*\*/g, "")}`).join("\n") 
  : "لا توجد حوارات مسجلة بعد في هذه الجلسة."
}

-----------------------------------------
تنبيه طبي: هذا التقرير تولد آلياً لأغراض أكاديمية وتعليمية بمشروع التخرج، ويجب مراجعته من طبيب بشري معتمد للتصريح الرسمي.`;
  };


  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm h-full" id="assistive-workstation-card">
      {/* Dynamic Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 text-right text-rtl">منصة الأدوات السريرية المساعدة</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight text-right text-rtl">4 ميزات طبيّة تفاعلية تدعم مشروع تخرجك</p>
            </div>
          </div>
        </div>

        {/* Custom Tab Triggers */}
        <div className="grid grid-cols-4 gap-1 mt-3">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`py-2 px-1 text-center rounded-lg border text-[10px] sm:text-xs font-semibold transition-all ${
              activeTab === "calculator"
                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-550 hover:bg-slate-50"
            }`}
          >
            📊 مؤشرات وصحة
          </button>
          <button
            onClick={() => setActiveTab("dosage")}
            className={`py-2 px-1 text-center rounded-lg border text-[10px] sm:text-xs font-semibold transition-all ${
              activeTab === "dosage"
                ? "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-550 hover:bg-slate-50"
            }`}
          >
            💊 حساب الجرعات
          </button>
          <button
            onClick={() => setActiveTab("prescription")}
            className={`py-2 px-1 text-center rounded-lg border text-[10px] sm:text-xs font-semibold transition-all ${
              activeTab === "prescription"
                ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-550 hover:bg-slate-50"
            }`}
          >
            📝 رموز الروشتة
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`py-2 px-1 text-center rounded-lg border text-[10px] sm:text-xs font-semibold transition-all ${
              activeTab === "report"
                ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-550 hover:bg-slate-50"
            }`}
          >
            📋 تصدير التقرير
          </button>
        </div>
      </div>

      {/* Dynamic Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: Vital Diagnostics Calculator */}
        {activeTab === "calculator" && (
          <div className="space-y-4 text-right text-rtl transition-all">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 flex gap-2.5 items-start">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p>مخصص لحساب مؤشر كتلة الجسم **(BMI)** ومعدل الأيض اليومي وسعراتك **(BMR)** اعتماداً على معادلات هاريس-بينديكت المعتمدة سريرياً.</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الوزن (كجم): {weight}</label>
                  <input 
                    type="range" 
                    min="30" 
                    max="180" 
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الطول (سم): {height}</label>
                  <input 
                    type="range" 
                    min="100" 
                    max="220" 
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الجنس</label>
                  <select 
                    value={gender} 
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">العمر</label>
                  <input 
                    type="number" 
                    value={age}
                    min="1"
                    max="110"
                    onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">النشاط البدني</label>
                  <select 
                    value={activity} 
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[9px] focus:outline-none"
                  >
                    <option value="1.2">خامل (بلا رياضة)</option>
                    <option value="1.375">خفيف (1-3 أيام)</option>
                    <option value="1.55">متوسط (3-5 أيام)</option>
                    <option value="1.725">نشط جداً (يومياً)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculations results */}
            <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-100 pt-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                <span className="text-[10px] font-bold text-slate-455 uppercase block mb-1">مؤشر كتلة الجسم (BMI)</span>
                <span className="text-xl font-extrabold text-blue-600 block">{bmi.toFixed(1)}</span>
                <span className={`inline-block text-[9px] font-semibold mt-1 px-2 py-0.5 rounded-full border ${bmiInfo.color}`}>
                  {bmiInfo.label}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                <span className="text-[10px] font-bold text-slate-455 uppercase block mb-1">السعرات المقترحة يومياً</span>
                <span className="text-xl font-extrabold text-indigo-650 block">{Math.round(dailyCalories)}</span>
                <span className="text-[9px] font-medium text-slate-400 block mt-1">kcal للوزن الحالي</span>
              </div>
            </div>

            {/* Clinical Warning & Tips */}
            <div className="p-3 bg-slate-55 bg-indigo-50/40 rounded-xl border border-indigo-100/70 text-xs">
              <span className="font-bold text-indigo-900 block mb-0.5">⚠️ التوصية الطبية الحسابية:</span>
              <p className="text-slate-650 leading-relaxed text-[11px]">{bmiInfo.advice}</p>
            </div>

            <button
              onClick={() => onTriggerSearch(`مؤشر كتلة جسمي هو ${bmi.toFixed(1)}، ما هي النصائح الطبية المقترحة لنظامي الغذائي؟`)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              سل الوكيل الطبي عن خطة تخسيس/تغذية مناسبة
            </button>
          </div>
        )}

        {/* TAB 2: Drug Dosage Safety Calculator */}
        {activeTab === "dosage" && (
          <div className="space-y-4 text-right text-rtl transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100 text-xs flex gap-2.5 items-start">
              <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p>حساب دقيق لجرعات أدوية الأطفال المعتمدة على الوزن (ملغ/كلغ) الخاصة بـ **الباراسيتامول** و **الإيبوبروفين**، لتفادي التسمم والجرعة الزائدة.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">المادة الفعالة (Medication)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMedication("paracetamol"); setConcentration("120/5"); }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      medication === "paracetamol"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    باراسيتامول (أدول/بنادول)
                  </button>
                  <button
                    onClick={() => { setMedication("ibuprofen"); setConcentration("100/5"); }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      medication === "ibuprofen"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    إيبوبروفين (بروفين)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">وزن الطفل: {doseWeight} كجم</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="60" 
                    value={doseWeight}
                    onChange={(e) => setDoseWeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تركيز الشراب (مجم/مل)</label>
                  <select 
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    {medication === "paracetamol" ? (
                      <>
                        <option value="120/5">120 مجم / 5 مل (معلق رضع)</option>
                        <option value="250/5">250 مجم / 5 مل (معلق أطفال)</option>
                      </>
                    ) : (
                      <>
                        <option value="100/5">100 مجم / 5 مل (بروفين شراب)</option>
                        <option value="200/5">200 مجم / 5 مل (فورت شراب)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Dosages Computed */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-200 pb-1">الجرعة الفردية الموصى بها طبياً للرضعات:</span>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">الجرعة الفعالة بالمليجرام:</span>
                <span className="font-bold text-slate-800">{dosageRes.minDoseMg} - {dosageRes.maxDoseMg} مجم</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">الحجم السائل المقابل (شراب مل):</span>
                <span className="font-extrabold text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {dosageRes.minDoseMl} مل - {dosageRes.maxDoseMl} مل
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/50 pt-1.5">
                <span className="text-slate-500">التكرار والجدول الزمني:</span>
                <span className="font-semibold text-indigo-700">{dosageRes.intervalHours}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] py-0.5 text-slate-400">
                <span>قيود التناول القصوى:</span>
                <span className="font-mono">{dosageRes.maxDosesPerDay}</span>
              </div>
            </div>

            {/* Toxicity limit indicator */}
            <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-100 text-[11px] leading-relaxed">
              <span className="font-bold block text-red-700 mb-0.5">🚨 تنبيه تسمم الجرعة الزائدة (Toxic dose warning):</span>
              يتجاوز الحد الأقصى التراكمي لجرعة الطفل اليومية للوزن المختار **{dosageRes.warningLimit} مجم** باليوم. يجب الاحتفاظ بزجاجة الدواء بعيداً عن متناول الأيدي والالتزام بالحقاق السائل المرفق.
            </div>
          </div>
        )}

        {/* TAB 3: RX SCRIPT INTERPRETER */}
        {activeTab === "prescription" && (
          <div className="space-y-4 text-right text-rtl transition-all">
            <div className="p-3 bg-violet-50 text-violet-900 rounded-xl border border-violet-150 text-xs flex gap-2.5 items-start">
              <Clipboard className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
              <p>مفسّر عبارات ومصطلحات الروشتة اللاتينية المبهمة. اكتب الرموز لتفسير فوري لجرعة الأطباء بلغة عربية مبسطة.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500">اكتب عبارات الروشتة اللاتينية (أو استخدم النموذج أدناه):</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={rxInput}
                  onChange={(e) => setRxInput(e.target.value)}
                  placeholder="مثال: Tab Paracetamol 500mg PO TID pc"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-left font-mono focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Sample presets for fast testing */}
              <div className="flex flex-wrap gap-1.5 justify-start">
                <button
                  type="button"
                  onClick={() => { setRxInput("Cap Amoxicillin 500mg PO TID ac"); }}
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono px-2 py-1 rounded border border-slate-200"
                >
                  Amoxicillin ac
                </button>
                <button
                  type="button"
                  onClick={() => { setRxInput("Tab Paracetamol 500mg PO PRN hs"); }}
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono px-2 py-1 rounded border border-slate-200"
                >
                  Panadol PRN
                </button>
                <button
                  type="button"
                  onClick={() => { setRxInput("Gtt Tobramycin 0.3% BID po"); }}
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono px-2 py-1 rounded border border-slate-200"
                >
                  Tobramycin Gtt
                </button>
              </div>

              <button
                type="button"
                onClick={handleParsePrescription}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-sm transition-all"
              >
                تفسير وفك شفرة مصطلحات الروشتة مجاناً
              </button>
            </div>

            {/* Parse output result visualizer */}
            {rxParsedResult && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 flex justify-between items-center">
                  <span>نتائج تفكيك شفرة الوصفة الطبية</span>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">● محلل ذكي</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">اسم الدواء وقوته:</span>
                    <span className="font-mono text-slate-800 font-bold">{rxParsedResult.drugName} ({rxParsedResult.strength})</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">التكرار اللاتيني:</span>
                    <span className="text-violet-700 font-bold">{rxParsedResult.frequency}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">الشكل والطريق:</span>
                    <span className="text-slate-800">{rxParsedResult.form} / {rxParsedResult.route}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">توقيت الجرعة:</span>
                    <span className="text-indigo-700 font-semibold">{rxParsedResult.timing}</span>
                  </div>
                </div>

                <div className="p-3 bg-violet-50/75 border border-violet-100 rounded-lg text-xs leading-relaxed text-slate-800">
                  <span className="font-bold text-violet-900 block mb-1">📝 الترجمة العربية الطبية المكتوبة:</span>
                  <p dangerouslySetInnerHTML={{ __html: rxParsedResult.explanation.replace(/\*\*([^*]+)\*\*/g, "<strong class='text-slate-900 font-bold'>$1</strong>") }} />
                </div>
              </div>
            )}

            {/* Quick reference glossary preview */}
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-[10px] space-y-1.5 text-slate-500">
              <span className="font-semibold block text-slate-600">جدول الاختصارات الطبية السريعة:</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-left items-center pt-1 border-t border-slate-100">
                <div>qd: <span className="font-sans text-right">مرة يومياً</span></div>
                <div>bid: <span className="font-sans text-right">مرتين يومياً</span></div>
                <div>tid: <span className="font-sans text-right">٣ مرات يومياً</span></div>
                <div>prn: <span className="font-sans text-right">عند اللزوم</span></div>
                <div>ac: <span className="font-sans text-right">قبل الأكل</span></div>
                <div>pc: <span className="font-sans text-right">بعد الأكل</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCREDITED MEDICAL REPORT & EXPORT EXCEL/PDF */}
        {activeTab === "report" && (
          <div className="space-y-4 text-right text-rtl transition-all">
            <div className="p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-100 text-xs flex gap-2.5 items-start">
              <FileCheck className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <p>تصدير تقرير الاستشارة والتحليلات الطبية التي تمت مع وكيل الذكاء الاصطناعي RAG وتعديل بيانات المريض للطباعة.</p>
            </div>

            <div className="space-y-2 border border-slate-150 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[11px] font-bold text-slate-500 block border-b border-slate-200 pb-1 mb-2">تعديل بيانات مريض التقرير:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">اسم المريض</label>
                  <input 
                    type="text" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="مثل أحمد سلمان"
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-right focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">العمر بالسنوات</label>
                  <input 
                    type="number" 
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="23"
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">الجنس</label>
                  <select 
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                  >
                    <option value="ذكــر">ذكــر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">العرض / الشكوى</label>
                  <input 
                    type="text" 
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="مثال: آلام الصداع المستمر"
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Download and copy triggers */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handlePrintReport}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                طباعة / تصدير PDF
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className={`rounded-xl py-3 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 border ${
                  copiedSuccess 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    تم نسخ التقرير!
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 text-slate-400" />
                    نسخ النص بالكامل
                  </>
                )}
              </button>
            </div>

            {/* Quick Consultation length state */}
            <div className="text-[10px] text-slate-400 text-center">
              تم تحميل عدد **({Math.max(0, chatHistory.length - 1)})** استفسار مسجل بجلسة المحادثة النشطة للتصدير المباشر.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
