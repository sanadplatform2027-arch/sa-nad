import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "ar" | "en";

const dict = {
  ar: {
    "app.name": "سند",
    "app.tagline": "منصة دعم الأطفال ذوي الاحتياجات الخاصة",
    "nav.home": "الرئيسية",
    "nav.features": "المميزات",
    "nav.about": "عن المنصة",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "إنشاء حساب",
    "nav.dashboard": "لوحة التحكم",
    "nav.logout": "تسجيل الخروج",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.fullName": "الاسم الكامل",
    "auth.phone": "رقم الهاتف",
    "auth.role": "نوع الحساب",
    "auth.haveAccount": "لديك حساب؟ سجّل الدخول",
    "auth.noAccount": "ليس لديك حساب؟ أنشئ حساباً",
    "auth.continueGoogle": "المتابعة باستخدام Google",
    "role.parent": "ولي أمر",
    "role.specialist": "أخصائي نفسي",
    "role.teacher": "معلم",
    "role.admin": "إدارة",
    "parent.home": "الرئيسية",
    "parent.children": "أطفالي",
    "parent.diagnosis": "التشخيص والتقارير",
    "parent.progress": "متابعة التقدم",
    "parent.attendance": "الحضور والغياب",
    "parent.assignments": "الواجبات والأنشطة",
    "parent.appointments": "المواعيد",
    "parent.messages": "الرسائل والإشعارات",
    "common.loading": "جاري التحميل...",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.add": "إضافة",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.search": "بحث",
    "common.viewAll": "عرض الكل",
    "common.noData": "لا توجد بيانات بعد",
    "common.welcome": "أهلاً بك",
    "landing.badge": "معاً نبني مستقبلاً أفضل لأطفالنا",
    "landing.h1a": "منصة",
    "landing.h1b": "سند",
    "landing.h1sub": "لدعم الأطفال ذوي الاحتياجات الخاصة",
    "landing.lead": "منصة رقمية متكاملة تربط بين أولياء الأمور، الأخصائيين النفسيين، والمعلمين لتوفير متابعة شاملة وتطوير مستمر لكل طفل.",
    "landing.ctaStart": "ابدأ مجاناً",
    "landing.ctaLearn": "تعرّف على المنصة",
    "landing.rolesTitle": "واجهات متخصصة لكل دور",
    "landing.rolesSub": "كل مستخدم يحصل على الأدوات التي يحتاجها بالضبط",
    "landing.f1": "للأسر",
    "landing.f1d": "متابعة كاملة لتطور طفلك مع أخصائيين ومعلمين",
    "landing.f2": "للأخصائيين",
    "landing.f2d": "إدارة الملفات الرقمية والتشخيصات والخطط الفردية",
    "landing.f3": "للمعلمين",
    "landing.f3d": "تسجيل الحضور، النقاط، الواجبات والملاحظات السلوكية",
    "landing.f4": "للإدارة",
    "landing.f4d": "إحصائيات شاملة وإدارة المستخدمين والمحتوى الرقمي",
    "landing.whyTitle": "ما الذي يميز سند؟",
    "landing.h1t": "تشخيص شامل",
    "landing.h1x": "طبي، نفسي، تربوي مع تقارير دورية",
    "landing.h2t": "خطة فردية",
    "landing.h2x": "أهداف قصيرة وطويلة المدى لكل طفل",
    "landing.h3t": "مواعيد ذكية",
    "landing.h3x": "حجز وتنظيم مواعيد المتابعة بسهولة",
    "landing.h4t": "تواصل مباشر",
    "landing.h4x": "بين ولي الأمر والأخصائي والمعلم",
    "landing.ctaTitle": "انضم إلى منصة سند اليوم",
    "landing.ctaText": "ابدأ رحلة دعم وتطوير طفلك مع فريق متكامل من المختصين",
    "landing.ctaBtn": "أنشئ حسابك الآن",
    "landing.rights": "جميع الحقوق محفوظة",
  },
  en: {
    "app.name": "SANAD",
    "app.tagline": "Support platform for children with special needs",
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.about": "About",
    "nav.login": "Sign in",
    "nav.signup": "Sign up",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Sign out",
    "auth.signin": "Sign in",
    "auth.signup": "Create account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full name",
    "auth.phone": "Phone",
    "auth.role": "Account type",
    "auth.haveAccount": "Already have an account? Sign in",
    "auth.noAccount": "Don't have an account? Sign up",
    "auth.continueGoogle": "Continue with Google",
    "role.parent": "Parent",
    "role.specialist": "Psychologist",
    "role.teacher": "Teacher",
    "role.admin": "Admin",
    "parent.home": "Home",
    "parent.children": "My children",
    "parent.diagnosis": "Diagnosis & reports",
    "parent.progress": "Progress",
    "parent.attendance": "Attendance",
    "parent.assignments": "Assignments",
    "parent.appointments": "Appointments",
    "parent.messages": "Messages",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.search": "Search",
    "common.viewAll": "View all",
    "common.noData": "No data yet",
    "common.welcome": "Welcome",
    "landing.badge": "Together we build a better future for our children",
    "landing.h1a": "The",
    "landing.h1b": "SANAD",
    "landing.h1sub": "platform for children with special needs",
    "landing.lead": "An integrated digital platform connecting parents, psychologists and teachers for comprehensive follow-up and continuous development for every child.",
    "landing.ctaStart": "Start for free",
    "landing.ctaLearn": "Explore the platform",
    "landing.rolesTitle": "A dedicated experience for every role",
    "landing.rolesSub": "Each user gets exactly the tools they need",
    "landing.f1": "For families",
    "landing.f1d": "Full follow-up of your child's progress with specialists and teachers",
    "landing.f2": "For specialists",
    "landing.f2d": "Manage digital files, diagnoses and individual education plans",
    "landing.f3": "For teachers",
    "landing.f3d": "Track attendance, grades, assignments and behavior notes",
    "landing.f4": "For administration",
    "landing.f4d": "Full statistics and management of users and digital content",
    "landing.whyTitle": "What makes SANAD different?",
    "landing.h1t": "Comprehensive assessment",
    "landing.h1x": "Medical, psychological and educational with regular reports",
    "landing.h2t": "Individual plan",
    "landing.h2x": "Short and long term goals for each child",
    "landing.h3t": "Smart appointments",
    "landing.h3x": "Book and organize follow-up sessions easily",
    "landing.h4t": "Direct communication",
    "landing.h4x": "Between parent, specialist and teacher",
    "landing.ctaTitle": "Join SANAD today",
    "landing.ctaText": "Start your child's support and development journey with a full team of experts",
    "landing.ctaBtn": "Create your account",
    "landing.rights": "All rights reserved",
  },
} as const;

type Key = keyof (typeof dict)["ar"];

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("sanad.lang") as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("sanad.lang", l);
  };

  const t = (k: Key) => dict[lang][k] ?? k;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}