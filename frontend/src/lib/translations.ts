export type Locale = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // ==========================================
  // 1. Navigation & Brand
  // ==========================================
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
    ar: 'مشفر بمفاتيح AES 256 بت للعميل. متوافق مع معايير HIPAA وقانون DPDP لعام 2023.'
  },

  // ==========================================
  // 2. Navbar & Header Controls
  // ==========================================
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

  // ==========================================
  // 3. Clinical Terminology (UAE Healthcare Standard)
  // ==========================================
  thalassemia: {
    en: 'Beta-Thalassemia',
    ar: 'الثلاسيميا بيتا'
  },
  thalassemia_trait: {
    en: 'Beta-Thalassemia Minor (Carrier Trait)',
    ar: 'سمة الثلاسيميا بيتا الصغرى (ناقل للمرض)'
  },
  sickle_cell: {
    en: 'Sickle Cell Disease / Trait',
    ar: 'أنيميا الخلايا المنجلية / السمة المنجلية'
  },
  g6pd_deficiency: {
    en: 'G6PD Deficiency (Favism)',
    ar: 'نقص إنزيم سداسي فوسفات الجلوكوز النازع للهيدروجين (أنيميا الفول)'
  },
  sma: {
    en: 'Spinal Muscular Atrophy (SMA - SMN1)',
    ar: 'الضمور العضلي الشوكي (SMA - SMN1)'
  },
  cystic_fibrosis: {
    en: 'Cystic Fibrosis (CFTR)',
    ar: 'التليف الكيسي (CFTR)'
  },
  autosomal_recessive: {
    en: 'Autosomal Recessive',
    ar: 'وراثة متنحية جسدية'
  },
  autosomal_dominant: {
    en: 'Autosomal Dominant',
    ar: 'وراثة سائدة جسدية'
  },
  x_linked: {
    en: 'X-Linked Recessive',
    ar: 'وراثة متنحية مرتبطة بالجنس X'
  },
  consanguinity: {
    en: 'Consanguinity (Shared Bloodline)',
    ar: 'زواج الأقارب (صلة القرابة)'
  },
  inbreeding_coefficient: {
    en: "Wright's Inbreeding Coefficient (F)",
    ar: 'معامل قرابة الدم لرايت (F)'
  },
  premarital_screening: {
    en: 'UAE National Premarital Screening',
    ar: 'برنامج الفحص الطبي للمقبلين على الزواج بالدولة'
  },
  carrier_status: {
    en: 'Carrier Status',
    ar: 'حالة الناقل للجين'
  },
  carrier_detected: {
    en: 'Carrier Trait Detected',
    ar: 'تم رصد صفة وراثية متنحية (ناقل)'
  },
  non_carrier: {
    en: 'Non-Carrier / Wild Type',
    ar: 'سليم / غير ناقل'
  },
  pgtm_counseling: {
    en: 'PGT-M with IVF Counseling',
    ar: 'الفحص الجيني قبل الزرع مع أطفال الأنابيب PGT-M'
  },
  sanger_confirmation: {
    en: 'Sanger Sequencing Confirmation',
    ar: 'التأكيد بتسلسل سانغر'
  },

  // ==========================================
  // 4. Common Shared UI Labels & Actions
  // ==========================================
  loading: {
    en: 'Loading clinical records...',
    ar: 'جاري تحميل السجلات السريرية...'
  },
  save_changes: {
    en: 'Save Changes',
    ar: 'حفظ التغييرات'
  },
  cancel: {
    en: 'Cancel',
    ar: 'إلغاء'
  },
  delete: {
    en: 'Delete',
    ar: 'حذف'
  },
  edit: {
    en: 'Edit',
    ar: 'تعديل'
  },
  actions: {
    en: 'Actions',
    ar: 'الإجراءات'
  },
  close: {
    en: 'Close',
    ar: 'إغلاق'
  },
  status: {
    en: 'Status',
    ar: 'الحالة'
  },
  active: {
    en: 'Active',
    ar: 'نشط'
  },
  verified: {
    en: 'Verified',
    ar: 'موثق'
  },
  high_priority: {
    en: 'High-Priority',
    ar: 'أولوية قصوى'
  },
  view_all: {
    en: 'View All',
    ar: 'عرض الكل'
  },
  copy: {
    en: 'Copy',
    ar: 'نسخ'
  },
  copied: {
    en: 'Copied!',
    ar: 'تم النسخ!'
  },
  download_pdf: {
    en: 'Download PDF Report',
    ar: 'تحميل تقرير PDF'
  },
  clear: {
    en: 'Clear',
    ar: 'مسح'
  },
  send: {
    en: 'Send',
    ar: 'إرسال'
  },

  // ==========================================
  // 5. Dashboard Screen
  // ==========================================
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
  stat_pedigree_size: {
    en: 'PEDIGREE SIZE',
    ar: 'حجم شجرة النسب'
  },
  stat_members: {
    en: 'Members',
    ar: 'أفراد'
  },
  stat_pedigree_desc: {
    en: '3 generations mapped with both maternal and paternal bloodlines.',
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
  stat_phenotypes_desc: {
    en: 'Documented health traits and monogenic carrier markers across family tree.',
    ar: 'السمات الصحية الموثقة وعلامات النواقل الوراثية عبر شجرة العائلة.'
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
  stat_spousal_desc: {
    en: 'Monogenic concordance analysis for premarital couple compatibility.',
    ar: 'تحليل التوافق الجيني الفردي لفحص ما قبل الزواج.'
  },
  btn_assess_couple: {
    en: 'Assess Compatibility',
    ar: 'تقييم توافق الزوجين'
  },
  dashboard_charts_library: {
    en: 'Family Pedigree Charts Library',
    ar: 'مكتبة مخططات شجرة العائلة والوراثة'
  },
  dashboard_charts_desc: {
    en: 'Manage multiple multi-generational clinical genetic pedigree trees, share links, and patient records.',
    ar: 'إدارة مخططات النسب الجيني متعددة الأجيال، وروابط المشاركة المشفرة، وسجلات المرضى.'
  },
  dashboard_table_id: {
    en: 'Family ID',
    ar: 'رقم العائلة'
  },
  dashboard_table_title: {
    en: 'Chart Title',
    ar: 'عنوان المخطط'
  },
  dashboard_table_proband: {
    en: 'Key Member (Proband)',
    ar: 'الفرد الأساسي (المراجع)'
  },
  dashboard_table_members: {
    en: 'Members',
    ar: 'الأفراد'
  },
  dashboard_table_updated: {
    en: 'Last Updated',
    ar: 'آخر تحديث'
  },
  dashboard_table_share: {
    en: 'Share Status',
    ar: 'حالة المشاركة'
  },
  dashboard_table_actions: {
    en: 'Actions',
    ar: 'الإجراءات'
  },
  dashboard_open_chart: {
    en: 'Open Chart',
    ar: 'فتح المخطط'
  },
  dashboard_lineage_title: {
    en: 'Lineage Pedigree Model',
    ar: 'نموذج مخطط النسب والوراثة'
  },
  dashboard_lineage_subtitle: {
    en: 'Interactive clinical pedigree chart showing family relationships, carriers, and phenotypes.',
    ar: 'مخطط وراثي سريري تفاعلي يوضح العلاقات الأسرية، والنواقل، والأنماط الوراثية.'
  },
  dashboard_studio_link: {
    en: 'Interactive Studio',
    ar: 'المختبر التفاعلي'
  },
  dashboard_open_full_editor: {
    en: 'Open Full Interactive Editor',
    ar: 'فتح المحرر التفاعلي الكامل'
  },
  dashboard_action_directives: {
    en: 'Action Directives',
    ar: 'التوجيهات السريرية الموصى بها'
  },
  dashboard_directives_desc: {
    en: 'Clinically verified health steps personalized to your pedigree and carrier markers.',
    ar: 'خطوات صحية معتمدة سريرياً ومصممة خصيصاً لشجرة عائلتك وعلاماتك الوراثية.'
  },
  directive_gene_panel: {
    en: 'Pre-Marital Gene Panel',
    ar: 'فحص الحزمة الجينية قبل الزواج'
  },
  directive_gene_panel_desc: {
    en: 'Screen for 570 recessive disease genes recommended by the UAE National Protocol.',
    ar: 'فحص 570 جيناً للأمراض المتنحية المعتمدة في البروتوكول الوطني لدولة الإمارات.'
  },
  directive_doctor_consult: {
    en: 'Doctor Video Consultation',
    ar: 'استشارة طبية مرئية مع خبير وراثة'
  },
  directive_doctor_consult_desc: {
    en: 'Speak with a certified clinical genetic counselor about carrier inheritance risks.',
    ar: 'تحدث مع مستشار وراثة سريرية معتمد لمناقشة احتمالات انتقال الجينات للأبناء.'
  },
  directive_btn_schedule: {
    en: 'Schedule Gene Panel',
    ar: 'حجز فحص الجينات'
  },
  directive_btn_book: {
    en: 'Book Video Call',
    ar: 'حجز موعد مرئي'
  },
  directive_confirmed: {
    en: 'Confirmed!',
    ar: 'تم التأكيد!'
  },
  genomic_literacy_title: {
    en: 'Genomic Literacy & Family Health',
    ar: 'الثقافة الجينومية وصحة الأسرة'
  },
  genomic_literacy_heading: {
    en: 'Understanding Shared Family Bloodlines & Hereditary Health',
    ar: 'فهم صلة القرابة الأسرية وانتقال الصفات الوراثية'
  },
  genomic_literacy_body: {
    en: 'In families with shared bloodlines (consanguinity), both parents are more likely to carry identical healthy-carrier genes. Knowing your carrier status allows you to protect future children using modern pre-pregnancy technologies like PGT-M.',
    ar: 'في الأسر التي تجمعها صلة قرابة، تزداد احتمالية حمل كلا الوالدين لنفس الجين المتنحي. إن معرفة حالة الناقل مبكراً تمكنك من حماية أطفال المستقبل باستخدام التقنيات الطبية الحديثة مثل PGT-M.'
  },
  genomic_literacy_summary: {
    en: 'Read 5-min Summary',
    ar: 'قراءة ملخص في 5 دقائق'
  },
  genomic_literacy_options: {
    en: 'Explore Reproductive Options',
    ar: 'استكشاف الحلول الإنجابية المتاحة'
  },

  // ==========================================
  // 6. Ask Care AI Chat & Inquiries
  // ==========================================
  care_ai_title: {
    en: 'Ask Care AI',
    ar: 'اسأل Care AI'
  },
  care_ai_subtitle: {
    en: 'Premarital screening, policy & pedigree intelligence',
    ar: 'ذكاء الفحص قبل الزواج، والسياسات الصحية، ومخطط النسب'
  },
  care_ai_unified_badge: {
    en: 'Unified Care AI',
    ar: 'الذكاء السريري الموحد'
  },
  care_ai_clear_chat: {
    en: 'Clear conversation',
    ar: 'مسح المحادثة'
  },
  care_ai_placeholder: {
    en: 'Ask about your screening results, policy rules, or risks...',
    ar: 'اسأل عن نتائج الفحص الطبي، السياسات الصحية، أو المخاطر الوراثية...'
  },
  care_ai_suggested_inquiries: {
    en: 'SUGGESTED INQUIRIES',
    ar: 'استفسارات مقترحة'
  },
  care_ai_suggested_questions: {
    en: 'Suggested questions:',
    ar: 'أسئلة مقترحة:'
  },
  care_ai_source: {
    en: 'Source:',
    ar: 'المصدر:'
  },
  care_ai_footnote: {
    en: 'Your questions and health data are private, encrypted, and never shared.',
    ar: 'أسئلتك وبياناتك الصحية مشفرة ومحاطة بالسرية التامة ولا تتم مشاركتها أبداً.'
  },
  care_ai_thinking: {
    en: 'Synthesizing with local Qdrant vectors and your health pedigree...',
    ar: 'جاري التحليل باستخدام المتجهات السريرية وشجرة عائلتك...'
  },
  btn_send: {
    en: 'Ask AI',
    ar: 'إرسال السؤال'
  },

  // ==========================================
  // 7. Pedigree Studio Screen (`/pedigree`)
  // ==========================================
  pedigree_studio_title: {
    en: 'Family Pedigree Studio',
    ar: 'مختبر شجرة العائلة والوراثة'
  },
  pedigree_studio_subtitle: {
    en: 'Interactive 3-generation clinical pedigree canvas with consanguinity modeling and carrier notation.',
    ar: 'لوحة تفاعلية لـ 3 أجيال من شجرة العائلة مع نمذجة زواج الأقارب ورموز النواقل الجينية.'
  },
  pedigree_filter_all: {
    en: 'All Generations',
    ar: 'جميع الأجيال'
  },
  pedigree_filter_gen1: {
    en: 'Gen I (Grandparents)',
    ar: 'الجيل الأول (الأجداد)'
  },
  pedigree_filter_gen2: {
    en: 'Gen II (Parents & Aunts/Uncles)',
    ar: 'الجيل الثاني (الوالدان والأعمام/الأخوال)'
  },
  pedigree_filter_gen3: {
    en: 'Gen III (Proband & Siblings)',
    ar: 'الجيل الثالث (المراجع والأشقاء)'
  },
  pedigree_btn_add_member: {
    en: '+ Add Family Member',
    ar: '+ إضافة فرد للعائلة'
  },
  pedigree_btn_manage_trees: {
    en: 'Manage Trees',
    ar: 'إدارة المخططات'
  },
  pedigree_btn_new_tree: {
    en: '+ New Tree',
    ar: '+ مخطط جديد'
  },
  pedigree_btn_delete_tree: {
    en: 'Delete Chart',
    ar: 'حذف المخطط'
  },
  pedigree_canvas_hint: {
    en: 'Click any person to view health details • Drag to move',
    ar: 'انقر على أي شخص لعرض التفاصيل الصحية • اسحب للتحريك'
  },
  pedigree_members_connected: {
    en: 'Members Connected',
    ar: 'أفراد متصلون بالرسم'
  },
  pedigree_selected_member_header: {
    en: 'Selected Family Member',
    ar: 'الفرد المحدد من العائلة'
  },
  pedigree_empty_selection_title: {
    en: 'Family Pedigree Overview Dossier',
    ar: 'ملف المخطط الجيني الشامل للعائلة'
  },
  pedigree_empty_selection_desc: {
    en: 'Select any family member node to inspect clinical markers, carrier traits, or click below to perform immediate actions.',
    ar: 'انقر على أي فرد في المخطط لفحص المؤشرات السريرية والجينات، أو اختر من الإجراءات السريعة أدناه.'
  },
  pedigree_dossier_active_chart: {
    en: 'Active Chart Dossier',
    ar: 'ملف المخطط النشط'
  },
  pedigree_dossier_total_members: {
    en: 'Total Family Nodes',
    ar: 'إجمالي أفراد العائلة'
  },
  pedigree_dossier_generations: {
    en: 'Generations Mapped',
    ar: 'الأجيال الموثقة'
  },
  pedigree_dossier_consanguinity_status: {
    en: 'Consanguinity Union',
    ar: 'زواج أقارب موثق'
  },
  pedigree_dossier_carriers_count: {
    en: 'Identified Carriers',
    ar: 'النواقل المرصودة'
  },
  pedigree_dossier_proband_shortcut: {
    en: 'Select Proband (Self)',
    ar: 'تحديد الفرد الأساسي (المراجع)'
  },
  pedigree_dossier_quick_actions: {
    en: 'Pedigree Quick Actions',
    ar: 'إجراءات المخطط السريعة'
  },
  pedigree_guidance_box_title: {
    en: 'Hereditary Health Guidance',
    ar: 'إرشادات الوراثة وصحة النسل'
  },
  pedigree_guidance_box_text: {
    en: 'When both partners carry an inherited carrier trait (such as Thalassemia or Sickle Cell), there is a 25% chance in each pregnancy that the child may inherit both genes. Pre-marital genetic counseling is recommended.',
    ar: 'عندما يحمل كلا الشريكين سمة وراثية متنحية (مثل الثلاسيميا أو الأنيميا المنجلية)، تبلغ نسبة انتقال المرض للطفل 25% في كل حمل. يوصى بإجراء الاستشارة الوراثية قبل الزواج.'
  },
  pedigree_legend_male: {
    en: 'Male (Square)',
    ar: 'ذكر (مربع)'
  },
  pedigree_legend_female: {
    en: 'Female (Circle)',
    ar: 'أنثى (دائرة)'
  },
  pedigree_legend_carrier: {
    en: 'Carrier (Dot / Half-Fill)',
    ar: 'ناقل للجين (نقطة / نصف ممتلئ)'
  },
  pedigree_legend_affected: {
    en: 'Affected (Solid Fill)',
    ar: 'مصاب بالمرض (ممتلئ بالكامل)'
  },
  pedigree_legend_consanguineous: {
    en: 'Consanguineous Union (Double Line)',
    ar: 'زواج أقارب (خط مزدوج)'
  },

  // ==========================================
  // 8. Risk Analysis Screen (`/risk-analysis`)
  // ==========================================
  risk_analysis_title: {
    en: 'AI Genetic Intelligence',
    ar: 'الذكاء الوراثي الاصطناعي'
  },
  risk_analysis_subtitle: {
    en: 'Clinical Genomic Synthesis aligned with UAE Premarital Guidelines.',
    ar: 'التحليل الجينومي السريري المتوافق مع الإرشادات الوطنية لفحص ما قبل الزواج.'
  },
  risk_metric_analyzed: {
    en: 'Members Analyzed',
    ar: 'أفراد تم تحليلهم'
  },
  risk_metric_generations: {
    en: 'Generations Mapped',
    ar: 'أجيال موثقة'
  },
  risk_metric_loci: {
    en: 'Screened Loci',
    ar: 'مواقع جينية مفحوصة'
  },
  risk_positive_overview_title: {
    en: 'Positive Genomic Overview',
    ar: 'النظرة الجينومية الإيجابية العامة'
  },
  risk_motivational_insight_title: {
    en: 'Empowerment & Clear Pathway',
    ar: 'التمكين الصحي والمسار الإيجابي الواضح'
  },
  risk_vs_diagnosis_title: {
    en: 'Understanding Risk vs. Definite Diagnosis',
    ar: 'الفرق الطبي بين الاحتمالية والتشخيص المؤكد'
  },
  risk_consanguinity_guidance_title: {
    en: 'Consanguinity Guidance & Shared Heritage',
    ar: 'إرشادات زواج الأقارب والوراثة المشتركة'
  },
  risk_innovative_tech_title: {
    en: 'Innovative & Privacy-Preserving Reproductive Technologies',
    ar: 'التقنيات الإنجابية الحديثة لحماية خصوصية العائلة'
  },
  risk_next_steps_title: {
    en: 'Navigating Your Next Possible Steps',
    ar: 'الخطوات القادمة الموصى بها للزوجين'
  },
  risk_child_transmission_title: {
    en: 'Transmission to Newborn Child:',
    ar: 'احتمالية الانتقال للطفل القادم:'
  },
  risk_carrier_guidance_title: {
    en: 'National Carrier Guidance & Reproductive Protection',
    ar: 'الإرشادات الوطنية لحماية النسل والوقاية الوراثية'
  },
  risk_carrier_guidance_body: {
    en: 'Under UAE Ministry of Health & Prevention guidelines, healthy carriers can have completely healthy children through Pre-implantation Genetic Testing (PGT-M) paired with IVF, or confirmation via Sanger gene sequencing before pregnancy.',
    ar: 'وفقاً لإرشادات وزارة الصحة ووقاية المجتمع بدولة الإمارات، يمكن للنواقل إنجاب أطفال أصحاء تماماً عبر الفحص الجيني قبل الزرع (PGT-M) مع أطفال الأنابيب، أو التأكيد عبر تسلسل سانغر الجيني.'
  },
  risk_no_conditions_title: {
    en: 'No Clinical Conditions Documented Yet',
    ar: 'لم يتم توثيق أي أمراض أو صفات جينية حتى الآن'
  },
  risk_no_conditions_desc: {
    en: 'Condition-specific carrier risks and transmission probabilities to future children will be dynamically synthesized once you upload your premarital screening report.',
    ar: 'سيتم تحليل احتمالات انتقال الأمراض للأطفال القادمين فور رفع تقرير الفحص الطبي للمقبلين على الزواج.'
  },

  // ==========================================
  // 9. Couple Assessment Screen (`/couple-assessment`)
  // ==========================================
  couple_assessment_title: {
    en: 'Couple Hereditary Assessment',
    ar: 'تقييم التوافق الوراثي للزوجين'
  },
  couple_assessment_subtitle: {
    en: 'Pre-conception dual-lineage comparative synthesis, autosomal recessive concordance, and reproductive pathway analysis.',
    ar: 'تحليل مقارن للمخطط الوراثي للطرفين، وتوافق الصفات المتنحية، وخيارات الإنجاب السليم.'
  },
  couple_partner_a: {
    en: 'Partner A (Proband)',
    ar: 'الطرف الأول (المراجع الأساسي)'
  },
  couple_partner_b: {
    en: 'Partner B (Spouse / Candidate)',
    ar: 'الطرف الثاني (الشريك / المرشح)'
  },
  couple_synthesis_core: {
    en: 'Couple Genetic Synthesis Core',
    ar: 'مركز التوافق والتحليل المشترك للزوجين'
  },
  couple_concordance_risk: {
    en: 'Recessive Concordance Risk',
    ar: 'خطر توافق الجينات المتنحية'
  },
  couple_inbreeding_coeff: {
    en: "Wright's Inbreeding Coefficient",
    ar: 'معامل قرابة الدم لرايت'
  },
  couple_reproductive_options: {
    en: 'Reproductive Options & Recommendations',
    ar: 'الخيارات الإنجابية والتوصيات الطبية'
  },
  couple_counselor_chat_title: {
    en: 'AI Couple Counselor Messenger',
    ar: 'مستشار التوافق الوراثي الذكي للزوجين'
  },
  couple_counselor_welcome: {
    en: 'Hello! I am Care AI, your certified genetic counselor. Ask me anything about your couple compatibility assessment, variant concordance, or reproductive options (such as PGT-M with IVF). What would you like to explore today?',
    ar: 'مرحباً بك! أنا المستشار الوراثي الذكي Care AI. يسعدني الإجابة على أي استفسار يخص توافق الزوجين، الجينات المتطابقة، أو الخيارات الإنجابية مثل PGT-M مع أطفال الأنابيب. كيف أساعدكما اليوم؟'
  },

  // ==========================================
  // 10. Privacy & Security Screen (`/privacy-security`)
  // ==========================================
  privacy_center_title: {
    en: 'Privacy & Security Center',
    ar: 'مركز الخصوصية والأمان الجينومي'
  },
  privacy_center_subtitle: {
    en: 'Data Sovereignty, Granular Lineage Sharing & Cryptographic Access Controls. You retain absolute mathematical ownership of all diploid sequencing and pedigree nodes.',
    ar: 'سيادة البيانات الجينية، ومشاركة المخططات المشفرة، والتحكم بالأذونات. تحتفظ بالملكية الرياضية والسرية المطلقة لبياناتك.'
  },
  privacy_zk_active: {
    en: 'End-To-End Zero Knowledge Active',
    ar: 'التشفير التام بتقنية المعرفة الصفرية نشط'
  },
  privacy_secure_enclave: {
    en: 'Pedigree Node #994-Alpha • Secure Enclave',
    ar: 'العقدة الجينية #994-Alpha • بيئة عزل سحابية آمنة'
  },
  privacy_hipaa_dpdp: {
    en: 'HIPAA § 164.312 & DPDP Act 2023 Compliant',
    ar: 'متوافق مع معايير HIPAA وقانون DPDP لعام 2023'
  },
  privacy_hipaa_desc: {
    en: 'Zero public indexing, client-side zero-knowledge encrypted hardware vault.',
    ar: 'خزينة مشفرة لدى العميل بدون فهرسة عامة، مع عزل تام للبيانات.'
  },
  privacy_sudo_card_title: {
    en: 'Sudo / De-Identification Shield',
    ar: 'درع الاسم المستعار وإخفاء الهوية'
  },
  privacy_sudo_card_desc: {
    en: 'When Sudo Mode is enabled, patient real names, birth dates, and contact coordinates are automatically replaced with cryptographically pseudorandom identifiers (e.g. Silent-Falcon-9214) across all pedigree charts and export screens.',
    ar: 'عند تفعيل وضع الخصوصية، يتم استبدال الأسماء الحقيقية وتواريخ الميلاد تلقائياً بهويات مستعارة مشفرة عشوائياً (مثل Silent-Falcon-9214) في جميع الشاشات والتقارير المصدرة.'
  },
  privacy_sudo_action_label: {
    en: 'Anonymize Display Coordinates',
    ar: 'إخفاء بيانات الهوية من الشاشات'
  },
  privacy_sudo_action_sub: {
    en: 'Mask proband identity during clinical consultations and family chart shares.',
    ar: 'حجب هوية المراجع أثناء الاستشارات الطبية ومشاركة شجرة العائلة.'
  },
  privacy_btn_enable_sudo: {
    en: 'Enable Sudo Shield',
    ar: 'تفعيل درع الخصوصية'
  },
  privacy_btn_disable_sudo: {
    en: 'Disable Sudo Shield',
    ar: 'إلغاء درع الخصوصية'
  },
  privacy_aes_card_title: {
    en: '256-bit AES Vault Key Rotation',
    ar: 'تدوير مفاتيح التشفير AES-256 بت'
  },
  privacy_aes_card_desc: {
    en: 'Client keys are derived using PBKDF2 with 600,000 iterations. The server never receives the master plaintext key, preventing subpoena-based disclosure.',
    ar: 'تُشتق مفاتيح العميل باستخدام PBKDF2 بـ 600,000 دورة. الخادم لا يتلقى المفتاح الصريح أبداً، مما يضمن أماناً مطلقاً.'
  },
  privacy_aes_fingerprint: {
    en: 'Key fingerprint:',
    ar: 'بصمة المفتاح المشفر:'
  },
  privacy_btn_rotate_keys: {
    en: 'Rotate Vault Keys',
    ar: 'تدوير مفاتيح الخزينة'
  },
  privacy_keys_rotated_success: {
    en: 'Client-side encryption key successfully rotated and re-salted.',
    ar: 'تم تدوير مفتاح التشفير بنجاح وإعادة تشفير البيانات محلياً.'
  },
  privacy_compliance_title: {
    en: 'Regulatory Compliance & Verification Matrix',
    ar: 'مصفوفة الامتثال للوائح والسياسات الصحية'
  },
  privacy_audit_log_title: {
    en: 'Real-Time Cryptographic Access & Audit Trail',
    ar: 'سجل التدقيق والتتبع المشفر في الوقت الفعلي'
  },
  privacy_audit_event_1: {
    en: 'Patient Pedigree Tree Read Access Authenticated',
    ar: 'تم توثيق قراءة مخطط شجرة العائلة للمريض'
  },
  privacy_audit_event_2: {
    en: 'AES-256 Vault Session Key Salting Executed',
    ar: 'تم تنفيذ تشفير مفتاح جلسة الخزينة AES-256'
  },
  privacy_audit_event_3: {
    en: 'Zero-Knowledge Sudo Anonymization Mask Applied',
    ar: 'تم تطبيق قناع الاسم المستعار بالمعرفة الصفرية'
  },
  privacy_audit_signature: {
    en: 'Signature Hash:',
    ar: 'توقيع التحقق المشفر:'
  },

  // ==========================================
  // 11. Profile Screen (`/profile`)
  // ==========================================
  profile_title: {
    en: 'Patient Profile & Screening Records',
    ar: 'ملف المريض وسجلات الفحص الوراثي'
  },
  profile_subtitle: {
    en: 'Manage your verified clinical demographics, zero-knowledge pseudonym coordinates, and parsed premarital screening lab members.',
    ar: 'إدارة بياناتك الديموغرافية الموثقة، والاسم المستعار المشفر، وسجلات الفحص الطبي للمقبلين على الزواج.'
  },
  profile_card_demographics: {
    en: 'Patient Demographics',
    ar: 'البيانات الشخصية للمريض'
  },
  profile_full_name: {
    en: 'Full Legal Name',
    ar: 'الاسم القانوني الكامل'
  },
  profile_sudo_alias: {
    en: 'Sudo Cryptographic Alias',
    ar: 'الاسم المستعار المشفر'
  },
  profile_email: {
    en: 'Email Address (Encrypted)',
    ar: 'البريد الإلكتروني (مشفر)'
  },
  profile_dob: {
    en: 'Date of Birth',
    ar: 'تاريخ الميلاد'
  },
  profile_blood_type: {
    en: 'Blood Group / Type',
    ar: 'فصيلة الدم'
  },
  profile_btn_save: {
    en: 'Save Clinical Profile',
    ar: 'حفظ الملف السريري'
  },
  profile_saved_toast: {
    en: 'Clinical profile successfully updated and encrypted!',
    ar: 'تم تحديث الملف السريري وتشفيره بنجاح!'
  },
  profile_reports_title: {
    en: 'Associated Premarital / Genetic Screening Reports',
    ar: 'تقارير الفحص الطبي وفحص الجينات المرتبطة'
  },
  profile_reports_desc: {
    en: 'Lab reports parsed by the local Clinical OCR & PyMuPDF extractor into pedigree member nodes.',
    ar: 'التقارير المخبرية المستخرجة محلياً عبر محرك OCR وPyMuPDF والمربوطة بشجرة العائلة.'
  },
  profile_table_patient: {
    en: 'Patient / Sudo',
    ar: 'المريض / الاسم المستعار'
  },
  profile_table_panel: {
    en: 'Panel & Lab File',
    ar: 'الحزمة الجينية والملف'
  },
  profile_table_condition: {
    en: 'Monogenic Condition',
    ar: 'الحالة الوراثية'
  },
  profile_table_variant: {
    en: 'Carrier Status & Variant',
    ar: 'حالة الناقل والمتغير الجيني'
  },
  profile_table_date: {
    en: 'Upload Date',
    ar: 'تاريخ الرفع'
  },
  profile_no_reports_title: {
    en: 'No Screening Reports Uploaded Yet',
    ar: 'لا توجد تقارير فحص طبي مرفوعة حتى الآن'
  },
  profile_no_reports_desc: {
    en: 'Upload your premarital screening PDF or blood test image to automatically extract clinical variants.',
    ar: 'قم برفع تقرير الفحص قبل الزواج بصيغة PDF أو صورة تحليل الدم لاستخراج المتغيرات الجينية تلقائياً.'
  },
  profile_btn_delete_member: {
    en: 'Delete Record',
    ar: 'حذف السجل'
  },
  profile_delete_modal_title: {
    en: 'Delete Associated Screening Report',
    ar: 'حذف تقرير الفحص المرتبط'
  },
  profile_delete_modal_warning: {
    en: 'This action will permanently remove this report, its extracted genomic variants, and unpin any linked pedigree member.',
    ar: 'سيؤدي هذا الإجراء إلى حذف هذا التقرير والمتغيرات الجينية نهائياً وإلغاء ربطه بشجرة العائلة.'
  },

  // ==========================================
  // 12. Settings & Air-Gap Modal
  // ==========================================
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
