import {
  ArrowRight,
  BedDouble,
  CreditCard,
  Gift,
  Hash,
  HeartPulse,
  Landmark,
  Package,
  ShoppingBasket,
  Sparkles,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LoadingState } from "../../components/ui/Form";
import {
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from "../../components/ui/FormLayout";
import { api, getApiErrorMessage } from "../../lib/api";
import type { PublicPaymentMethods } from "../../types/app";
import { LandingPageHeader } from "./LandingPageHeader";
import { LandingShell } from "./LandingShell";

const inKindItemIcons = {
  blanket: Package,
  food: ShoppingBasket,
  medicine: HeartPulse,
  hygiene: Sparkles,
  stay: BedDouble,
} as const satisfies Record<string, LucideIcon>;

export function PublicInKindPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["public", "participation-payment-methods"],
    queryFn: async () => {
      const { data } = await api.get<PublicPaymentMethods>(
        "/participation-campaigns/public/payment-methods",
      );
      return {
        accounts: data.bankAccounts ?? [],
        wallets: data.cryptoWallets ?? [],
      };
    },
  });

  const accounts = query.data?.accounts ?? [];
  const wallets = query.data?.wallets ?? [];
  const hasPayment = accounts.length > 0 || wallets.length > 0;

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
        <Link
          to="/welcome/participations"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t("common.back")}
        </Link>
        <div className="mt-6 mb-8">
          <LandingPageHeader
            icon={Gift}
            eyebrow={t("landing.participations.inKindTitle")}
            title={t("landing.participations.inKindPageTitle")}
            subtitle={t("landing.participations.inKindPageHint")}
          />
        </div>

        <article className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_12px_32px_rgba(20,40,40,0.06)]">
          <div className="space-y-5 p-5 sm:p-8">
            <p className="text-sm leading-8 text-ink-700">
              {t("landing.participations.inKindIntro")}
            </p>
            <p className="text-sm leading-8 text-ink-700">
              {t("landing.participations.inKindHow")}
            </p>
            <div>
              <FormSectionTitle icon={Gift}>
                {t("landing.participations.inKindItemsTitle")}
              </FormSectionTitle>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {(
                  Object.keys(inKindItemIcons) as Array<
                    keyof typeof inKindItemIcons
                  >
                ).map((key) => {
                  const Icon = inKindItemIcons[key];
                  return (
                    <li
                      key={key}
                      className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white px-3.5 py-3"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="pt-1.5 text-sm leading-6 text-ink-700">
                        {t(`landing.participations.inKindItems.${key}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </article>

        <section className="mt-8 space-y-5 rounded-[28px] border border-teal-100 bg-gradient-to-b from-teal-50/80 to-white p-5 shadow-[0_12px_32px_rgba(20,40,40,0.04)] sm:p-8">
          <FormSectionTitle icon={CreditCard}>
            {t("landing.participations.inKindPaymentTitle")}
          </FormSectionTitle>
          <p className="text-sm leading-7 text-ink-600">
            {t("landing.participations.inKindPaymentHint")}
          </p>
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? (
            <FormEmptyHint>
              {getApiErrorMessage(
                query.error,
                t("landing.participations.inKindPaymentError"),
              )}
            </FormEmptyHint>
          ) : null}
          {!query.isLoading && !query.isError && !hasPayment ? (
            <FormEmptyHint>
              {t("landing.participations.inKindEmptyPayment")}
            </FormEmptyHint>
          ) : null}
          {accounts.map((account) => (
            <div key={account.id}>
              <h3 className="mb-2 text-xs font-semibold text-ink-600">
                {t("landing.participations.bankSection")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Landmark}
                  label={t("bankAccounts.bankName")}
                  value={account.bankName}
                  tone="teal"
                />
                <FormFactTile
                  icon={Hash}
                  label={t("bankAccounts.accountNumber")}
                  copyValue={account.accountNumber}
                  tone="mint"
                />
                <FormFactTile
                  icon={CreditCard}
                  label={t("bankAccounts.cardNumber")}
                  copyValue={account.cardNumber}
                  tone="ink"
                />
                <FormFactTile
                  icon={WalletCards}
                  label={t("bankAccounts.iban")}
                  copyValue={account.iban}
                  tone="teal"
                />
              </div>
            </div>
          ))}
          {wallets.map((wallet) => (
            <div key={wallet.id}>
              <h3 className="mb-2 text-xs font-semibold text-ink-600">
                {t("landing.participations.cryptoSection")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Wallet}
                  label={t("cryptoWallets.label")}
                  value={`${wallet.label} (${t(`cryptoCurrencies.${wallet.currency}`, { defaultValue: wallet.currency })})`}
                  tone="mint"
                />
                {wallet.network ? (
                  <FormFactTile
                    icon={Wallet}
                    label={t("cryptoWallets.network")}
                    value={wallet.network}
                    tone="ink"
                  />
                ) : null}
                <FormFactTile
                  icon={Wallet}
                  label={t("cryptoWallets.address")}
                  copyValue={wallet.address}
                  tone="teal"
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </LandingShell>
  );
}
