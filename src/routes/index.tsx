import { createFileRoute } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Heart, Users, BookOpen, Calendar, MessageCircle, Shield, GraduationCap, Brain } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سند — منصة دعم الأطفال ذوي الاحتياجات الخاصة" },
      { name: "description", content: "منصة سند تربط أولياء الأمور والأخصائيين النفسيين والمعلمين لمتابعة شاملة للأطفال ذوي الاحتياجات الخاصة." },
      { property: "og:title", content: "سند — SANAD" },
      { property: "og:description", content: "منصة متكاملة لمتابعة وتطوير الأطفال ذوي الاحتياجات الخاصة." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();

  const features = [
    { icon: Users, key: "للأسر", desc: "متابعة كاملة لتطور طفلك مع أخصائيين ومعلمين" },
    { icon: Brain, key: "للأخصائيين", desc: "إدارة الملفات الرقمية والتشخيصات والخطط الفردية" },
    { icon: GraduationCap, key: "للمعلمين", desc: "تسجيل الحضور، النقاط، الواجبات والملاحظات السلوكية" },
    { icon: Shield, key: "للإدارة", desc: "إحصائيات شاملة وإدارة المستخدمين والمحتوى الرقمي" },
  ];

  const highlights = [
    { icon: Heart, title: "تشخيص شامل", text: "طبي، نفسي، تربوي مع تقارير دورية" },
    { icon: BookOpen, title: "خطة فردية", text: "أهداف قصيرة وطويلة المدى لكل طفل" },
    { icon: Calendar, title: "مواعيد ذكية", text: "حجز وتنظيم مواعيد المتابعة بسهولة" },
    { icon: MessageCircle, title: "تواصل مباشر", text: "بين ولي الأمر والأخصائي والمعلم" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-10 w-10" />
            <span className="text-xl font-bold text-gradient">{t("app.name")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
              {lang === "ar" ? "EN" : "عربي"}
            </Button>
            {user ? (
              <Button asChild className="gradient-primary border-0">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth" search={{ mode: "signin" }}>{t("nav.login")}</Link>
                </Button>
                <Button asChild className="gradient-primary border-0 shadow-soft">
                  <Link to="/auth" search={{ mode: "signup" }}>{t("nav.signup")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-soft opacity-50" />
        <div className="container relative mx-auto px-4 py-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="h-4 w-4" />
            معاً نبني مستقبلاً أفضل لأطفالنا
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-7xl">
            منصة <span className="text-gradient">سند</span>
            <br />
            <span className="text-3xl font-bold text-muted-foreground md:text-4xl">
              لدعم الأطفال ذوي الاحتياجات الخاصة
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            منصة رقمية متكاملة تربط بين أولياء الأمور، الأخصائيين النفسيين، والمعلمين
            لتوفير متابعة شاملة وتطوير مستمر لكل طفل.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary border-0 shadow-elegant text-base">
              <Link to="/auth" search={{ mode: "signup" }}>ابدأ مجاناً</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <a href="#features">تعرّف على المنصة</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Audience cards */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold">واجهات متخصصة لكل دور</h2>
          <p className="text-muted-foreground">كل مستخدم يحصل على الأدوات التي يحتاجها بالضبط</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="gradient-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-soft">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{f.key}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold">ما الذي يميز سند؟</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-bold">{h.title}</h3>
              <p className="text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="gradient-hero relative overflow-hidden rounded-3xl p-12 text-center shadow-elegant">
          <h2 className="mb-4 text-4xl font-bold text-primary-foreground">انضم إلى منصة سند اليوم</h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            ابدأ رحلة دعم وتطوير طفلك مع فريق متكامل من المختصين
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base">
            <Link to="/auth" search={{ mode: "signup" }}>أنشئ حسابك الآن</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t("app.name")} — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
