import {
  Boxes,
  FolderOpen,
  HandHeart,
  LogOut,
  Menu,
  PackageOpen,
  Search,
  Snowflake,
  UtensilsCrossed,
  UsersRound,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
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
import { HeaderToday } from "./HeaderToday";
import {
  canAccessMyAccommodations,
  canAccessMyCaravans,
  canAccessMyEvaluations,
  canAccessMyGroups,
  canAccessMyReservations,
  hasNoRoles,
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

type MenuSectionDef = {
  titleKey: string;
  icon?: typeof Snowflake;
  codes?: string[];
  codePrefix?: string;
};

const PILGRIMAGE_YEAR_PREFIX = "reservations.year.";

const menuSections: Record<string, MenuSectionDef[]> = {
  caravans: [
    {
      titleKey: "menus.myFilesSection",
      icon: FolderOpen,
      codePrefix: PILGRIMAGE_YEAR_PREFIX,
    },
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
    {
      titleKey: "menus.nutritionSection",
      icon: UtensilsCrossed,
      codes: [
        "logistics.ingredients",
        "logistics.foods",
        "logistics.warehouse-calculator",
        "logistics.restaurants",
        "logistics.restaurant-meal-plans",
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

const HONORARY_SERVICE_MENUS: SidebarNavMenu[] = [
  {
    code: "honorary-service.apply",
    nameKey: "menus.honoraryApply",
    path: "/honorary-apply",
    icon: "hand-heart",
    sortOrder: 1,
  },
  {
    code: "honorary-service.history",
    nameKey: "menus.honoraryHistory",
    path: "/honorary-history",
    icon: "history",
    sortOrder: 2,
  },
];

function isHonoraryServiceModule(mod: NavModule) {
  return mod.code === "honorary-service" || mod.nameKey === "modules.honoraryService";
}

const PILGRIM_CAMPAIGNS_MENU: SidebarNavMenu = {
  code: "participations.campaigns",
  nameKey: "menus.participationCampaigns",
  path: "/participations/campaigns",
  icon: "megaphone",
  sortOrder: 2,
};

function isParticipationsModule(mod: NavModule) {
  return mod.code === "participations" || mod.nameKey === "modules.participations";
}

function withPilgrimCampaignsNav(
  modules: NavModule[],
  user: { roles?: { code: string }[] } | null | undefined,
): NavModule[] {
  if (!isPilgrim(user) || isAdmin(user)) return modules;
  const existing = modules.find(isParticipationsModule);
  const campaignMenu =
    existing?.menus.find(
      (item) =>
        item.code === "participations.campaigns" ||
        item.path === "/participations/campaigns",
    ) ?? PILGRIM_CAMPAIGNS_MENU;
  const rest = modules.filter((mod) => !isParticipationsModule(mod));
  return [
    ...rest,
    {
      code: existing?.code ?? "participations",
      nameKey: existing?.nameKey ?? "modules.participations",
      icon: existing?.icon ?? "heart-handshake",
      sortOrder: existing?.sortOrder ?? 8,
      menus: [campaignMenu],
    },
  ].sort((a, b) => a.sortOrder - b.sortOrder);
}

function isLegacyHonoraryApplyMenu(item: SidebarNavMenu) {
  return (
    item.code === "dashboard.honorary-apply" ||
    item.path === "/honorary-apply" ||
    item.nameKey === "menus.honoraryApply"
  );
}

function withHonoraryServiceNav(modules: NavModule[]): NavModule[] {
  const stripped = modules
    .map((mod) => {
      if (mod.code !== "dashboard") return mod;
      return {
        ...mod,
        menus: mod.menus.filter(
          (item) =>
            item.code !== "dashboard.honorary-apply" &&
            item.path !== "/honorary-apply",
        ),
      };
    })
    .filter((mod) => mod.menus.length > 0);

  const existing = stripped.find(isHonoraryServiceModule);
  if (existing) {
    const missing = HONORARY_SERVICE_MENUS.filter(
      (extra) =>
        !existing.menus.some(
          (item) => item.code === extra.code || item.path === extra.path,
        ),
    );
    if (!missing.length) return stripped;
    return stripped.map((mod) =>
      isHonoraryServiceModule(mod)
        ? {
            ...mod,
            menus: [...mod.menus, ...missing].sort((a, b) => a.sortOrder - b.sortOrder),
          }
        : mod,
    );
  }

  const withoutLegacyApply = stripped.map((mod) => ({
    ...mod,
    menus: mod.menus.filter((item) => !isLegacyHonoraryApplyMenu(item)),
  })).filter((mod) => mod.menus.length > 0);

  return [
    ...withoutLegacyApply,
    {
      code: "honorary-service",
      nameKey: "modules.honoraryService",
      icon: "hand-heart",
      sortOrder: 13,
      menus: HONORARY_SERVICE_MENUS,
    },
  ].sort((a, b) => a.sortOrder - b.sortOrder);
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

function menuBelongsToSection(item: { code: string }, section: MenuSectionDef) {
  if (section.codes?.includes(item.code)) return true;
  if (section.codePrefix && item.code.startsWith(section.codePrefix)) return true;
  return false;
}

function sectionMenuItems(mod: NavModule, section: MenuSectionDef): NavMenu[] {
  if (section.codePrefix) {
    return mod.menus.filter((item) => item.code.startsWith(section.codePrefix!));
  }
  return (section.codes ?? [])
    .map((code) => mod.menus.find((item) => item.code === code))
    .filter((item): item is NavMenu => Boolean(item));
}

function splitMenus(mod: NavModule) {
  const sections = menuSections[mod.code] ?? [];
  return {
    ungrouped: mod.menus.filter(
      (item) => !sections.some((section) => menuBelongsToSection(item, section)),
    ),
    sections: sections
      .map((section) => ({
        ...section,
        items: sectionMenuItems(mod, section),
      }))
      .filter((section) => section.items.length > 0),
  };
}

function flattenVisibleMenus(mods: NavModule[]): SidebarNavMenu[] {
  return mods.flatMap((mod) => {
    const { ungrouped, sections } = splitMenus(mod);
    return [...ungrouped, ...sections.flatMap((section) => section.items)];
  });
}

function sidebarMenuItemId(code: string) {
  return `sidebar-menu-${code}`;
}

function nextMenuIndex(current: number, delta: number, count: number) {
  if (count <= 0) return 0;
  const index = Math.min(Math.max(current, 0), count - 1);
  return (index + delta + count) % count;
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
      menuBelongsToSection(item, section) &&
      label(section.titleKey).includes(needle),
  );
}

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const location = useLocation();
  const navigate = useNavigate();
  const showQuickToolsFab = isQuickToolsFabVisible(location.pathname, user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const menuSearchRef = useRef<HTMLInputElement>(null);
  const menuSearchHintId = "sidebar-menu-search-hint";
  const menuSearchListId = "sidebar-menu-list";
  const brandingQuery = useHeadquartersSummary();
  const branding = brandingQuery.data;
  const pilgrim = isPilgrim(user);
  const brandTitle = pilgrim
    ? t("nav.pilgrimPanel")
    : hasNoRoles(user)
      ? t("nav.account")
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
        code: `${PILGRIMAGE_YEAR_PREFIX}${item.id}`,
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
    const showMyEvaluations = canAccessMyEvaluations(user);
    const next = (user?.modules ?? [])
      .map((mod) => (showMyAccommodations ? withAccommodationsDirectoryMenu(mod) : mod))
      .map((mod) => {
        const menus = mod.menus.filter(
          (item) =>
            item.code !== "base-info.medical-centers" &&
            item.code !== "base-info.red-crescents" &&
            item.nameKey !== "menus.medicalCenters" &&
            item.nameKey !== "menus.redCrescents" &&
            (item.code !== "caravans.mine" || showMyCaravans) &&
            (item.code !== "groups.mine" || showMyGroups) &&
            (item.code !== "reservations.mine" || showMyReservations) &&
            (item.code !== "reservations.create" || showMyReservations) &&
            (item.code !== "accommodation.mine" || showMyAccommodations) &&
            (item.code !== "evaluations.mine" || showMyEvaluations),
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
    return filterSidebarModules(
      withPilgrimCampaignsNav(withHonoraryServiceNav(next), user),
      user,
    );
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

  const visibleMenus = useMemo(() => flattenVisibleMenus(modules), [modules]);
  const searching = Boolean(query.trim());
  const highlightedMenu = searching
    ? visibleMenus[
        visibleMenus.length
          ? Math.min(highlightedIndex, visibleMenus.length - 1)
          : 0
      ]
    : undefined;

  const allMenuPaths = useMemo(
    () => navModules.flatMap((mod) => mod.menus.map((item) => item.path)),
    [navModules],
  );

  const openMenu = useCallback(
    (item: SidebarNavMenu) => {
      setOpen(false);
      navigate(item.path);
    },
    [navigate],
  );

  const highlightMenu = useCallback(
    (code: string) => {
      const index = visibleMenus.findIndex((menu) => menu.code === code);
      if (index >= 0) setHighlightedIndex(index);
    },
    [visibleMenus],
  );

  const onMenuSearchKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (!searching || event.isComposing) return;
      const count = visibleMenus.length;
      if (!count) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) => nextMenuIndex(current, 1, count));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) => nextMenuIndex(current, -1, count));
        return;
      }
      if (event.key === "Enter") {
        if (event.repeat) return;
        event.preventDefault();
        const index = Math.min(highlightedIndex, count - 1);
        const item = visibleMenus[index] ?? visibleMenus[0];
        if (item) openMenu(item);
      }
    },
    [highlightedIndex, openMenu, searching, visibleMenus],
  );

  useEffect(() => {
    if (!highlightedMenu) return;
    const el = document.getElementById(sidebarMenuItemId(highlightedMenu.code));
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedMenu]);

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
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={onMenuSearchKeyDown}
                    placeholder={t("nav.searchMenu")}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={searching}
                    aria-controls={menuSearchListId}
                    aria-activedescendant={
                      highlightedMenu
                        ? sidebarMenuItemId(highlightedMenu.code)
                        : undefined
                    }
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

            <nav
              id={menuSearchListId}
              className="flex-1 space-y-5 overflow-y-auto px-3 pb-3"
            >
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
                          highlighted={highlightedMenu?.code === item.code}
                          onHighlight={() => highlightMenu(item.code)}
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
                                highlighted={highlightedMenu?.code === item.code}
                                onHighlight={() => highlightMenu(item.code)}
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
                  if (!impersonating) navigate("/");
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
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <HeaderToday />
                <UserMenu />
              </div>
            </header>
            <main
              ref={mainRef}
              className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-8 ${
                showQuickToolsFab ? "pb-8 lg:pb-24" : "pb-8"
              }`}
            >
              <PageTransition>
                {children ?? <Outlet />}
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
  highlighted = false,
  onHighlight,
}: {
  item: SidebarNavMenu;
  allMenuPaths: string[];
  onNavigate: () => void;
  highlighted?: boolean;
  onHighlight?: () => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Icon = getNavIcon(item.icon);
  const isActive = isSidebarMenuActive(pathname, item.path, allMenuPaths);
  const iconClass = isActive
    ? "text-white"
    : highlighted
      ? "text-teal-600"
      : "text-ink-400";
  return (
    <Link
      id={sidebarMenuItemId(item.code)}
      to={item.path}
      onClick={onNavigate}
      onMouseEnter={onHighlight}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        isActive
          ? `bg-teal-500 text-white shadow-sm${highlighted ? " ring-2 ring-inset ring-white/70" : ""}`
          : highlighted
            ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200"
            : "text-ink-700 hover:bg-cream-50"
      }`}
    >
      <Icon className={`size-4 ${iconClass}`} aria-hidden />
      {item.label ?? t(item.nameKey)}
    </Link>
  );
}
