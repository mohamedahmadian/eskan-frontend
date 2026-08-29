import {
  Boxes,
  HandHeart,
  LogOut,
  Menu,
  PackageOpen,
  Search,
  Snowflake,
  UsersRound,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api, getImageUrl } from "../../lib/api";
import { getNavIcon } from "../../lib/icons";
import { formatNumber } from "../../lib/datetime";
import { displayExternalUrl, toExternalHref } from "../../lib/social-links";
import { isSidebarMenuActive } from "../../lib/nav-path";
import { useHeadquartersSummary } from "../../hooks/useHeadquartersSummary";
import { PageBreadcrumb } from "./PageBreadcrumb";
import {
  canAccessMyAccommodations,
  canAccessMyCaravans,
  canAccessMyGroups,
  canAccessMyReservations,
  isAccommodationManager,
  isAdmin,
  isCaravanManager,
  isPilgrim,
} from "../../lib/roles";
import type {
  NavMenu,
  NavModule,
  Paginated,
  ReservationListItem,
} from "../../types/app";
import { AppLogo } from "../brand/AppLogo";
import { PageTransition } from "../ui/PageTransition";
import { AdminFooter } from "./AdminFooter";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { isQuickToolsFabVisible, QuickToolsProvider } from "./QuickTools";
import { UserMenu } from "./UserMenu";

type SidebarNavMenu = NavMenu & { label?: string };

const menuSections: Record<
  string,
  { titleKey: string; icon?: typeof Snowflake; codes: string[] }[]
> = {
  caravans: [
    {
      titleKey: "menus.groupsSection",
      icon: UsersRound,
      codes: ["groups.mine"],
    },
    {
      titleKey: "menus.supportRequestsSection",
      icon: HandHeart,
      codes: ["caravans.support-requests", "caravans.support-request-report"],
    },
  ],
  logistics: [
    {
      titleKey: "menus.loanItemsSection",
      icon: PackageOpen,
      codes: ["logistics.loans", "logistics.loan-report", "logistics.my-loans"],
    },
    {
      titleKey: "menus.quotaItemsSection",
      icon: Boxes,
      codes: [
        "logistics.item-quotas",
        "logistics.issue-voucher",
        "logistics.vouchers",
        "logistics.voucher-report",
        "logistics.my-vouchers",
      ],
    },
    {
      titleKey: "menus.iceVouchersSection",
      icon: Snowflake,
      codes: [
        "logistics.ice-vouchers",
        "logistics.ice-voucher-report",
        "logistics.my-ice-vouchers",
        "logistics.settings",
      ],
    },
  ],
};

function pickReservationPerYear(items: ReservationListItem[]) {
  const byYear = new Map<number, ReservationListItem>();
  for (const item of items) {
    const prev = byYear.get(item.year);
    if (!prev || item.updatedAt > prev.updatedAt) {
      byYear.set(item.year, item);
    }
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

function insertAfterMenu(
  menus: SidebarNavMenu[],
  afterCode: string,
  extra: SidebarNavMenu[],
): SidebarNavMenu[] {
  if (!extra.length) return menus;
  const index = menus.findIndex((item) => item.code === afterCode);
  if (index < 0) return [...menus, ...extra];
  return [...menus.slice(0, index + 1), ...extra, ...menus.slice(index + 1)];
}

function withAccommodationsDirectoryMenu(mod: NavModule): NavModule {
  if (mod.code !== "accommodation") return mod;
  const hasList = mod.menus.some(
    (item) => item.path === "/accommodations" || item.code === "accommodation.list",
  );
  if (hasList) return mod;
  const extra: SidebarNavMenu = {
    code: "accommodation.list",
    nameKey: "menus.accommodations",
    path: "/accommodations",
    icon: "building-2",
    sortOrder: 0,
  };
  return { ...mod, menus: [extra, ...mod.menus] };
}

function isLogisticsModule(mod: NavModule) {
  return mod.code === "logistics" || mod.nameKey === "modules.logistics";
}

function isHeadquartersModule(mod: NavModule) {
  return mod.code === "headquarters" || mod.nameKey === "modules.headquarters";
}

function isHeadquartersInfoMenu(item: SidebarNavMenu) {
  return (
    item.code === "headquarters.info" ||
    item.path === "/headquarters/info" ||
    item.nameKey === "menus.headquartersInfo"
  );
}

function hidesLogisticsModule(
  user: { roles?: { code: string }[] } | null | undefined,
) {
  return (
    !isAdmin(user) &&
    (isPilgrim(user) || isCaravanManager(user) || isAccommodationManager(user))
  );
}

function filterSidebarModules(
  modules: NavModule[],
  user: { roles?: { code: string }[] } | null | undefined,
): NavModule[] {
  const hideLogistics = hidesLogisticsModule(user);
  const pilgrimHqOnly = isPilgrim(user) && !isAdmin(user);
  if (!hideLogistics && !pilgrimHqOnly) return modules;
  return modules
    .filter((mod) => !(hideLogistics && isLogisticsModule(mod)))
    .map((mod) => {
      if (!pilgrimHqOnly || !isHeadquartersModule(mod)) return mod;
      return { ...mod, menus: mod.menus.filter(isHeadquartersInfoMenu) };
    })
    .filter((mod) => mod.menus.length > 0);
}

function splitMenus(mod: NavModule) {
  const sections = menuSections[mod.code] ?? [];
  const groupedCodes = new Set(sections.flatMap((section) => section.codes));
  return {
    ungrouped: mod.menus.filter((item) => !groupedCodes.has(item.code)),
    sections: sections
      .map((section) => ({
        ...section,
        items: section.codes
          .map((code) => mod.menus.find((item) => item.code === code))
          .filter((item): item is NavMenu => Boolean(item)),
      }))
      .filter((section) => section.items.length > 0),
  };
}

function menuMatchesSearch(
  mod: NavModule,
  item: SidebarNavMenu,
  needle: string,
  label: (key: string) => string,
) {
  if (item.label?.includes(needle)) return true;
  if (
    label(item.nameKey).includes(needle) ||
    label(mod.nameKey).includes(needle)
  ) {
    return true;
  }
  return (menuSections[mod.code] ?? []).some(
    (section) =>
      section.codes.includes(item.code) &&
      label(section.titleKey).includes(needle),
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const location = useLocation();
  const navigate = useNavigate();
  const showQuickToolsFab = isQuickToolsFabVisible(location.pathname, user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const menuSearchRef = useRef<HTMLInputElement>(null);
  const menuSearchHintId = "sidebar-menu-search-hint";
  const brandingQuery = useHeadquartersSummary();
  const branding = brandingQuery.data;
  const pilgrim = isPilgrim(user);
  const brandTitle = pilgrim
    ? t("nav.pilgrimPanel")
    : branding?.title?.trim() || branding?.name?.trim() || t("nav.panel");
  const brandWebsite = branding?.website?.trim() || "";
  const brandLogoSrc = branding?.logoId
    ? getImageUrl(branding.logoId)
    : undefined;

  const focusMenuSearch = useCallback(() => {
    setOpen(true);
    const input = menuSearchRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  useEffect(() => {
    if (pilgrim) return;
    const DOUBLE_CTRL_MS = 500;
    let lastAt = 0;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.isComposing) return;
      if (event.key !== "Control") {
        lastAt = 0;
        return;
      }
      const now = Date.now();
      if (now - lastAt >= DOUBLE_CTRL_MS) {
        lastAt = now;
        return;
      }
      event.preventDefault();
      lastAt = 0;
      focusMenuSearch();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [focusMenuSearch, pilgrim]);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  const showPilgrimageYears = isPilgrim(user) && canAccessMyReservations(user);
  const mineNavQuery = useQuery({
    queryKey: ["reservations", "mine", "nav"],
    enabled: showPilgrimageYears,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>(
        "/reservations/mine",
        {
          params: { page: 1, pageSize: 100, sortBy: "year", sortDir: "desc" },
        },
      );
      return data;
    },
  });

  const pilgrimageYearMenus = useMemo((): SidebarNavMenu[] => {
    if (!showPilgrimageYears) return [];
    return pickReservationPerYear(mineNavQuery.data?.items ?? []).map(
      (item, index) => ({
        code: `reservations.year.${item.id}`,
        nameKey: "menus.pilgrimageYear",
        label: t("menus.pilgrimageYear", {
          year: formatNumber(item.year, locale),
        }),
        path: `/my-reservations/${item.id}`,
        icon: "calendar-range",
        sortOrder: 1.5 + index * 0.01,
      }),
    );
  }, [locale, mineNavQuery.data?.items, showPilgrimageYears, t]);

  const navModules = useMemo(() => {
    const showMyCaravans = canAccessMyCaravans(user);
    const showMyGroups = canAccessMyGroups(user);
    const showMyReservations = canAccessMyReservations(user);
    const showMyAccommodations = canAccessMyAccommodations(user);
    const next = (user?.modules ?? [])
      .map(withAccommodationsDirectoryMenu)
      .map((mod) => {
        const menus = mod.menus.filter(
          (item) =>
            (item.code !== "caravans.mine" || showMyCaravans) &&
            (item.code !== "groups.mine" || showMyGroups) &&
            (item.code !== "reservations.mine" || showMyReservations) &&
            (item.code !== "accommodation.mine" || showMyAccommodations),
        );
        if (mod.code !== "caravans" || !pilgrimageYearMenus.length) {
          return { ...mod, menus };
        }
        return {
          ...mod,
          menus: insertAfterMenu(
            menus,
            "reservations.mine",
            pilgrimageYearMenus,
          ),
        };
      })
      .filter((mod) => mod.menus.length > 0);
    return filterSidebarModules(next, user);
  }, [pilgrimageYearMenus, user]);

  const modules = useMemo(() => {
    const needle = query.trim();
    if (!needle) return navModules;
    return navModules
      .map((mod) => ({
        ...mod,
        menus: mod.menus.filter((item) =>
          menuMatchesSearch(mod, item, needle, t),
        ),
      }))
      .filter((mod) => mod.menus.length > 0);
  }, [navModules, query, t]);

  const allMenuPaths = useMemo(
    () => navModules.flatMap((mod) => mod.menus.map((item) => item.path)),
    [navModules],
  );

  return (
    <QuickToolsProvider>
      <div className="h-svh overflow-hidden bg-cream-50">
        <div className="flex h-full">
          {open ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-ink-900/20 lg:hidden"
              aria-label={t("nav.closeMenu")}
              onClick={() => setOpen(false)}
            />
          ) : null}
          <aside
            className={`fixed inset-y-0 start-0 z-40 flex h-svh w-[280px] flex-col border-e border-line bg-white transition lg:static lg:h-full lg:translate-x-0 ${
              open
                ? "translate-x-0"
                : "ltr:-translate-x-full rtl:translate-x-full lg:ltr:translate-x-0 lg:rtl:translate-x-0"
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <NavLink
                  to="/"
                  onClick={() => setOpen(false)}
                  className="shrink-0"
                >
                  <AppLogo
                    src={brandLogoSrc}
                    decorative
                    className={
                      brandLogoSrc
                        ? "h-10 w-10 shrink-0 rounded-2xl bg-white object-cover shadow-[0_8px_18px_rgba(20,40,40,0.16)] ring-1 ring-teal-100"
                        : "h-10 w-auto max-w-10 shrink-0 object-contain"
                    }
                  />
                </NavLink>
                <div className="min-w-0">
                  <NavLink
                    to="/"
                    onClick={() => setOpen(false)}
                    className="block truncate font-semibold text-ink-900"
                  >
                    {brandTitle}
                  </NavLink>
                  {brandWebsite ? (
                    <a
                      href={toExternalHref(brandWebsite, "website")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-ink-400 hover:text-teal-700"
                      dir="ltr"
                      title={displayExternalUrl(brandWebsite)}
                    >
                      {displayExternalUrl(brandWebsite)}
                    </a>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-ink-500 lg:hidden"
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
              >
                <X className="size-5" />
              </button>
            </div>

            {pilgrim ? null : (
              <div className="px-4 pb-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <input
                    ref={menuSearchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("nav.searchMenu")}
                    aria-describedby={menuSearchHintId}
                    className="w-full rounded-2xl border border-line bg-cream-50 py-2.5 ps-10 pe-3 text-sm placeholder:text-ink-400"
                  />
                </label>
                <p
                  id={menuSearchHintId}
                  className="mt-2 px-1 text-[9px] leading-tight text-ink-300"
                >
                  {t("nav.searchMenuHint")}
                </p>
              </div>
            )}

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
              {modules.map((mod) => {
                const { ungrouped, sections } = splitMenus(mod);
                return (
                  <div key={mod.code}>
                    <p className="mb-1 px-3 text-[11px] font-medium text-ink-400">
                      {t(mod.nameKey)}
                    </p>
                    <div className="space-y-1">
                      {ungrouped.map((item) => (
                        <SidebarMenuLink
                          key={item.code}
                          item={item}
                          allMenuPaths={allMenuPaths}
                          onNavigate={() => setOpen(false)}
                        />
                      ))}
                    </div>
                    {sections.map((section) => {
                      const SectionIcon = section.icon;
                      return (
                        <div key={section.titleKey} className="mt-3">
                          <p className="mb-1 flex items-center gap-1.5 px-3 text-[11px] font-medium text-teal-700">
                            {SectionIcon ? (
                              <SectionIcon className="size-3.5" aria-hidden />
                            ) : null}
                            {t(section.titleKey)}
                          </p>
                          <div className="ms-3 space-y-1 border-s border-teal-100 ps-2">
                            {section.items.map((item) => (
                              <SidebarMenuLink
                                key={item.code}
                                item={item}
                                allMenuPaths={allMenuPaths}
                                onNavigate={() => setOpen(false)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
            <div className="shrink-0 border-t border-line px-3 py-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                onClick={() => {
                  const impersonating = Boolean(user?.impersonating);
                  setOpen(false);
                  logout();
                  if (!impersonating) navigate("/login");
                }}
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                {user?.impersonating ? t("auth.impersonateEnd") : t("auth.logout")}
              </button>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ImpersonationBanner />
            <header className="z-20 flex shrink-0 items-center gap-3 bg-cream-50/90 px-4 py-4 backdrop-blur sm:px-8">
              <button
                type="button"
                className="rounded-xl p-2 text-ink-700 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label={t("nav.openMenu")}
              >
                <Menu className="size-5" />
              </button>
              <PageBreadcrumb
                pathname={location.pathname}
                modules={navModules}
              />
              <UserMenu />
            </header>
            <main
              ref={mainRef}
              className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-8 ${
                showQuickToolsFab ? "pb-8 lg:pb-24" : "pb-8"
              }`}
            >
              <PageTransition>
                <Outlet />
              </PageTransition>
            </main>
            <AdminFooter branding={branding} compactEnd={showQuickToolsFab} />
          </div>
        </div>
      </div>
    </QuickToolsProvider>
  );
}

function SidebarMenuLink({
  item,
  allMenuPaths,
  onNavigate,
}: {
  item: SidebarNavMenu;
  allMenuPaths: string[];
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Icon = getNavIcon(item.icon);
  const isActive = isSidebarMenuActive(pathname, item.path, allMenuPaths);
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        isActive
          ? "bg-teal-500 text-white shadow-sm"
          : "text-ink-700 hover:bg-cream-50"
      }`}
    >
      <Icon
        className={`size-4 ${isActive ? "text-white" : "text-ink-400"}`}
        aria-hidden
      />
      {item.label ?? t(item.nameKey)}
    </Link>
  );
}
