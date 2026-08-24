import {
  AlertTriangle,
  Check,
  Copy,
  FileSpreadsheet,
  Mars,
  Users,
  Venus,
  type LucideIcon,
} from "lucide-react";
import { DateText } from "../../components/ui/DateText";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckboxField } from "../../components/ui/CheckboxField";
import { confirmToast } from "../../components/ui/confirmToast";
import { FileDropField } from "../../components/ui/FileDropField";
import { Button } from "../../components/ui/Form";
import { api, getApiErrorMessage } from "../../lib/api";
import { formatNumber, localizeDigits } from "../../lib/datetime";
import type {
  MemberImportPreview,
  MemberImportPreviewRow,
} from "../../types/app";

async function downloadBlob(blob: Blob, filename: string, errorLabel: string) {
  if (blob.type.includes("json")) {
    const parsed = JSON.parse(await blob.text()) as { message?: string };
    throw new Error(parsed.message || errorLabel);
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isSelectable(row: MemberImportPreviewRow) {
  return row.status === "VALID" && row.userState !== "ALREADY_MEMBER";
}

export function CompanionExcelImport({
  reservationId,
  isCaravan = false,
  onImported,
}: {
  reservationId: string;
  isCaravan?: boolean;
  onImported: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const [file, setFile] = useState<File | null>(null);
  const [dropKey, setDropKey] = useState(0);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<MemberImportPreview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const selectedRows = useMemo(
    () =>
      preview?.rows.filter((row) => selected.includes(row.nationalId)) ?? [],
    [preview, selected],
  );
  const selectedMale = selectedRows.filter(
    (row) => row.gender === "MALE",
  ).length;
  const selectedFemale = selectedRows.filter(
    (row) => row.gender === "FEMALE",
  ).length;
  const overflow =
    Boolean(preview) &&
    (selectedMale > (preview?.remainingMale ?? 0) ||
      selectedFemale > (preview?.remainingFemale ?? 0));

  async function previewFile(next: File) {
    setFile(next);
    setChecking(true);
    setPreview(null);
    setSelected([]);
    try {
      const body = new FormData();
      body.append("file", next);
      const { data } = await api.post<MemberImportPreview>(
        `/reservations/${reservationId}/members/import/preview`,
        body,
      );
      setPreview(data);
      setSelected(
        data.rows
          .filter(isSelectable)
          .map((row) => row.nationalId)
          .filter(Boolean),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
      setFile(null);
      setDropKey((value) => value + 1);
    } finally {
      setChecking(false);
    }
  }

  async function downloadTemplate() {
    try {
      const { data } = await api.get<Blob>(
        `/reservations/${reservationId}/members/import-template`,
        { responseType: "blob" },
      );
      await downloadBlob(data, "companions-template.xlsx", t("common.error"));
      toast.success(t("reservations.excelTemplateDownloaded"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : getApiErrorMessage(error, t("common.error")),
      );
    }
  }

  async function downloadErrors() {
    if (!file) return;
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post<Blob>(
        `/reservations/${reservationId}/members/import/errors`,
        body,
        { responseType: "blob" },
      );
      await downloadBlob(
        data,
        "companion-import-errors.xlsx",
        t("common.error"),
      );
      toast.success(t("reservations.excelErrorsDownloaded"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : getApiErrorMessage(error, t("common.error")),
      );
    }
  }

  function confirmImport() {
    if (!file || !selected.length) {
      toast.error(t("reservations.excelNoneSelected"));
      return;
    }
    if (overflow) {
      toast.error(t("reservations.excelOverflow"));
      return;
    }
    confirmToast({
      title: t(
        isCaravan
          ? "reservations.excelConfirmAddCaravan"
          : "reservations.excelConfirmAdd",
        { count: n(selected.length) },
      ),
      confirmLabel: t("common.yes"),
      cancelLabel: t("common.cancel"),
      onConfirm: () => void runImport(),
    });
  }

  async function runImport() {
    if (!file) return;
    setImporting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("nationalIds", JSON.stringify(selected));
      await api.post(`/reservations/${reservationId}/members/import`, body);
      toast.success(
        t(
          isCaravan
            ? "reservations.excelImportedCaravan"
            : "reservations.excelImported",
        ),
      );
      await queryClient.invalidateQueries({
        queryKey: ["reservations", reservationId, "previous-members"],
      });
      setFile(null);
      setPreview(null);
      setSelected([]);
      setDropKey((value) => value + 1);
      onImported();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setImporting(false);
    }
  }

  function toggle(row: MemberImportPreviewRow, checked: boolean) {
    if (!isSelectable(row)) return;
    setSelected((current) =>
      checked
        ? [...new Set([...current, row.nationalId])]
        : current.filter((item) => item !== row.nationalId),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm leading-7 text-ink-600">
          {t("reservations.excelImportHint")}
        </p>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => void downloadTemplate()}
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          {t("reservations.excelDownloadTemplate")}
        </Button>
      </div>
      <FileDropField
        key={dropKey}
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        allowCamera={false}
        maxBytes={2 * 1024 * 1024}
        uploading={checking}
        onFile={(next) => void previewFile(next)}
        onClear={() => {
          setFile(null);
          setPreview(null);
          setSelected([]);
        }}
      />
      {checking ? (
        <p className="text-sm text-ink-500">
          {t("reservations.excelChecking")}
        </p>
      ) : null}
      {preview ? (
        <div className="space-y-3 text-sm">
          <ExcelPreviewStats preview={preview} locale={locale} />
          {preview.invalid + preview.duplicate > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void downloadErrors()}
            >
              {t("reservations.excelDownloadErrors")}
            </Button>
          ) : null}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[68rem] text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-3 py-2 text-start">
                    {t("common.actions")}
                  </th>
                  <th className="px-3 py-2 text-start">
                    {t("reservations.excelRow")}
                  </th>
                  <th className="px-3 py-2 text-start">
                    {t("users.nationalId")}
                  </th>
                  <th className="px-3 py-2 text-start">
                    {t("users.firstName")}
                  </th>
                  <th className="px-3 py-2 text-start">
                    {t("users.lastName")}
                  </th>
                  <th className="px-3 py-2 text-start">{t("users.gender")}</th>
                  <th className="px-3 py-2 text-start">{t("users.phone")}</th>
                  <th className="px-3 py-2 text-start">
                    {t("users.birthDate")}
                  </th>
                  <th className="min-w-56 px-3 py-2 text-start">
                    {t("reservations.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={`${row.rowNumber}-${row.nationalId}`}
                    className="border-t border-line"
                  >
                    <td className="px-3 py-2">
                      <CheckboxField
                        compact
                        checked={selected.includes(row.nationalId)}
                        disabled={!isSelectable(row)}
                        onChange={(checked) => toggle(row, checked)}
                        label={t("reservations.excelConfirmImport", {
                          count: 1,
                        })}
                      />
                    </td>
                    <td className="px-3 py-2">{n(row.rowNumber)}</td>
                    <td className="px-3 py-2 text-start">
                      {row.nationalId
                        ? localizeDigits(row.nationalId, locale)
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{row.firstName || "—"}</td>
                    <td className="px-3 py-2">{row.lastName || "—"}</td>
                    <td className="px-3 py-2">
                      {row.gender
                        ? t(`userGenders.${row.gender}`)
                        : row.genderText || "—"}
                    </td>
                    <td className="px-3 py-2 text-start">
                      {row.phone ? localizeDigits(row.phone, locale) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.birthDate ? <DateText value={row.birthDate} /> : "—"}
                    </td>
                    <td className="min-w-56 px-3 py-2">
                      <RowStatus row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 md:hidden">
            {preview.rows.map((row) => (
              <div
                key={`${row.rowNumber}-${row.nationalId}`}
                className="rounded-2xl border border-line p-3"
              >
                <CheckboxField
                  checked={selected.includes(row.nationalId)}
                  disabled={!isSelectable(row)}
                  onChange={(checked) => toggle(row, checked)}
                  label={
                    `${row.firstName} ${row.lastName}`.trim() || row.nationalId
                  }
                />
                <p className="mt-2 text-start">
                  {row.nationalId
                    ? localizeDigits(row.nationalId, locale)
                    : "—"}
                </p>
                {row.phone ? (
                  <p className="mt-1 text-start">
                    {localizeDigits(row.phone, locale)}
                  </p>
                ) : null}
                <RowStatus row={row} />
              </div>
            ))}
          </div>
          {overflow ? (
            <p className="text-sm text-red-700">
              {t("reservations.excelOverflow")}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={importing || !selected.length || overflow}
            onClick={confirmImport}
          >
            {t("reservations.excelConfirmImport", {
              count: n(selected.length),
            })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RowStatus({ row }: { row: MemberImportPreviewRow }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const errorText = row.errors
    .map((code) => t(`reservations.importErrors.${code}`))
    .join("، ");
  return (
    <div className="space-y-1 text-xs">
      {row.userState === "EXISTING" ? (
        <p className="text-teal-700">{t("reservations.excelUserExisting")}</p>
      ) : null}
      {row.userState === "NEW" && row.status === "VALID" ? (
        <p className="text-ink-600">{t("reservations.excelUserNew")}</p>
      ) : null}
      {row.userState === "ALREADY_MEMBER" ? (
        <p className="text-ink-500">{t("reservations.excelUserAlready")}</p>
      ) : null}
      {row.duplicateOfRow ? (
        <p className="text-red-700">
          {t("reservations.excelDuplicateOf", {
            row: formatNumber(row.duplicateOfRow, locale),
          })}
        </p>
      ) : null}
      {errorText ? <p className="text-red-700">{errorText}</p> : null}
    </div>
  );
}

type StatTone = "teal" | "mint" | "ink" | "amber" | "red";

const statTone: Record<StatTone, { wrap: string; icon: string }> = {
  teal: {
    wrap: "border-teal-100 bg-gradient-to-b from-teal-50 to-white",
    icon: "bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]",
  },
  mint: {
    wrap: "border-mint-100 bg-gradient-to-b from-mint-50 to-white",
    icon: "bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]",
  },
  ink: {
    wrap: "border-line bg-gradient-to-b from-cream-50 to-white",
    icon: "bg-ink-700 text-white",
  },
  amber: {
    wrap: "border-amber-100 bg-gradient-to-b from-amber-50 to-white",
    icon: "bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.28)]",
  },
  red: {
    wrap: "border-red-100 bg-gradient-to-b from-red-50 to-white",
    icon: "bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]",
  },
};

function ExcelPreviewStats({
  preview,
  locale,
}: {
  preview: MemberImportPreview;
  locale: string;
}) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, locale);
  const tiles: {
    key: string;
    label: string;
    value: number;
    icon: LucideIcon;
    tone: StatTone;
  }[] = [
    {
      key: "total",
      label: t("reservations.excelStatTotal"),
      value: preview.total,
      icon: Users,
      tone: "ink",
    },
    {
      key: "valid",
      label: t("reservations.excelStatValid"),
      value: preview.valid,
      icon: Check,
      tone: "teal",
    },
    {
      key: "invalid",
      label: t("reservations.excelStatInvalid"),
      value: preview.invalid,
      icon: AlertTriangle,
      tone: "amber",
    },
    {
      key: "duplicate",
      label: t("reservations.excelStatDuplicate"),
      value: preview.duplicate,
      icon: Copy,
      tone: "red",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {tiles.map((tile) => (
          <StatTile
            key={tile.key}
            icon={tile.icon}
            label={tile.label}
            value={n(tile.value)}
            tone={tile.tone}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatTile
          icon={Mars}
          label={t("reservations.male")}
          value={n(preview.maleCount)}
          tone="teal"
        />
        <StatTile
          icon={Venus}
          label={t("reservations.female")}
          value={n(preview.femaleCount)}
          tone="mint"
        />
        <StatTile
          icon={Mars}
          label={t("reservations.excelRemainingMale")}
          value={n(preview.remainingMale)}
          tone="teal"
        />
        <StatTile
          icon={Venus}
          label={t("reservations.excelRemainingFemale")}
          value={n(preview.remainingFemale)}
          tone="mint"
        />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: StatTone;
}) {
  const colors = statTone[tone];
  return (
    <article
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
    </article>
  );
}
