export interface MedicalDoc {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  definition: string;
  description: string;
  causes: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prognosis: string;
  tags: string[];
}

export const medicalKB: MedicalDoc[] = [
  {
    id: "diabetes_symptoms",
    titleEn: "Diabetes Mellitus Symptoms",
    titleAr: "أعراض داء السكري",
    category: "Endocrine Disorders",
    definition: "Diabetes mellitus is a chronic metabolic disorder characterized by high blood glucose levels (hyperglycemia) due to absolute or relative deficiency of insulin.",
    description: "In healthy individuals, insulin regulates glucose utilization. In diabetes, this mechanism fails. Type I is caused by insulin deficiency (destruction of beta cells), while Type II is characterized by insulin resistance.",
    causes: "Heredity, genetics, physical inactivity, obesity, poor diet, and autoimmune destruction of pancreatic beta cells (for Type I).",
    symptoms: "The classic symptoms include increased urination (polyuria / كثرة التبول), excessive thirst (polydipsia / العطش الشديد), increased hunger (polyphagia), unexplained weight loss, extreme fatigue, blurry vision, and slow healing of cuts or sores.",
    diagnosis: "Fasting plasma glucose (FPG) test of 126 mg/dL or higher, Oral glucose tolerance test (OGTT) of 200 mg/dL or higher, or casual plasma glucose of 200 mg/dL or higher with symptoms.",
    treatment: "Type I is treated with daily insulin replacement. Type II is managed with diet, regular exercise, weight loss, and oral medications (e.g., Metformin, Sulfonylureas) or insulin.",
    prognosis: "Uncontrolled diabetes leads to chronic complications in the eyes, kidneys, nerves, heart, and blood vessels. With careful glucose management, patients lead active, long lives.",
    tags: ["diabetes", "symptoms", "sugar", "glucose", "insulin", "كثرة التبول", "العطش الشديد", "أعراض السكر", "السكري"]
  },
  {
    id: "common_cold",
    titleEn: "Common Cold Treatment",
    titleAr: "علاج نزلات البرد",
    category: "Respiratory Infections",
    definition: "The common cold is a mild, self-limiting viral infection of the upper respiratory tract, affecting the nose, throat, and sinuses.",
    description: "It is one of the most frequent infectious diseases in humans, usually harmless and lasting about a week. It causes inflammation of the upper airways.",
    causes: "Caused primarily by Rhinoviruses (over 100 strains), Adenoviruses, Coronaviruses, or Respiratory syncytial virus (RSV). It spreads via airborne droplets or direct contact.",
    symptoms: "Runny or stuffy nose, sore throat, sneezing, mild headache, cough, low-grade fever, and general body fatigue.",
    diagnosis: "Diagnosed based on the classic physical symptoms. Diagnostic testing or laboratory cultures are rarely necessary unless complications (like pneumonia) are suspected.",
    treatment: "Treatment is strictly supportive: rest, high fluid intake, cool-mist humidifiers, over-the-counter pain/fever reducers like paracetamol (Acetaminophen) or ibuprofen. Avoid giving aspirin to children due to Reye's syndrome risk. Antibiotics are completely useless unless a secondary bacterial infection develops.",
    prognosis: "Excellent. Most patients recover fully in 7 to 10 days, though coughs can persist for up to two weeks.",
    tags: ["cold", "flu", "cough", "sneezing", "treatment", "البرد", "نزلة برد", "الإنفلونزا", "علاج البرد", "الكحة", "السعال"]
  },
  {
    id: "heart_health",
    titleEn: "Heart Health & Cardiovascular Maintenance",
    titleAr: "الحفاظ على صحة القلب",
    category: "Cardiology & Prevention",
    definition: "Guidelines and lifestyle matches designed to prevent coronary artery disease, atherosclerosis, and myocardial infarction (heart attack).",
    description: "Sustaining a strong heart is achieved by preventing arterial plaque compilation (atherosclerosis) and maintaining low blood pressure and balanced cholesterol.",
    causes: "Heart disease risk factors include high blood pressure, high LDL cholesterol, cigarette smoking, physical inactivity, obesity, and diabetes.",
    symptoms: "A healthy heart shows no symptoms. Failing heart signs include chest pain (angina pectoris), shortness of breath, rapid or irregular heartbeat (arrhythmia), and swelling of lower legs.",
    diagnosis: "Evaluated using blood pressure checks, lipid profiles (cholesterol), Electrocardiogram (ECG), Stress tests, and Echocardiography.",
    treatment: "Prevention is key: Eat a low-saturated-fat, high-fiber diet (fruits, vegetables, whole grains). Engage in regular aerobic exercise (30 mins at least 4 times per week). Stop smoking completely. Control blood pressure under 120/80 mmHg. Maintain healthy weight.",
    prognosis: "An active heart-healthy lifestyle significantly slows down or even reverses early stages of atherosclerosis, reducing the risk of heart failure and death.",
    tags: ["heart", "cardiac", "cholesterol", "prevention", "angina", "صحة القلب", "القلب الشرياني", "الجلطة", "صلابة الشرايين"]
  },
  {
    id: "stress_causes",
    titleEn: "Stress and Acute Anxiety Causes",
    titleAr: "أسباب القلق والتوتر",
    category: "Psychiatry & Neurology",
    definition: "Stress is a physiological and psychological response to perceived threats, activating the autonomic nervous system's 'fight-or-flight' mechanism.",
    description: "When stressed, the brain triggers a cascade of stress hormones (adrenaline, cortisol), accelerating heart rate, breathing, and muscle tension to prepare for action.",
    causes: "Triggered by psychological conflicts (unresolved emotions, symbolization), environmental stressors (loud noises, busy schedules), traumatic events (grief, accidents), or underlying hormonal imbalances (e.g., hyperthyroidism).",
    symptoms: "Headaches, dizziness, rapid breathing, muscle tightness (especially neck/shoulders), insomnia, irritability, digestive issues, and a constant feeling of doom.",
    diagnosis: "Clinical evaluation, patient history, and screening scales (e.g., Hamilton Anxiety Scale). A physical exam rules out thyroid issues or blood sugar anomalies.",
    treatment: "Relaxation therapies (yoga, meditation, breath training), cognitive-behavioral therapy (CBT), social support, sleep hygiene, limit caffeine intake, and in severe cases, anxiolytics (like Benzodiazepines) under supervision.",
    prognosis: "Excellent when managed proactively. Untreated chronic stress can progress to chronic anxiety disorders, clinical depression, or cardiovascular issues.",
    tags: ["stress", "anxiety", "tension", "causes", "psychiatry", "التوتر", "أسباب التوتر", "القلق", "الضغط النفسي", "الخوف"]
  },
  {
    id: "acetaminophen",
    titleEn: "Acetaminophen",
    titleAr: "الباراسيتامول / الأسيتامينوفين",
    category: "Pharmacology (Analgesics)",
    definition: "Acetaminophen (also known as paracetamol or APAP) is an over-the-counter non-opiate medicine used to relieve mild-to-moderate pain and reduce fever.",
    description: "Sold under various brand names including Tylenol and Panadol. Unlike aspirin or ibuprofen, it does not possess anti-inflammatory properties, making it gentler on the stomach.",
    causes: "Indicated for headaches, muscle aches, backaches, toothaches, common cold aches, and minor arthritis pain.",
    symptoms: "Pain or fever requiring relief.",
    diagnosis: "Patient-reported pain or measured elevated core body temperature.",
    treatment: "Standard dosage: 325-650 mg every 4-6 hours as needed. Crucial safety warning: **NEVER exceed 4 grams (4000 mg) in a 24-hour period** to prevent irreversible liver damage.",
    prognosis: "Highly effective transient pain reliever. Overdose is extremely toxic to the liver and requires immediate emergency medical care (antidote: N-acetylcysteine).",
    tags: ["acetaminophen", "paracetamol", "panadol", "tylenol", "pain", "fever", "علاج الألم", "مسكن الآلام", "خافض حرارة", "دواء"]
  },
  {
    id: "asthma",
    titleEn: "Asthma",
    titleAr: "مرض الربو",
    category: "Pulmonology",
    definition: "Asthma is a chronic inflammatory disease of the respiratory airways characterized by bronchial hyper-responsiveness and temporary airway narrowing.",
    description: "During an attack, bronchial smooth muscles contract, mucosal linings swell, and excessive thick mucus is secreted. This partially blocks the airway, making exhalation difficult.",
    causes: "Inhalation of allergens (house dust mites, animal dander, pollen, mold), tobacco smoke, cold air, intense physical exercise, or emotional anxiety.",
    symptoms: "Wheezing (سعال صفيري), shortness of breath, chronic dry coughing, and a distinct feeling of chest tightness or constriction.",
    diagnosis: "Spirometry tests (measuring exhalation volume before and after bronchodilator use) and chest x-rays to rule out other respiratory failures.",
    treatment: "Inhaled bronchodilators (Beta-agonists like Albuterol/Ventolin) for immediate rescue, and inhaled corticosteroids (e.g., Beclomethasone) for long-term daily control of inflammation.",
    prognosis: "Incurable but highly manageable. Most asthmatic individuals lead fully active lives by strictly avoiding triggers and adhering to personal action plans.",
    tags: ["asthma", "bronchi", "wheezing", "rescue", "inhaler", "الربو", "حساسية الصدر", "ضيق النفس", "بخاخة الربو", "الكحة الصفيرية"]
  },
  {
    id: "allergies",
    titleEn: "Allergies",
    titleAr: "الحساسية العامة",
    category: "Immunology",
    definition: "Allergies are abnormal, hypersensitive reactions of the immune system in response to otherwise harmless environmental substances (allergens).",
    description: "Upon exposure to an allergen, B-lymphocytes produce IgE antibodies. These bind to mast cells, triggering a massive release of histamine and inflammatory chemicals.",
    causes: "Environmental antigens (pollen, dust mites, mold, animal dander), specific foods (nuts, milk, eggs, shellfish), drug allergens (penicillin), or insect venoms.",
    symptoms: "Runny nose, sneezing, itchy/watery eyes (allergic rhinitis), hives (urticaria), eczema, respiratory wheezing, and in extreme cases, fatal anaphylaxis.",
    diagnosis: "Diagnosed using skin prick tests (observing a classic wheel-and-flare reaction) or blood tests measuring allergen-specific IgE levels (RAST).",
    treatment: "Complete avoidance of identified triggers, second-generation antihistamines (e.g., Claritin, Allegra) to block histamine receptors, nasal corticosteroid sprays, or emergency epinephrine (EpiPen) for anaphylaxis.",
    prognosis: "Excellent with diligent management. Avoidance and prompt antihistamine treatment prevent minor symptoms from escalating into respiratory blocks.",
    tags: ["allergies", "histamine", "antihistamine", "epipen", "hives", "الحساسية", "أعراض الحساسية", "مضادات الهيستامين"]
  },
  {
    id: "acne",
    titleEn: "Acne Vulgaris",
    titleAr: "حب الشباب",
    category: "Dermatology",
    definition: "Acne is a common inflammatory skin disease of the sebaceous follicles, characterized by comedones, papules, pustules, and potential scarring.",
    description: "It primarily affects teenagers during puberty due to increased androgenic hormones, causing overproduction of sebum (skin oil) which clogs skin pores.",
    causes: "Excess sebum secretion, buildup of sticky dead skin cells, and infection by the skin bacterium Propionibacterium acnes.",
    symptoms: "Whiteheads, blackheads, red inflamed pimples (papules / pustules), and deep painful cysts, primarily on the face, chest, shoulders, and back.",
    diagnosis: "Visual inspection by a dermatologist to grade the severity (mild, moderate, or severe).",
    treatment: "Mild acne is treated with topical benzoyl peroxide, salicylic acid, or tretinoin (Retin-A). Moderate acne adds topical or oral antibiotics (like tetracycline). Severe cystic acne is treated with oral isotretinoin (Accutane - highly effective but causes birth defects).",
    prognosis: "Highly controllable. Most cases resolve after adolescence, though severe untreated cystic acne can leave permanent physical and psychological scars.",
    tags: ["acne", "pimples", "sebum", "skin", "tretinoin", "accutane", "حب الشباب", "البثور", "علاج البشرة", "الحبوب"]
  },
  {
    id: "anemias",
    titleEn: "Anemias",
    titleAr: "فقر الدم / الأنيميا",
    category: "Hematology",
    definition: "Anemia is a pathological condition characterized by abnormally low levels of healthy red blood cells (RBCs) or hemoglobin, restricting oxygen delivery to the body's tissues.",
    description: "Hemoglobin carries oxygen. When depleted, organs suffer from mild oxygen starvation. Major types include Iron Deficiency, Folic Acid Deficiency, Vitamin B12 (Pernicious) anemia, and Sickle Cell anemia.",
    causes: "Nutritional deficiencies (poor intake of iron, folate, B12), chronic blood loss (ulcers, heavy menstruation), or hereditary genetic defects (Thalassemia, Sickle Cell).",
    symptoms: "Dizziness (الدوخة), pale skin or creases, constant fatigue (التعب المستمر), rapid shallow breathing, cold extremities, and headaches.",
    diagnosis: "Complete Blood Count (CBC) showing low hematocrit and hemoglobin, followed by morphological inspections of RBC size and shape.",
    treatment: "Iron supplements with Vitamin C (enhances absorption), folic acid tablets, B12 injections for pernicious anemia, or treating underlying blood loss causes.",
    prognosis: "Nutritional anemias resolve fully within 3-6 weeks of proper dietary correction or supplementation. Genetic forms require lifelong management.",
    tags: ["anemia", "hemoglobin", "fatigue", "iron", "blood", "الأنيما", "فقر الدم", "التعب", "الدوخة", "نقص الحديد"]
  },
  {
    id: "addisons_disease",
    titleEn: "Addison's Disease",
    titleAr: "مرض أديسون",
    category: "Endocrine Disorders",
    definition: "Addison's disease is an uncommon chronic disorder resulting from progressive destruction or atrophy of the adrenal cortex, leading to adrenal hormone deficiency.",
    description: "It results in severely decreased production of cortisol (essential for life, regulating metabolism) and aldosterone (which regulates water/salt balance).",
    causes: "Autoimmune destruction of the adrenal cortex (70% of cases), tuberculosis infection (20% of cases), or fungal infections.",
    symptoms: "Chronic fatigue, loss of energy, loss of appetite, dark hyperpigmentation of the skin (bronzing), low blood pressure, weight loss, and diarrhea.",
    diagnosis: "Demonstrating low cortisol levels that fail to rise after an injection of corticotropin (ACTH test).",
    treatment: "Lifelong hormonal replacement therapy: taking oral hydrocortisone (for cortisol) and fludrocortisone (for aldosterone). Patients must double their hydrocortisone dose during periods of infection, injury, or stress.",
    prognosis: "Excellent with proper hormone compliance. Patients enjoy a normal lifespan. Without treatment, they face a fatal adrenal crisis (Addisonian crisis).",
    tags: ["addison", "cortisol", "adrenal", "hormone", "أديسون", "مرض أديسون", "قصور الغدة الكظرية"]
  }
];
