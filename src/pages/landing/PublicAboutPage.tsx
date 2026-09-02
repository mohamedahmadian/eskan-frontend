import { Building2, CalendarRange, MessageCircle, Phone, Send, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoadingState } from "../../components/ui/Form";
import { FormEmptyHint, FormMetaChip } from "../../components/ui/FormLayout";
import { useBrandDisplay } from "../../hooks/useHeadquartersSummary";
import { api, getImageUrl } from "../../lib/api";
import {
  formatNumber,
  localizeDigits,
  parseDigitString,
} from "../../lib/datetime";
import { toExternalHref } from "../../lib/social-links";
import type { PublicOrgUnit } from "../../types/app";
import { LandingPageHeader } from "./LandingPageHeader";
import { LandingShell } from "./LandingShell";

export function PublicAboutPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const { title: brandTitle, name: brandName, branding } = useBrandDisplay();
  const query = useQuery({
    queryKey: ["public", "org-units"],
    queryFn: async () => {
      const { data } = await api.get<PublicOrgUnit[]>("/org-units/public");
      return data;
    },
  });

  const units = query.data ?? [];
  const intro = branding?.description?.trim();
  const years = branding?.yearsOfService;

  return (
    <LandingShell>
      <div className="space-y-12 pb-16 pt-6 sm:space-y-16 sm:pt-8">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <LandingPageHeader
            icon={Building2}
            eyebrow={t("landing.about.eyebrow")}
            title={t("landing.about.title")}
            subtitle={
              <>
                <p className="text-base font-medium text-ink-800">{brandTitle}</p>
                {brandName && brandName !== brandTitle ? (
                  <p className="mt-0.5 text-sm text-ink-500">{brandName}</p>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-ink-600">
                  {intro || t("landing.about.hint")}
                </p>
              </>
            }
            chips={
              years != null ? (
                <FormMetaChip
                  icon={CalendarRange}
                  label={t("landing.about.yearsOfService", {
                    years: formatNumber(years, locale),
                  })}
                />
              ) : undefined
            }
          />
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-xl font-semibold text-ink-900 sm:text-2xl">
              {t("landing.about.unitsTitle")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-ink-500">
              {t("landing.about.unitsHint")}
            </p>
          </div>
          {query.isLoading ? <LoadingState /> : null}
          {query.isFetched && !units.length ? (
            <FormEmptyHint>{t("landing.about.empty")}</FormEmptyHint>
          ) : null}
          {units.length ? (
            <>
              {units.length > 1 ? (
                <div className="mb-6 flex flex-wrap gap-2">
                  {units.map((unit) => (
                    <a
                      key={unit.id}
                      href={`#unit-${unit.id}`}
                      className="inline-flex min-h-10 items-center rounded-2xl bg-white px-3.5 py-2 text-sm font-medium text-ink-700 ring-1 ring-line transition hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      {unit.name}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="space-y-8">
                {units.map((unit, index) => (
                  <UnitSection
                    key={unit.id}
                    unit={unit}
                    index={index}
                    locale={locale}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </LandingShell>
  );
}

function UnitSection({
  unit,
  index,
  locale,
}: {
  unit: PublicOrgUnit;
  index: number;
  locale: string;
}) {
  const { t } = useTranslation();
  const latinPhone = unit.phone ? parseDigitString(unit.phone) : "";
  const mint = index % 2 === 1;

  return (
    <article
      id={`unit-${unit.id}`}
      className="scroll-mt-24 overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_12px_32px_rgba(20,40,40,0.06)]"
    >
      <div
        className={`flex items-center gap-3 px-5 py-4 sm:px-7 ${
          mint
            ? "bg-gradient-to-e from-mint-500 to-teal-400"
            : "bg-gradient-to-e from-teal-500 to-mint-400"
        }`}
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/18 text-white ring-1 ring-white/25">
          <Building2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-white/80">
            {t("landing.about.unitLabel", {
              n: formatNumber(index + 1, locale),
            })}
          </p>
          <h3 className="truncate text-lg font-semibold text-white">
            {unit.name}
          </h3>
        </div>
      </div>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {unit.description ? (
            <p className="whitespace-pre-wrap text-sm leading-8 text-ink-600">
              {unit.description}
            </p>
          ) : (
            <p className="text-sm leading-8 text-ink-400">
              {t("landing.about.noDescription")}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {unit.phone ? (
              latinPhone ? (
                <a
                  href={`tel:${latinPhone}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-3 py-2 text-sm text-teal-800 ring-1 ring-teal-100 transition hover:bg-teal-100"
                >
                  <Phone className="size-4" aria-hidden />
                  <span dir="ltr">{localizeDigits(unit.phone, locale)}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-3 py-2 text-sm text-teal-800 ring-1 ring-teal-100">
                  <Phone className="size-4" aria-hidden />
                  <span dir="ltr">{localizeDigits(unit.phone, locale)}</span>
                </span>
              )
            ) : null}
            {unit.eitaaChannel ? (
              <a
                href={toExternalHref(unit.eitaaChannel, "eitaa")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF4EC] px-3 py-2 text-sm text-[#D65A0C] ring-1 ring-[#F8D9C4] transition hover:bg-[#FFE7D4]"
              >
                <MessageCircle className="size-4" aria-hidden />
                {t("headquartersInfo.eitaa")}
              </a>
            ) : null}
            {unit.telegramChannel ? (
              <a
                href={toExternalHref(unit.telegramChannel, "telegram")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF6FD] px-3 py-2 text-sm text-[#1A8BC7] ring-1 ring-[#C5E7F7] transition hover:bg-[#D7EFFB]"
              >
                <Send className="size-4" aria-hidden />
                {t("headquartersInfo.telegram")}
              </a>
            ) : null}
          </div>
        </div>
        <aside className="rounded-[24px] bg-cream-50 p-4 ring-1 ring-line/70">
          <p className="text-xs font-medium text-teal-700">
            {t("landing.about.manager")}
          </p>
          {unit.manager ? (
            <div className="mt-3 flex items-center gap-3">
              {unit.manager.photoId ? (
                <img
                  src={getImageUrl(unit.manager.photoId)}
                  alt=""
                  className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-teal-100"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <UserRound className="size-6" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">
                  {unit.manager.fullName}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {t("landing.about.managerRole")}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-400">
              {t("landing.about.noManager")}
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
