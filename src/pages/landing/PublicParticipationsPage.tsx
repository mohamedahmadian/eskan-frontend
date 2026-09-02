import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Gift,
  HandHeart,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { withNext } from "../../lib/auth-redirect";
import { LandingPageHeader } from "./LandingPageHeader";
import { LandingShell } from "./LandingShell";

const HONORARY_APPLY_PATH = "/honorary-apply";

const cardTones = {
  teal: {
    icon: "bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]",
    accent: "text-teal-700",
  },
  mint: {
    icon: "bg-mint-500 text-white shadow-[0_10px_22px_rgba(63,214,190,0.28)]",
    accent: "text-teal-700",
  },
  ink: {
    icon: "bg-ink-700 text-white shadow-[0_10px_22px_rgba(47,43,40,0.18)]",
    accent: "text-ink-700",
  },
} as const;

type HubTone = keyof typeof cardTones;

export function PublicParticipationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const serviceTo = user
    ? HONORARY_APPLY_PATH
    : withNext("/register", HONORARY_APPLY_PATH);

  const sections: {
    to: string;
    icon: LucideIcon;
    titleKey: string;
    hintKey: string;
    actionKey: string;
    tone: HubTone;
  }[] = [
    {
      to: serviceTo,
      icon: HandHeart,
      titleKey: "landing.participations.serviceTitle",
      hintKey: "landing.participations.serviceHint",
      actionKey: "landing.participations.serviceAction",
      tone: "teal",
    },
    {
      to: "/welcome/participations/campaigns",
      icon: Coins,
      titleKey: "landing.participations.cashTitle",
      hintKey: "landing.participations.cashHint",
      actionKey: "landing.participations.cashAction",
      tone: "mint",
    },
    {
      to: "/welcome/participations/in-kind",
      icon: Gift,
      titleKey: "landing.participations.inKindTitle",
      hintKey: "landing.participations.inKindHint",
      actionKey: "landing.participations.inKindAction",
      tone: "ink",
    },
  ];

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t("common.back")}
        </Link>
        <div className="mt-6 mb-8">
          <LandingPageHeader
            icon={HeartHandshake}
            eyebrow={t("landing.participations.title")}
            title={t("landing.participations.hubTitle")}
            subtitle={t("landing.participations.hubHint")}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {sections.map((item) => {
            const Icon = item.icon;
            const tone = cardTones[item.tone];
            return (
              <Link
                key={item.titleKey}
                to={item.to}
                className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(20,40,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,189,182,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:p-7"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-2xl ${tone.icon}`}
                >
                  <Icon className="size-7" aria-hidden />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-ink-900">
                  {t(item.titleKey)}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-8 text-ink-600">
                  {t(item.hintKey)}
                </p>
                <span
                  className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${tone.accent}`}
                >
                  {t(item.actionKey)}
                  <ArrowLeft
                    className="size-4 ltr:rotate-180 transition group-hover:translate-x-0 group-hover:ltr:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </LandingShell>
  );
}
