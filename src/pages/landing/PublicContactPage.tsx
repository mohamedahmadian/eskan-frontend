import { MapPin, Navigation, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormEmptyHint } from "../../components/ui/FormLayout";
import { OsmMapPicker } from "../../components/ui/OsmMapPicker";
import { useBrandDisplay } from "../../hooks/useHeadquartersSummary";
import { brandingSocialLinks } from "../../lib/contact-links";
import { localizeDigits, parseDigitString } from "../../lib/datetime";
import { LandingPageHeader } from "./LandingPageHeader";
import { LandingShell } from "./LandingShell";

export function PublicContactPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const { branding } = useBrandDisplay();
  const phones = (branding?.phones ?? []).filter((item) => item.phone.trim());
  const links = brandingSocialLinks(branding);
  const address = branding?.address?.trim();
  const neshanAddress = branding?.neshanAddress?.trim();
  const coords =
    branding?.latitude != null && branding?.longitude != null
      ? { lat: branding.latitude, lng: branding.longitude }
      : null;
  const hasContacts =
    phones.length > 0 ||
    links.length > 0 ||
    Boolean(address) ||
    Boolean(neshanAddress) ||
    Boolean(coords);

  return (
    <LandingShell>
      <div className="space-y-12 pb-16 pt-6 sm:space-y-16 sm:pt-8">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <LandingPageHeader
            icon={Phone}
            eyebrow={t("landing.contact.eyebrow")}
            title={t("landing.contact.title")}
          />
        </section>

        <div className="mx-auto w-full max-w-6xl space-y-12 px-4 sm:px-8">
          {!hasContacts && branding !== undefined ? (
            <FormEmptyHint>{t("landing.contact.empty")}</FormEmptyHint>
          ) : null}

          {address || neshanAddress || coords ? (
            <section>
              <h2 className="text-xl font-semibold text-ink-900">
                {t("landing.contact.addressTitle")}
              </h2>
              <div className="mt-4 space-y-3">
                {address ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_8px_22px_rgba(20,40,40,0.05)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                      <MapPin className="size-4" aria-hidden />
                    </span>
                    <p className="pt-1.5 text-sm leading-7 text-ink-700">{address}</p>
                  </div>
                ) : null}
                {neshanAddress ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_8px_22px_rgba(20,40,40,0.05)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                      <Navigation className="size-4" aria-hidden />
                    </span>
                    <p className="pt-1.5 text-sm leading-7 text-ink-700">
                      {/^https?:\/\//i.test(neshanAddress) ? (
                        <a
                          href={neshanAddress}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="break-all text-teal-700 hover:underline"
                        >
                          {neshanAddress}
                        </a>
                      ) : (
                        <span dir="ltr">{neshanAddress}</span>
                      )}
                    </p>
                  </div>
                ) : null}
                {coords ? (
                  <OsmMapPicker
                    latitude={String(coords.lat)}
                    longitude={String(coords.lng)}
                    onChange={() => undefined}
                    variant="always"
                    readOnly
                    heightClass="h-64"
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {phones.length ? (
            <section>
              <h2 className="text-xl font-semibold text-ink-900">
                {t("landing.contact.phonesTitle")}
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {phones.map((item) => {
                  const latin = parseDigitString(item.phone);
                  const phoneLabel = localizeDigits(item.phone, locale);
                  const body = (
                    <>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                        <Phone className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-teal-700">
                          {item.department || t("headquartersPhones.phone")}
                        </span>
                        <span
                          dir="ltr"
                          className="mt-0.5 block truncate text-sm font-semibold text-ink-900"
                        >
                          {phoneLabel}
                        </span>
                      </span>
                    </>
                  );
                  const className =
                    "flex items-center gap-3 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_8px_22px_rgba(20,40,40,0.05)] transition hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300";
                  if (!latin) {
                    return (
                      <div key={item.id} className={className}>
                        {body}
                      </div>
                    );
                  }
                  return (
                    <a
                      key={item.id}
                      href={`tel:${latin}`}
                      className={className}
                    >
                      {body}
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          {links.length ? (
            <section>
              <h2 className="text-xl font-semibold text-ink-900">
                {t("landing.contact.socialsTitle")}
              </h2>
              <div className="mt-4 grid grid-flow-col auto-cols-fr gap-3">
                {links.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.display}
                      className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-[0_8px_22px_rgba(20,40,40,0.05)] transition hover:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition ${item.className}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">
                          {t(item.labelKey)}
                        </span>
                        {item.display ? (
                          <span
                            dir="ltr"
                            className="mt-0.5 block truncate text-xs text-ink-500"
                          >
                            {item.display}
                          </span>
                        ) : null}
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </LandingShell>
  );
}
