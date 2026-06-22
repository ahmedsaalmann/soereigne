import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  User, 
  Send, 
  Database, 
  Globe, 
  Cpu, 
  Terminal, 
  BookOpen, 
  Heart, 
  Activity, 
  Info, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Share2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image,
  X
} from "lucide-react";
import { medicalKB, MedicalDoc } from "./data/medical_kb";
import MedicalTools from "./components/MedicalTools";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  route?: "RAG" | "Web Search" | "Hybrid Fusion";
  matchedDocs?: string[];
  traces?: string[];
  timestamp: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: `مرحباً بك في **نظام الوكيل الطبي الذكي (Sovereign Medical RAG AI)** 🩺. 

هذا المشروع يمثل معمارية متقدمة في الذكاء الاصطناعي مخصصة للاستشارات والتحليل الطبي العام كـ **مشروع تخرج**. 

**لماذا يختلف هذا النظام عن ChatGPT التقليدي؟**
1. **RAG (الجيل المعزز بالاسترجاع):** يقوم بالبحث التلقائي في قاعدة المعرفة الطبية المدمجة (موسوعة *GALE Encyclopedia of Medicine*) للتحقق من الحقائق الطبية وتجنب الهلوسة.
2. **Web Grounding (البحث الإلكتروني المباشر):** إذا لم تتوفر المعلومة محلياً، فإنه يبحث عبر الويب تلقائياً لتحديث معرفته.
3. **وحدة التوجيه الذكية (Autonomous Agent Router):** يقرر ديناميكياً المسار الأنسب للإجابة (RAG أو Web Search أو كلاهما).

يمكنك تجربة طرح أي سؤال طبي مثل:
* *ما هي أعراض مرض السكر؟*
* *علاج نزلات البرد والزكام؟*
* *كيف أحافظ على صحة القلب؟*
* *ما هي استخدامات دواء الباراسيتامول؟*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      route: "RAG"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<"RAG" | "Web Search" | "Hybrid Fusion" | null>("RAG");
  const [activeTraces, setActiveTraces] = useState<string[]>([
    "🚀 تم تشغيل نظام الوكيل بنجاح.",
    "📁 تم تحميل قاعدة بيانات GALE الطبية الموثوقة.",
    "🛡️ بانتظار استلام استفسارات المستخدم..."
  ]);
  const [kbSearchTerm, setKbSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<MedicalDoc | null>(medicalKB[0]);
  const [leftPanelTab, setLeftPanelTab] = useState<"index" | "tools">("index");

  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API States
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [speechLang, setSpeechLang] = useState<"ar-SA" | "en-US">("ar-SA");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechLib = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechLib) {
      setIsRecognitionSupported(false);
      return;
    }

    const rec = new SpeechLib();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = speechLang;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setActiveTraces(prev => [...prev, `🎙️ تم تفعيل ميكروفون الاستماع باللغة: ${speechLang === "ar-SA" ? "العربية" : "الإنجليزية"}`]);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputValue(prev => prev ? prev + " " + transcript : transcript);
        setActiveTraces(prev => [...prev, `🎙️ تم إدخال النص صوتياً: "${transcript}"`]);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      let friendlyError = `خطأ في التعرف على الصوت: ${event.error}`;
      if (event.error === "network") {
        friendlyError = "عفواً، الخدمة الصوتية تعذرت بسبب ضعف اتصال إنترنت الميكروفون المباشر أو قيود الشبكة المحمية. ننصح باستخدام متصفح Google Chrome الرسمي أو إدخال النص كتابياً.";
      } else if (event.error === "not-allowed") {
        friendlyError = "إذن الميكروفون محجوب أو مرفوض. يرجى تعديل أذونات الموقع من إعدادات المتصفح لإتاحة الميكروفون.";
      } else if (event.error === "no-speech") {
        friendlyError = "لم نلتقط أي كلام. يرجى الاقتراب من الهاتف والتحدث بوضوح.";
      }
      
      setSpeechError(friendlyError);
      setActiveTraces(prev => [...prev, `⚠️ ${friendlyError}`]);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    synthRef.current = window.speechSynthesis;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update speech synthesis and recognition language if speechLang changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
  }, [speechLang]);

  // Handle Voice Output (Text to Speech)
  const speakMessage = (messageId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (activeSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text of markdown formatting for optimal speaking quality
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Strip bold asterisks
      .replace(/###\s+/g, "") // Strip h3
      .replace(/##\s+/g, "") // Strip h2
      .replace(/[\*\-\•]\s+/g, "") // Strip list bullets
      .replace(/[`_#\*]/g, ""); // Strip other markdown

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose voice language based on dominant text script or speech preference
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    utterance.lang = isArabic ? "ar-SA" : "en-US";

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => {
      if (isArabic) {
        return v.lang.startsWith("ar");
      } else {
        return v.lang.startsWith("en");
      }
    });

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setActiveSpeakingId(messageId);
    };

    utterance.onend = () => {
      setActiveSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis error", e);
      setActiveSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("عذراً، ميزة التعرف على الصوت غير مدعومة في متصفحك الحالي.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition", e);
      }
    }
  };

  const copyShareLink = () => {
    const link = "https://ais-pre-y7e3l3jjewbeha7ftmmxuu-329205954423.europe-west1.run.app";
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }).catch(err => {
      console.error("Failed to copy", err);
      // Fallback alert
      alert("الرابط: " + link);
    });
  };

  // Handle image attachment change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("الملف المرفق ليس صورة. يرجى اختيار ملف صورة صالح (PNG, JPEG, ...).");
      return;
    }

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setImageError("حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      if (commaIndex !== -1) {
        const base64 = result.substring(commaIndex + 1);
        setSelectedImageBase64(base64);
        setSelectedImageMimeType(file.type);
      } else {
        setImageError("فشل في ترميز بيانات الصورة بصيغة Base64.");
      }
    };
    reader.onerror = () => {
      setImageError("حدث خطأ أثناء قراءة ملف الصورة.");
    };
    reader.readAsDataURL(file);
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle message submission
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() && !selectedImageBase64) return;
    if (isLoading) return;

    // Capture current attachments locally so state can be reset instantly
    const attachedBase64 = selectedImageBase64;
    const attachedMimeType = selectedImageMimeType;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend || (attachedBase64 ? "[تم إرفاق صورة للفحص]" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(attachedBase64 && attachedMimeType ? {
        image: {
          base64: attachedBase64,
          mimeType: attachedMimeType
        }
      } : {})
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSelectedImageBase64(null);
    setSelectedImageMimeType(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true);
    setActiveRoute(null);

    // Initial agent trace specifying whether medical vision is active
    const initialTraces = [
      "🔍 تم استقبال استفسار طبي جديد.",
      `💬 المحتوى: "${textToSend || "[تحليل فحص صورة مرفقة]"}"`
    ];
    if (attachedBase64) {
      initialTraces.push("📸 تم الكشف عن مرفق صوري: جاري تنشيط الرؤية الحاسوبية السريرية وتحليل ملامح الآفة الجلدية...");
    }
    initialTraces.push("🧠 جاري تفعيل وحدة الاستدعاء السريع والموجّه...");
    setActiveTraces(initialTraces);

    try {
      // Map message history to server format
      const chatHistory = messages
        .filter(m => m.id !== "welcome") // skip welcome message to avoid noise in test context
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend || "يرجى فحص وتحليل الصورة المرفقة بدقة وتحديد نوع وحالة الآفات أو الأعراض الجسدية الظاهرة مع تقديم الإرشادات المناسبة.",
          history: chatHistory,
          base64Image: attachedBase64,
          mimeType: attachedMimeType
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: data.text,
        route: data.route,
        matchedDocs: data.matchedDocs,
        traces: data.traces,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
      if (isAutoSpeak) {
        speakMessage(botMessage.id, botMessage.text);
      }
      if (data.route) {
        setActiveRoute(data.route);
      }
      if (data.traces && Array.isArray(data.traces)) {
        setActiveTraces(data.traces);
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `🚨 **فشل في جلب الإجابة من الوكيل:** ${error.message || "حدث خطأ غير متوقع في الاتصال بالخادم."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      setActiveTraces(prev => [...prev, `🔴 فشل العملية: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter local medicine index
  const filteredKB = medicalKB.filter(doc => {
    const term = kbSearchTerm.toLowerCase();
    return (
      doc.titleEn.toLowerCase().includes(term) ||
      doc.titleAr.includes(term) ||
      doc.tags.some(tag => tag.includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Professional Decorative Bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 w-full" />

      {/* Main App Bar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-800">Sovereign Med RAG AI</h1>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-200">AGENTIC RAG v2.5</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">Graduation Project • GALE Medical Retrieval Augmented Generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowShareModal(true);
                setIsCopied(false);
              }}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-all px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              title="مشاركة ورؤية رابط مشاركة الهاتف لتجنب خطأ الصفحة غير الموجودة"
            >
              <Share2 className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-rtl font-medium">مشاركة رابط الجوال 📱</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-slate-600">SYSTEM: ONLINE</span>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Time (UTC): <span className="font-mono text-slate-700">2026-06-22</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Side: Medical Database Registry & Agent Controls (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          
          {/* Dashboard Agent Router Monitor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-455 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> State Engine (موجه الوكيل التلقائي)
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {/* RAG State */}
              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeRoute === "RAG" 
                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                : "border-slate-200 bg-slate-50/50 text-slate-400"
              }`}>
                <Database className={`h-5 w-5 mx-auto mb-1.5 ${activeRoute === "RAG" ? "text-blue-600" : ""}`} />
                <span className="text-xs font-semibold block">RAG Mode</span>
                <span className="text-[9px] font-mono text-slate-400">GALE local</span>
              </div>

              {/* Hybrid State */}
              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeRoute === "Hybrid Fusion" 
                ? "bg-blue-50 border-indigo-500 text-indigo-700 shadow-sm" 
                : "border-slate-200 bg-slate-50/50 text-slate-400"
              }`}>
                <Sparkles className={`h-5 w-5 mx-auto mb-1.5 ${activeRoute === "Hybrid Fusion" ? "text-indigo-600" : ""}`} />
                <span className="text-xs font-semibold block">Hybrid</span>
                <span className="text-[9px] font-mono text-slate-400">RAG + Web</span>
              </div>

              {/* Web Search State */}
              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeRoute === "Web Search" 
                ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm" 
                : "border-slate-200 bg-slate-50/50 text-slate-400"
              }`}>
                <Globe className={`h-5 w-5 mx-auto mb-1.5 ${activeRoute === "Web Search" ? "text-amber-600" : ""}`} />
                <span className="text-xs font-semibold block">Web Search</span>
                <span className="text-[9px] font-mono text-slate-400">Dynamic</span>
              </div>
            </div>

            {/* Decision explanation depending on active route */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 leading-relaxed block text-right text-rtl">
                {activeRoute === "RAG" && "الوكيل في وضع RAG المباشر. يتم جلب البيانات بدقة فائقة من المراجع الطبية المعتمدة للحد من نسب التزييف."}
                {activeRoute === "Hybrid Fusion" && "الوكيل في وضع الدمج الهجين. وجد الوكيل أصلاً طبياً في الموسوعة ولكنه يعزز الإجابة بالبحث عبر الويب لضمان الشمولية."}
                {activeRoute === "Web Search" && "الوكيل يخاطب مصادر الويب المباشرة. لم تحتوِ الموسوعة على المقال المطلوب فتم استدعاء محركات البحث الطبية الموثقة."}
                {!activeRoute && "جاري معالجة السؤال وتحديد مسار الإحالة الأنسب طبيّاً..."}
              </span>
            </div>
          </div>

          {/* Tab Selection for Left Panel Content */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 animate-fade-in" id="left-sidebar-navigation-tabs">
            <button
              onClick={() => setLeftPanelTab("index")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                leftPanelTab === "index"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              أرشيف الموسوعة
            </button>
            <button
              onClick={() => setLeftPanelTab("tools")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                leftPanelTab === "tools"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              أدوات التقييم والعيادة
            </button>
          </div>

          {leftPanelTab === "index" ? (
            /* Gale Encyclopedia Medical Index (Index Viewer) */
            <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-[350px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" /> Gale Medicine Index (أرشيف الكتب)
                </h2>
                {/* Search Bar for local Archive */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ابحث في الموسوعة المحلية..."
                    value={kbSearchTerm}
                    onChange={(e) => setKbSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-400 text-right text-rtl"
                  />
                </div>
              </div>

              {/* List of document titles */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredKB.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs text-rtl">
                    لا توجد نتائج بحث مطابقة.
                  </div>
                ) : (
                  filteredKB.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-right px-4 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                        selectedDoc?.id === doc.id
                        ? "bg-blue-50/60 border border-blue-200 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <ChevronRight className={`h-3 w-3 ${selectedDoc?.id === doc.id ? "text-blue-500" : "text-slate-400"}`} />
                      <div className="text-right">
                        <span className="block text-slate-800">{doc.titleAr}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{doc.titleEn}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Document Preview card */}
              {selectedDoc && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="bg-blue-100 text-blue-700 font-mono text-[9px] px-2 py-0.5 rounded-full border border-blue-200">
                      {selectedDoc.category}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">Verified text fallback</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-rtl text-sm">{selectedDoc.titleAr}</h3>
                  <p className="text-slate-600 mt-1 line-clamp-3 leading-relaxed text-rtl">
                    {selectedDoc.definition}
                  </p>
                  <button 
                    onClick={() => handleSendMessage(`حدثني بالتفصيل عن ${selectedDoc.titleAr}`)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1 font-semibold transition-colors"
                  >
                    سل الوكيل عن هذا الموضوع <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden min-h-[350px]">
              <MedicalTools chatHistory={messages} activeTraces={activeTraces} onTriggerSearch={handleSendMessage} />
            </div>
          )}
        </section>

        {/* Right Side: Chat & Agent Trace Panel (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
          
          {/* Chat Terminal (Main Console) */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm minimum-h-[480px]">
            {/* Header info */}
            <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight">Interactive Patient Console</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Auto read aloud switch button */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isAutoSpeak;
                    setIsAutoSpeak(next);
                    if (!next && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      setActiveSpeakingId(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] transition-all font-medium ${
                    isAutoSpeak
                      ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                  title="تفعيل أو تعطيل القراءة الصوتية التلقائية لردود الذكاء الاصطناعي"
                >
                  <Volume2 className={`h-3.5 w-3.5 ${isAutoSpeak ? "text-blue-600 animate-pulse" : "text-slate-400"}`} />
                  <span className="text-rtl text-right">قراءة تلقائية</span>
                </button>

                <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-mono">
                  Model: gemini-3.5-flash
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-white">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user"
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-blue-600 text-white"
                  }`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Body container */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-3 ${
                      msg.role === "user"
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-white border-slate-200/90 text-slate-800 shadow-sm"
                    }`}>
                      {msg.image && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-slate-250 bg-slate-100 flex justify-start">
                          <img
                            src={`data:${msg.image.mimeType};base64,${msg.image.base64}`}
                            alt="Attached skin lesion preview"
                            className="max-h-52 max-w-72 object-cover rounded-md border border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed text-rtl text-right">
                        {renderMessage(msg.text)}
                      </div>

                      {/* Route marker & document citations if present on model message */}
                      {msg.role === "model" && (
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px]">
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.route && (
                              <div className="flex items-center gap-1.5">
                                {msg.route === "RAG" && (
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-mono flex items-center gap-1">
                                    <Database className="h-3 w-3" /> GALE RAG
                                  </span>
                                )}
                                {msg.route === "Hybrid Fusion" && (
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-mono flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> Hybrid Fusion
                                  </span>
                                )}
                                {msg.route === "Web Search" && (
                                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-mono flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Web Grounded
                                  </span>
                                )}
                              </div>
                            )}

                            {msg.matchedDocs && msg.matchedDocs.length > 0 && (
                              <div className="flex items-center gap-1 text-slate-400 italic">
                                <BookOpen className="h-3 w-3 text-blue-500" />
                                <span>المصدر: {msg.matchedDocs.join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {/* Individual TTS Speaker Controls */}
                          <button
                            type="button"
                            onClick={() => speakMessage(msg.id, msg.text)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all text-[9px] font-medium ${
                              activeSpeakingId === msg.id 
                                ? "bg-red-50 text-red-600 border-red-200 animate-pulse font-semibold"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200"
                            }`}
                            title={activeSpeakingId === msg.id ? "إيقاف القراءة الصوتية" : "استمع للمساعد وهو يقرأ الإجابة"}
                          >
                            {activeSpeakingId === msg.id ? (
                              <>
                                <VolumeX className="h-3.5 w-3.5 text-red-500" />
                                <span>إيقاف القراءة</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                                <span>استمع للإجابة</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 font-mono block px-1 text-rtl">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bot thinking placeholder */}
              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <Bot className="h-4 w-4 text-blue-600 animate-spin" />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    <p className="flex items-center gap-2">
                       الوكيل يفكر الآن وبحدد المصار الأنسب...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Image Preview Panel */}
              {selectedImageBase64 && (
                <div className="flex items-center gap-2.5 p-2 bg-emerald-50/75 rounded-xl border border-emerald-200 w-fit max-w-full animate-fade-in shadow-sm">
                  <div className="relative group shrink-0">
                    <img 
                      src={`data:${selectedImageMimeType};base64,${selectedImageBase64}`} 
                      alt="Condition preview" 
                      className="h-14 w-14 object-cover rounded-md border border-emerald-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageBase64(null);
                        setSelectedImageMimeType(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute -top-1.5 -left-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow transition-all cursor-pointer"
                      title="إزالة الصورة"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px] text-right pr-1">
                    <span className="font-bold block text-emerald-800">صورة الحالة جاهزة للفحص</span>
                    <span className="font-mono text-[8px] text-slate-400">({selectedImageMimeType})</span>
                  </div>
                </div>
              )}

              {/* Image upload validation error display */}
              {imageError && (
                <div className="text-right text-[10px] text-red-500 font-semibold px-3 bg-red-50 py-1.5 rounded-xl border border-red-200 animate-pulse">
                  ⚠️ {imageError}
                </div>
              )}

              {/* Speech recognition error display */}
              {speechError && (
                <div className="text-right text-[11px] text-amber-800 bg-amber-50/90 leading-relaxed p-3 rounded-xl border border-amber-250 animate-fade-in flex items-start gap-2 shadow-sm">
                  <button 
                    type="button" 
                    onClick={() => setSpeechError(null)} 
                    className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-rtl text-right">
                    <strong>تنبيه في الإدخال الصوتي:</strong> {speechError}
                  </span>
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex gap-2 items-center"
              >
                {/* Image Input Section (Files and Camera) */}
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    id="medical-image-upload"
                  />
                  <button
                    type="button"
                    id="medical-image-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                      selectedImageBase64
                        ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-emerald-600 hover:border-emerald-200"
                    }`}
                    title="إرفاق صورة للقرحة أو الجلد المصاب لتحرك التحليل البصري"
                  >
                    <Image className="h-4 w-4" />
                  </button>
                </div>

                {/* Voice Input Section */}
                {isRecognitionSupported && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Speech Language selection toggles */}
                    <button
                      type="button"
                      disabled={isListening}
                      onClick={() => setSpeechLang(speechLang === "ar-SA" ? "en-US" : "ar-SA")}
                      className={`text-[10px] px-2.5 py-3 rounded-xl border font-mono transition-all font-bold ${
                        isListening
                          ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="تبديل لغة الاستماع الصوتي بين العربية والإنجليزية"
                    >
                      {speechLang === "ar-SA" ? "AR" : "EN"}
                    </button>

                    {/* Microphone button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isLoading}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                        isListening
                          ? "bg-red-500 text-white border-red-500 animate-pulse shadow-md shadow-red-500/20"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200"
                      }`}
                      title={isListening ? "إيقاف الاستماع" : "التحدث عبر الميكروفون"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                <input 
                  type="text"
                  placeholder={
                    isListening 
                      ? (speechLang === "ar-SA" ? "🎙️ جاري الاستماع، تحدث الآن..." : "🎙️ Listening, speak now...")
                      : "اسأل عن الأعراض أو أرفق صورة لقشرة أو قرحة الجلد لتحليلها..."
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading || isListening}
                  className={`flex-1 border rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all text-right placeholder:text-slate-400 ${
                    isListening ? "bg-red-50 border-red-300 placeholder:text-red-400 animate-pulse" : "bg-white border-slate-200"
                  }`}
                />
                
                <button
                  type="button"
                  id="medical-chat-send"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={(!inputValue.trim() && !selectedImageBase64) || isLoading || isListening}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl transition-all shadow-md text-white disabled:opacity-30 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {/* Listening status & feedback bar */}
              {isListening && (
                <div className="flex items-center justify-between px-2 text-[10px] text-red-500 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>تحدث بصوت واضح واضغط مجدداً على زر الميكروفون عند انتهائك</span>
                  </div>
                  <div>
                    اللغة: <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded font-bold">{speechLang === "ar-SA" ? "العربية" : "English"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Trace Log Console (Visible on Desktop / Compact layout) */}
          <div className="lg:w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-teal-400 animate-pulse" /> Agent Trace Console
            </h2>
            <div className="flex-1 bg-black/60 rounded-xl p-3 font-mono text-[10px] text-teal-400/90 overflow-y-auto space-y-2 border border-teal-500/10 leading-relaxed max-h-[160px] lg:max-h-none">
              {activeTraces.map((trace, i) => (
                <div key={i} className="text-right text-rtl select-none">
                  {trace}
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-slate-850 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed text-rtl">
              <Info className="h-3.5 w-3.5 inline ml-1 text-amber-500" />
              يتتبع هذا السجل عملية اتخاذ القرار لوكيل الذكاء الاصطناعي بين التحقق من الحقائق الطبية محلياً أو الاستدعاء من الويب.
            </div>
          </div>
        </section>
      </main>

      {/* Empathetic Bottom Disclaimer */}
      <footer className="bg-slate-100 border-t border-slate-200 mt-6 py-4 px-6 text-center text-xs text-slate-500 leading-relaxed">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1 text-rtl">
            <AlertCircle className="h-4 w-4 text-amber-500" /> تنبيه: الإجابات آلية للأغراض التعليمية (مشروع تخرج) ولا تغني عن استشارة الطبيب المختص.
          </p>
          <p className="text-[10px] font-mono text-slate-400">
            Sovereign Med RAG AI © 2026. Academic Research & Capstone Prototype.
          </p>
        </div>
      </footer>

      {/* Mobile Share Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in shadow-2xl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 text-right text-rtl animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <button 
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" /> رابط مشاركة النظام وتجنب أخطاء الصفحات
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              عند فتح هذا المشروع على هاتف آخر أو متصفح خارجي، <strong>تأكد من استخدام الرابط العام المشترك (Public Shared Link)</strong> بدلاً من رابط لوحة تحكم المطورين الخاصة بـ Google AI Studio التي ينفرد حسابك فقط بصلاحية تعديلها وفتحها وتظهر لغيرك فارغة أو بصفحة <span className="bg-red-50 text-red-650 px-1 py-0.5 rounded font-bold font-mono">Page Not Found</span>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 font-mono text-[11px] text-slate-700 break-all select-all flex items-center justify-between gap-1.5 font-semibold text-center">
              <button
                type="button"
                onClick={copyShareLink}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 shrink-0 font-sans cursor-pointer transition-colors"
              >
                {isCopied ? "تم النسخ! ✓" : "نسخ الرابط"}
              </button>
              <span className="text-left font-sans text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap block flex-1 max-w-[240px]">
                https://ais-pre-y7e3l3jjewbeha7ftmmxuu-329205954423.europe-west1.run.app
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-150 rounded-xl p-3.5 text-xs text-blue-800 space-y-1.5 leading-relaxed">
              <p className="font-bold">💡 إرشاد الاستخدام على الهواتف الأخرى:</p>
              <p className="text-[11px] text-slate-600">
                1. انسخ الرابط المشترك أعلاه عبر زر "نسخ الرابط".
              </p>
              <p className="text-[11px] text-slate-600">
                2. أرسله إلى جهازك أو هاتفك الآخر وافتحه في متصفح <strong>Google Chrome</strong> أو سيسير التشغيل بكفاءة.
              </p>
              <p className="text-[11px] text-slate-600">
                3. سيعمل جهاز الفحص والذكاء الاصطناعي المدمج بالكامل دون الحاجة لتسجيل دخول المطورين!
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer border border-slate-250"
              >
                حسناً، فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Elementary formatting function since react-markdown has been requested but
 * manual regex helps format standard bullet points and bold sections easily.
 */
function renderMessage(text: string) {
  const parts = text.split("\n");
  return parts.map((line, blockIndex) => {
    let normalized = line.trim();

    if (!normalized) {
      return <div key={blockIndex} className="h-2" />;
    }

    // Check if header
    if (normalized.startsWith("### ")) {
      return (
        <h3 key={blockIndex} className="text-sm font-bold text-slate-800 mt-3 mb-1 text-right text-rtl">
          {parseBoldParts(normalized.substring(4))}
        </h3>
      );
    }
    if (normalized.startsWith("## ")) {
      return (
        <h2 key={blockIndex} className="text-base font-bold text-slate-800 mt-4 mb-1.5 text-right text-rtl">
          {parseBoldParts(normalized.substring(3))}
        </h2>
      );
    }

    // Check if bullet point
    const isBullet = normalized.startsWith("* ") || normalized.startsWith("- ") || normalized.startsWith("• ");
    if (isBullet) {
      normalized = normalized.replace(/^[\*\-\•]\s+/, "");
    }

    const formatted = parseBoldParts(normalized);

    if (isBullet) {
      return (
        <div key={blockIndex} className="flex items-start justify-start gap-1.5 mt-1 leading-relaxed text-right text-rtl text-slate-700">
          <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
          <span className="flex-1">{formatted}</span>
        </div>
      );
    }

    return (
      <p key={blockIndex} className="mt-1.5 leading-relaxed text-right text-rtl text-slate-700 block">
        {formatted}
      </p>
    );
  });
}

function parseBoldParts(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((chunk, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} className="font-bold text-slate-900 border-b border-transparent">{chunk}</strong>;
    }
    return chunk;
  });
}
