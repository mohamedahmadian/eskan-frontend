import { LogIn, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { AppLogo } from "../../components/brand/AppLogo";
import { AdminFooter } from "../../components/layout/AdminFooter";
import { LocaleSwitcher } from "../../components/layout/LocaleSwitcher";
import { useBrandDisplay } from "../../hooks/useHeadquartersSummary";

const navItems = [
  { to: "/", end: true, labelKey: "landing.nav.home" },
  {
    to: "/participations",
    end: false,
    labelKey: "landing.nav.participations",
  },
  { to: "/about", end: false, labelKey: "landing.nav.about" },
  { to: "/contact", end: false, labelKey: "landing.nav.contact" },
] as const;

function navLinkClass(active: boolean) {
  return `inline-flex min-h-10 items-center rounded-2xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
    active
      ? "bg-teal-50 text-teal-800"
      : "text-ink-600 hover:bg-cream-100 hover:text-teal-800"
  }`;
}

function LandingNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("landing.nav.menu")} className={className}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}

export function LandingShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { title: brandTitle, logoSrc, branding } = useBrandDisplay();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="landing-root flex min-h-svh flex-col bg-cream-50">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-8">
          <Link to="/" className="shrink-0" aria-label={brandTitle}>
            <AppLogo
              src={logoSrc}
              className={
                logoSrc
                  ? "h-11 w-11 shrink-0 rounded-2xl bg-white object-cover shadow-[0_8px_18px_rgba(20,40,40,0.16)] ring-1 ring-teal-100 sm:h-12 sm:w-12"
                  : "h-11 w-auto shrink-0 object-contain sm:h-12"
              }
            />
          </Link>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-nav-menu"
            aria-label={
              menuOpen ? t("landing.nav.close") : t("landing.nav.open")
            }
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
          <LandingNavLinks className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex" />
          <div className="ms-auto flex min-w-0 items-center justify-end gap-4">
            <LocaleSwitcher />
            {user ? (
              <Link
                to="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-teal-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:px-3.5"
              >
                <LogIn className="size-4" aria-hidden />
                <span>{t("landing.goToPanel")}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-teal-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:px-3.5"
              >
                <LogIn className="size-4" aria-hidden />
                <span>{t("landing.login")}</span>
              </Link>
            )}
          </div>
        </div>
        {menuOpen ? (
          <div
            id="landing-nav-menu"
            className="border-t border-line/70 bg-white/95 px-4 py-3 lg:hidden"
          >
            <LandingNavLinks
              onNavigate={() => setMenuOpen(false)}
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 sm:px-4"
            />
          </div>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <AdminFooter branding={branding} />
    </div>
  );
}
