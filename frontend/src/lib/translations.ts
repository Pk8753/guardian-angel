export type Locale = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation & Brand
  brand_title: {
    en: 'GuardianAngel',
    ar: 'جاردين أنجل'
  },
  brand_subtitle: {
    en: 'Hereditary Intelligence',
    ar: 'ذكاء الوراثة السريرية'
  },
  engine_title: {
    en: 'Clinical Pedigree Engine',
    ar: 'محرك المخطط الجيني السريري'
  },
  engine_sub: {
    en: 'v4.2 Certified Node • GCP Enclave',
    ar: 'عقدة معتمدة v4.2 • بيئة سحابية آمنة'
  },
  nav_dashboard: {
    en: 'Home Dashboard',
    ar: 'لوحة التحكم الرئيسية'
  },
  nav_pedigree: {
    en: 'Family Pedigree',
    ar: 'شجرة العائلة والوراثة'
  },
  nav_risk: {
    en: 'AI Genetic Intelligence',
    ar: 'الذكاء الوراثي الاصطناعي'
  },
  nav_couple: {
    en: 'Couple Assessment',
    ar: 'تقييم التوافق الوراثي للزوجين'
  },
  nav_privacy: {
    en: 'Privacy & Security',
    ar: 'مركز الخصوصية والأمان'
  },
  nav_profile: {
    en: 'Patient Profile & Details',
    ar: 'ملف المريض والتفاصيل'
  },
  genomic_privacy: {
    en: 'Genomic Privacy',
    ar: 'الخصوصية الجينومية'
  },
  vault_title: {
    en: 'Zero-Knowledge Hardware Vault',
    ar: 'خزينة مشفرة بتقنية المعرفة الصفرية'
  },
  vault_desc: {
    en: 'Encrypted with 256-bit AES client keys. HIPAA & DPDP Act 2023 certified.',
    ar: 'مشفر بمفاتيح AES 256 بت للعميل. متوافق مع معايير HIPAA وDPDP.'
  },

  // Navbar
  search_placeholder: {
    en: 'Search bio-markers, pedigree IDs, family members...',
    ar: 'البحث عن المؤشرات الحيوية، وأرقام المخططات، وأفراد الأسرة...'
  },
  privacy_off: {
    en: 'Privacy: OFF',
    ar: 'الخصوصية: إيقاف'
  },
  privacy_on: {
    en: 'Privacy: ON',
    ar: 'الخصوصية: تفعيل'
  },
  privacy_label: {
    en: 'Privacy:',
    ar: 'الخصوصية:'
  },
  masked: {
    en: '(Masked)',
    ar: '(مخفي)'
  },
  pro_member: {
    en: 'Pro Member • Online',
    ar: 'عضو متميز • متصل'
  },
  sudo_pseudonym: {
    en: '🎭 Sudo Pseudonym',
    ar: '🎭 اسم مستعار محمي'
  },
  sudo_alias: {
    en: 'Sudo Alias:',
    ar: 'الاسم المستعار:'
  },
  enable_privacy: {
    en: 'Enable Privacy Mode',
    ar: 'تفعيل وضع الخصوصية'
  },
  disable_privacy: {
    en: 'Disable Privacy Mode',
    ar: 'إلغاء وضع الخصوصية'
  },
  clinical_profile: {
    en: 'Clinical Profile & Keys',
    ar: 'الملف السريري والمفاتيح'
  },
  sign_out: {
    en: 'Sign Out',
    ar: 'تسجيل الخروج'
  },
  switch_dark: {
    en: 'Switch to Dark Mode',
    ar: 'التبديل إلى الوضع الداكن'
  },
  switch_light: {
    en: 'Switch to Light Mode',
    ar: 'التبديل إلى الوضع الفاتح'
  },

  // Dashboard
  clinical_node_active: {
    en: 'CLINICAL NODE: ACTIVE',
    ar: 'العقدة السريرية: نشطة'
  },
  locus_indexed: {
    en: 'Locus 11p15.4 Indexed',
    ar: 'الموقع الجيني 11p15.4 مفهرس'
  },
  good_morning: {
    en: 'Good Morning',
    ar: 'صباح الخير'
  },
  hero_desc_prefix: {
    en: 'Your family health journey starts with understanding. Your records show',
    ar: 'تبدأ رحلة صحة عائلتك بالفهم السليم. تشير سجلاتك إلى'
  },
  hero_desc_highlight: {
    en: '92% complete details',
    ar: 'اكتمال البيانات بنسبة 92%'
  },
  hero_desc_suffix: {
    en: 'across 3 mapped generations of your family.',
    ar: 'عبر 3 أجيال موثقة من عائلتك.'
  },
  btn_create_pedigree: {
    en: 'Create Family Pedigree',
    ar: 'إنشاء شجرة عائلة جديدة'
  },
  btn_view_pedigree: {
    en: 'View Pedigree Charts',
    ar: 'عرض مخططات النسب'
  },
  btn_upload_screening_report: {
    en: 'Upload Screening Report',
    ar: 'رفع تقرير الفحص الجيني'
  },
  priority_diagnostic: {
    en: 'PRIORITY DIAGNOSTIC',
    ar: 'تشخيص ذو أولوية'
  },
  carrier_scan_rec: {
    en: 'Carrier Scan Recommended',
    ar: 'يوصى بفحص النواقل الجينية'
  },
  autosomal_recessive: {
    en: 'Autosomal Recessive',
    ar: 'وراثة متنحية جسدية'
  },
  stat_pedigree_size: {
    en: 'PEDIGREE SIZE',
    ar: 'حجم شجرة النسب'
  },
  stat_members: {
    en: 'Members',
    ar: 'أفراد'
  },
  stat_pedigree_desc: {
    en: '3 generations mapped with both mother and father sides.',
    ar: 'تم تخطيط 3 أجيال من جهتي الأم والأب.'
  },
  btn_view_canvas: {
    en: 'View Pedigree Canvas',
    ar: 'عرض لوحة المخطط'
  },
  stat_phenotypes: {
    en: 'PHENOTYPES',
    ar: 'الأنماط الظاهرية'
  },
  stat_reported: {
    en: 'Reported',
    ar: 'مسجل'
  },
  btn_update_history: {
    en: 'Update History',
    ar: 'تحديث السجل'
  },
  stat_ai_surveillance: {
    en: 'AI SURVEILLANCE',
    ar: 'المراقبة بالذكاء الاصطناعي'
  },
  stat_high_priority: {
    en: 'High-Priority',
    ar: 'أولوية عالية'
  },
  stat_ai_desc: {
    en: 'Key health risks detected that could pass down to children.',
    ar: 'تم رصد مخاطر صحية رئيسية قد تنتقل إلى الأبناء.'
  },
  btn_review_intel: {
    en: 'Review Intelligence',
    ar: 'مراجعة التقارير الذكية'
  },
  stat_spousal_harmony: {
    en: 'SPOUSAL HARMONY',
    ar: 'التوافق الجيني للزوجين'
  },
  btn_assess_couple: {
    en: 'Assess Compatibility',
    ar: 'تقييم توافق الزوجين'
  },
  ask_genwell_title: {
    en: 'GuardianAngel AI Genetic Assistant',
    ar: 'المساعد الوراثي الذكي GuardianAngel'
  },
  ask_genwell_desc: {
    en: 'Ask questions about hereditary traits, consanguinity risks, or clinical recommendations.',
    ar: 'اطرح استفسارات حول الصفات الوراثية، مخاطر زواج الأقارب، أو التوصيات السريرية.'
  },
  ask_input_placeholder: {
    en: 'Type a hereditary health question (e.g. Can G6PD trait pass down?)...',
    ar: 'اكتب سؤالاً وراثياً (مثال: هل تنتقل صفة نقص خميرة G6PD للأبناء؟)...'
  },
  btn_send: {
    en: 'Ask AI',
    ar: 'إرسال السؤال'
  },
  settings_title: {
    en: 'Settings and connections',
    ar: 'الإعدادات والاتصالات'
  },
  settings_subtitle: {
    en: 'Air-Gap AI Engine (Qwen3 + BGE-M3 + Qdrant) & Health Policy Ingestion',
    ar: 'محرك الذكاء الاصطناعي المنعزل وسياسات الصحة الوطنية'
  },
  settings_btn: {
    en: 'Settings',
    ar: 'الإعدادات'
  },
  policy_upload_title: {
    en: 'Upload Nationwide Health Policy & Guidelines',
    ar: 'رفع وثائق السياسة الصحية الوطنية والإرشادات'
  },
  policy_upload_desc: {
    en: 'Upload screening center rules, eligibility criteria, and protocols (PDF/Image) to embed into Qdrant vector DB.',
    ar: 'قم برفع وثائق مراكز الفحص ومعايير الأهلية لتحويلها إلى متجهات وتخزينها في قاعدة بيانات Qdrant.'
  }
};

export function t(key: string, locale: Locale = 'en'): string {
  const item = translations[key];
  if (!item) return key;
  return item[locale] || item.en || key;
}

