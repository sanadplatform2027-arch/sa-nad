import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu, X, Baby, Brain, GraduationCap, ShieldCheck } from "lucide-react";
import { useState, type ReactNode, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface AppShellProps {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
}

/** مساحات الأدوار المتاحة للإدارة للتنقل بينها */
const AREA_LINKS: NavItem[] = [
  { to: "/admin", label: "الإدارة", icon: ShieldCheck },
  { to: "/specialist", label: "الأخصائي", icon: Brain },
  { to: "/teacher", label: "المعلم", icon: GraduationCap },
  { to: "/parent", label: "ولي الأمر", icon: Baby },
];

export function AppShell({ title, subtitle, nav, children }: AppShellProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  const initials = (profile?.full_name ?? "؟").split(" ").map((p) => p[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo className="h-9 w-9" />
          <span className="font-bold text-gradient">سند</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-30 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          "rtl:right-0 ltr:left-0",
          open ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full lg:rtl:translate-x-0 lg:ltr:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <BrandLogo className="h-11 w-11" />
          <div>
            <div className="font-bold text-sidebar-primary">سند</div>
            <div className="text-xs text-sidebar-foreground/60">{subtitle}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {role === "admin" && (
            <div className="mb-4">
              <div className="mb-2 px-1 text-xs font-medium text-sidebar-foreground/60">
                التبديل بين الواجهات
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AREA_LINKS.map((area) => (
                  <Link
                    key={area.to}
                    to={area.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition",
                      location.pathname.startsWith(area.to)
                        ? "bg-sidebar-primary/20 text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <area.icon className="h-4 w-4 shrink-0" />
                    {area.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{profile?.full_name ?? "—"}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{title}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleSignOut}>
            <LogOut className="me-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:rtl:mr-72 lg:ltr:ml-72">
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}