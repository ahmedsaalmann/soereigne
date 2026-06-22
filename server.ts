import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { matchMedicalKB } from "./src/utils/kbMatcher";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Standard Express Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Gemini SDK with User-Agent for Telemetry
// Handle missing API Key gracefully to prevent server crashing on cold starts
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is missing.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Get Medical Knowledge Base Entries Endpoint (for browsing the index in UI)
app.get("/api/kb", (req, res) => {
  try {
    const { medicalKB } = require("./src/data/medical_kb");
    res.json({ status: "success", count: medicalKB.length, data: medicalKB });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 2. Chat Endpoint with Agent Decision-Making, Local RAG, and Web Search Grounding
app.post("/api/chat", async (req, res) => {
  const traces: string[] = [];
  try {
    const { message, history, base64Image, mimeType } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message parameter is required." });
    }

    traces.push("🔍 Step 1: Parsing user incoming query...");
    if (base64Image && mimeType) {
      traces.push("📸 Step 1.5: Detected medical picture attachment. Activating computer vision pipeline!");
    }
    traces.push(`💬 User asked: "${message}"`);

    const cleanedMsg = message.trim().toLowerCase();
    const ArabicGreetings = ["اهلا", "مرحبا", "السلام", "سلام", "صباح", "مساء", "تصبح", "أهلا", "مرحباً", "اهلاً"];
    const EnglishGreetings = ["hi", "hello", "hey", "greetings", "good morning", "good evening", "howdy"];
    
    const isArabicGreeting = ArabicGreetings.some(greet => cleanedMsg.includes(greet));
    const isEnglishGreeting = EnglishGreetings.some(greet => cleanedMsg.includes(greet));

    if (isArabicGreeting || isEnglishGreeting) {
      traces.push("👋 Greeting detected! Responding with an instant friendly medical welcome.");
      const reply = isArabicGreeting 
        ? `أهلاً ومرحباً بك في **Sovereign Medical RAG AI**! 🩺✨ 
كيف يمكنني مساعدتك طبياً اليوم؟ 

يمكنك طرح أي استفسار طبي بخصوص الأمراض، الأعراض، أو الأدوية، وسأقوم بتحليلها فوراً من خلال الأرشيف الطبي والمراجع المعتمدة المتاحة لدي.`
        : `Hello webpage visitor! Welcome to **Sovereign Medical RAG AI** 🩺✨.
How can I assist you with your medical or health inquiries today? Feel free to ask any question about symptoms, treatments, or medicines!`;

      return res.json({
        text: reply,
        route: "RAG",
        traces,
        matchedDocs: [],
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      traces.push("❌ Error: Gemini API key is missing on the server.");
      return res.json({
        text: "🚨 نظام الذكاء الاصطناعي تحتاج مفتاح API للتشغيل. يرجى تهيئة GEMINI_API_KEY في Secrets أولاً.\n\n*(Missing GEMINI_API_KEY in the workspace. Please set it under Settings > Secrets.)*",
        route: "System Fault",
        traces,
        matchedDocs: [],
      });
    }

    // Match against local GALE Encyclopedia KB
    traces.push("🗂️ Step 2: Querying local GALE Medicine Encyclopedia...");
    const kbMatches = matchMedicalKB(message);
    
    let mainMatch = kbMatches[0] || null;
    let route: "RAG" | "Web Search" | "Hybrid Fusion" = "Web Search";
    let contextString = "";
    const matchedDocs: string[] = [];

    if (mainMatch && mainMatch.score >= 0.20) {
      route = "RAG";
      contextString = `
[CONTEXT SOURCE: GALE ENCYCLOPEDIA OF MEDICINE]
Title: ${mainMatch.doc.titleEn} (${mainMatch.doc.titleAr})
Category: ${mainMatch.doc.category}
Definition: ${mainMatch.doc.definition}
Description: ${mainMatch.doc.description}
Causes: ${mainMatch.doc.causes}
Symptoms: ${mainMatch.doc.symptoms}
Diagnosis: ${mainMatch.doc.diagnosis}
Treatment: ${mainMatch.doc.treatment}
Prognosis: ${mainMatch.doc.prognosis}
`;
      matchedDocs.push(`${mainMatch.doc.titleAr} (${mainMatch.doc.titleEn})`);
      traces.push(`✅ Found high-confidence match in GALE Database: "${mainMatch.doc.titleEn}" (Score: ${mainMatch.score.toFixed(2)})`);
      traces.push("🧬 Route Decision: Local RAG (GALE Encyclopedia verified context preferred).");
    } else if (mainMatch && mainMatch.score >= 0.08) {
      route = "Hybrid Fusion";
      contextString = `
[CONTEXT SOURCE: GALE ENCYCLOPEDIA OF MEDICINE]
Title: ${mainMatch.doc.titleEn} (${mainMatch.doc.titleAr})
Category: ${mainMatch.doc.category}
Definition: ${mainMatch.doc.definition}
Symptoms: ${mainMatch.doc.symptoms}
`;
      matchedDocs.push(`${mainMatch.doc.titleAr} (${mainMatch.doc.titleEn})`);
      traces.push(`⚠️ Found baseline GALE match: "${mainMatch.doc.titleEn}" (Score: ${mainMatch.score.toFixed(2)}). Query might need real-time data.`);
      traces.push("🧬 Route Decision: Hybrid Fusion (Combining GALE database retrieval with real-time Web Search Grounding!).");
    } else {
      route = "Web Search";
      traces.push("❌ No matches found in local medical database.");
      traces.push("🧬 Route Decision: Direct Web Search Grounding (Escalating to online clinical resources).");
    }

    // Set dynamic system instructions
    let visualGuideline = "";
    if (base64Image && mimeType) {
      visualGuideline = `
=== CLINICAL VISUAL ANALYSIS RULE ===
The user has attached an image of a medical lesion, ulcer, rash, or skin condition.
1. Carefully examine and analyze the visual traits in the image (e.g. coloration, borders, asymmetry, size, lesion texture).
2. Synthesize your visual analysis along with the user's textual query to formulate an accurate and comprehensive differential diagnosis.
3. Explicitly state that visual analysis is an advanced clinical aid, yet cannot replace gold-standard diagnostics (such as biopsy, physical palpation, or dermoscopy) performed in-person by a direct medical specialist.
`;
    }

    const systemInstruction = `
You are the "Sovereign Medical RAG AI", serving as an advanced graduation capstone project.
Your primary directive is to provide highly structured, organized, and clinically accurate medical answers.

DEFAULT LANGUAGE RULE: 
- ALWAYS answer in clear, professional Arabic (العربية) as the default language.
- Keep important medical terms, drug brands, and scientific classifications highlighted in English alongside their Arabic translation (e.g. "الغدة الكظرية (Adrenal Gland)", "الباراسيتامول (Acetaminophen)").
- ONLY answer fully in English if the user explicitly asks you to speak or write in English (e.g., "كلمني إنجليزي", "speak in English", "respond in English").

Current Route Active: [${route}]

${contextString ? `=== PRIVATE GALE MEDICINE BOOK CONTEXT ===\n${contextString}\n=========================================\n\nINSTRUCTION: Synthesize the above GALE Encyclopedia data into your response. Highlight verified GALE textbook facts and cite 'موسوعة جيل الطبية' (GALE Encyclopedia of Medicine) as the source.` : "INSTRUCTION: You do not have verified private book context for this specific query. Use Google Search Grounding to find reliable medical resources."}

${visualGuideline}

Provide answers structure with clear, human-understandable sections (e.g., Definition / التعريف, Symptoms / الأعراض, Diagnosis / التشخيص, Treatment / العلاج). Always maintain a professional, empathetic clinical tone. Always include a disclaimer at the end advising personal consult with a licensed physician.
`;

    traces.push("🧠 Step 3: Preparing dynamic system prompt...");
    
    // Format conversation history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      });
    }

    // Append current message (with potential high-fidelity image clinical representation)
    const userParts: any[] = [{ text: message }];
    if (base64Image && mimeType) {
      userParts.unshift({
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      });
      traces.push("🖼️ Multimodal Activation: Attached real-time image of the lesion/disease for visual clinical assessment.");
    }

    contents.push({
      role: "user",
      parts: userParts
    });

    try {
      traces.push("⚡ Step 4: Dispatching query to Gemini model...");
      
      // Choose model and optionally configure search grounding
      const model = "gemini-3.5-flash";
      const tools: any[] = [];
      if (route === "Web Search" || route === "Hybrid Fusion") {
        tools.push({ googleSearch: {} });
        traces.push("🌐 Dynamic Grounding: Injecting real-time Google Search engine...");
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            temperature: 0.25, // Lower temperature to prevent hallucination in medical capping
          }
        });
      } catch (firstTryError: any) {
        if (tools.length > 0) {
          console.warn("⚠️ First try with Google Search failed, retrying without tools:", firstTryError.message);
          traces.push(`⚠️ Web search grounding is restricted or quota exceeded: ${firstTryError.message || "RESOURCE_EXHAUSTED"}`);
          traces.push("🔄 Retrying generation using Gemini parametric neural library (without Google Search)...");
          
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.25,
            }
          });
        } else {
          throw firstTryError;
        }
      }

      traces.push("✨ Step 5: Answer synthesized successfully.");
      res.json({
        text: response.text || "No response received.",
        route,
        traces,
        matchedDocs,
      });

    } catch (apiError: any) {
      const errMsg = apiError.message || apiError.toString() || "";
      console.warn("⚠️ Gemini API limit or error hit. Triggering local backup engine:", errMsg);
      
      const isQuotaExceeded = errMsg.includes("RESOURCE_EXHAUSTED") || 
                              errMsg.includes("429") || 
                              errMsg.includes("quota") || 
                              errMsg.includes("limit") || 
                              errMsg.includes("exceeded");

      if (isQuotaExceeded) {
        traces.push("⚠️ Google API Quota/Rate-Limit exceeded (RESOURCE_EXHAUSTED / 429).");
      } else {
        traces.push(`⚠️ Gemini API error detected: ${errMsg}`);
      }
      traces.push("🛡️ Activating Autonomic Standalone Backup Engine (GALE Database Engine)...");
      
      let fallbackText = "";
      if (mainMatch) {
         fallbackText = `💡 **[وضع قاعدة البيانات المحلية المستقلة - الأرشيف الطبي المعتمد]**

تم جلب البيانات التالية مباشرة من **موسوعة جيل الطبية (GALE Encyclopedia of Medicine)** للتحقق العلمي الكامل وتجاوز ضغط خادم الويب:

### 📋 ${mainMatch.doc.titleAr} (${mainMatch.doc.titleEn})
* **التصنيف:** ${mainMatch.doc.category}

---

### 🔍 التعريف (Definition)
${mainMatch.doc.definition}

---

### 📝 الوصف السريري (Description)
${mainMatch.doc.description}

---

### ⚠️ الأسباب (Causes)
${mainMatch.doc.causes}

---

### 🌡️ الأعراض الشائعة (Symptoms)
${mainMatch.doc.symptoms}

---

### 🔬 التشخيص الطبي (Diagnosis)
${mainMatch.doc.diagnosis}

---

### 💊 بروتوكول العلاج (Treatment)
${mainMatch.doc.treatment}

---

### 📈 التوقعات الطبية (Prognosis)
${mainMatch.doc.prognosis}

---

⚠️ *تنبيه طبي: هذه المعلومات مستخرجة بدقة من الموسوعات الطبية المعتمدة لأغراض أكاديمية وتعليمية، ولا تغني مطلقاً عن استشارة طبيبك المعالج أو الحصول على رعاية طبية طارئة مخصصة.*`;
      } else {
         if (isQuotaExceeded) {
            fallbackText = `⚠️ **[تنبيه: تم تجاوز حصة الاستخدام لمفتاح الذكاء الاصطناعي - Quota Limit Exceeded]**

لقد تجاوز مفتاح **Gemini API** حالياً الحصة المجانية المتاحة للمطورين أو حِصص معدل الاستخدام المسموح بها في الدقيقة (RESOURCE_EXHAUSTED / 429).

**💡 كيف يمكنك حل هذه المشكلة والاستمتاع بالمستشار الذكي بالكامل؟**
1. **الانتظار لفترة وجيزة (دقيقة أو دقيقتين):** تقوم خوادم Google بإعادة تعيين عدد الطلبات في الدقيقة تلقائياً بعد فترة قصيرة جداً، لذا يمكنك المحاولة مرة أخرى الآن!
2. **التحقق من مفتاح الـ API:** نوصي بالتأكد من تهيئة مفتاح API صالح وشغال في حسابك بـ Google AI Studio لضمان عدم توقف الخدمة.

---

**🗂️ الأرشيف الطبي المدمج ما زال يعمل بالكامل!**
لتسهيل استخدام المنصة بشكل مستقل الآن وبدون الحاجة لـ إنترنت أو استهلاك لمخزون الـ API، يمكنك تصفح وعرض معلومات أي موضوع طبي متكامل في **موسوعة جيل الطبية الكبرى** عبر **القائمة الجانبية اليمنى (Gale Medicine Index)** بضغطة زر واحدة!

*المواضيع الطبية الممتازة المتوفرة بالموسوعة وبدون استهلاك للحصة:*
* **أعراض وعلاج داء السكري**
* **علاج نزلات البرد والزكام**
* **طرق الحفاظ على صحة وسلامة القلب**
* **أسباب وعلاج القلق والتوتر النفسي**
* **إرشادات دواء الباراسيتامول (أدول / بنادول)**`;
         } else {
            fallbackText = `💡 **[وحدة المساعد الطبي المستقلة]**

نعتذر، نظام الجدولة يشتكي حالياً من ضغط في حصة مفتاح الذكاء الاصطناعي (API Quota Limit). في الوقت الراهن، تم تفعيل وضع التشغيل التعويضي المستقل.

الرجاء اختيار أحد المواضيع الطبية الجاهزة والمعتمدة من **القائمة الجانبية اليمنى (Gale Medicine Index)** لعرض معلومات سريرية كاملة وموثوقة مستخرجة من أمهات الكتب الطبية بضغطة زر واحدة.

*مواضيع ممتازة متوفرة وحاضرة الآن:*
* **أعراض وعلاج داء السكري**
* **علاج نزلات البرد والزكام**
* **طرق الحفاظ على صحة وسلامة القلب**
* **أسباب وعلاج القلق والتوتر النفسي**
* **إرشادات دواء الباراسيتامول (أدول / بنادول)**`;
         }
      }

      traces.push("✨ Step 5: Answer synthesized immediately from local fallback registry.");
      res.json({
        text: fallbackText,
        route: mainMatch ? "RAG" : "Web Search",
        traces,
        matchedDocs,
      });
    }

  } catch (err: any) {
    console.error("Express /api/chat error:", err);
    traces.push(`🔴 API Failure: ${err.message}`);
    res.status(500).json({
      error: "An internal server error occurred.",
      message: err.message,
      traces,
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Standard Medical Server running at http://localhost:${PORT}`);
  });
}

startServer();
