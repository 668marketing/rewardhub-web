"use client";

import {
  AlertTriangle,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  Megaphone,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  updateMerchantMarketingSettings,
  type AdminMerchantMarketingSetting,
  type MerchantMarketingSummary,
} from "@/lib/admin-merchant-detail";

type MerchantMarketingTabProps = {
  merchantId: string;
  summary: MerchantMarketingSummary;
  setting: AdminMerchantMarketingSetting | null;
  onUpdated: () => Promise<void>;
};

type MarketingFormState = {
  normalBudget: string;

  boostEnabled: boolean;
  boostBudget: string;
  boostStart: string;
  boostEnd: string;

  acceptRewardCredits: boolean;
  redemptionLimit: string;
};

type BoostStatus = {
  label: string;
  className: string;
};

export default function MerchantMarketingTab({
  merchantId,
  summary,
  setting,
  onUpdated,
}: MerchantMarketingTabProps) {
  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] =
    useState<MarketingFormState>(() =>
      createFormState(
        setting,
        summary
      )
    );

  useEffect(() => {
    if (!editing) {
      setForm(
        createFormState(
          setting,
          summary
        )
      );
    }
  }, [
    setting,
    summary,
    editing,
  ]);

  const boostStatus =
    useMemo<BoostStatus>(() => {
      if (!summary.boostEnabled) {
        return {
          label: "Disabled",
          className:
            "border-slate-400/15 bg-slate-400/[0.07] text-slate-400",
        };
      }

      if (summary.boostActive) {
        return {
          label: "Active",
          className:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        };
      }

      const startTimestamp =
        getTimestamp(
          summary.boostStart
        );

      const endTimestamp =
        getTimestamp(
          summary.boostEnd
        );

      const now = Date.now();

      if (
        startTimestamp &&
        startTimestamp > now
      ) {
        return {
          label: "Scheduled",
          className:
            "border-blue-400/20 bg-blue-400/10 text-blue-300",
        };
      }

      if (
        endTimestamp &&
        endTimestamp < now
      ) {
        return {
          label: "Expired",
          className:
            "border-slate-400/15 bg-slate-400/[0.07] text-slate-400",
        };
      }

      return {
        label: "Inactive",
        className:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };
    }, [
      summary.boostEnabled,
      summary.boostActive,
      summary.boostStart,
      summary.boostEnd,
    ]);

  function handleEdit() {
    setForm(
      createFormState(
        setting,
        summary
      )
    );

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function handleCancel() {
    setForm(
      createFormState(
        setting,
        summary
      )
    );

    setError("");
    setEditing(false);
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    const normalBudget =
      parseNumericInput(
        form.normalBudget
      );

    const boostBudget =
      parseNumericInput(
        form.boostBudget
      );

    const redemptionLimit =
      parseNumericInput(
        form.redemptionLimit
      );

    if (
      !Number.isFinite(
        normalBudget
      ) ||
      normalBudget < 5 ||
      normalBudget > 100
    ) {
      setError(
        "Normal Marketing Budget must be between 5% and 100%."
      );
      return;
    }

    if (form.boostEnabled) {
      if (
        !Number.isFinite(
          boostBudget
        ) ||
        boostBudget < 5 ||
        boostBudget > 100
      ) {
        setError(
          "Boost Budget must be between 5% and 100%."
        );
        return;
      }

      if (
        boostBudget <
        normalBudget
      ) {
        setError(
          "Boost Budget cannot be lower than Normal Budget."
        );
        return;
      }

      if (
        !form.boostStart ||
        !form.boostEnd
      ) {
        setError(
          "Boost start and end dates are required."
        );
        return;
      }

      const boostStart =
        new Date(
          form.boostStart
        );

      const boostEnd =
        new Date(
          form.boostEnd
        );

      if (
        Number.isNaN(
          boostStart.getTime()
        ) ||
        Number.isNaN(
          boostEnd.getTime()
        )
      ) {
        setError(
          "The selected Boost Period is invalid."
        );
        return;
      }

      if (
        boostEnd.getTime() <=
        boostStart.getTime()
      ) {
        setError(
          "Boost end date must be later than Boost start date."
        );
        return;
      }
    }

    if (
      form.acceptRewardCredits &&
      (
        !Number.isFinite(
          redemptionLimit
        ) ||
        redemptionLimit < 0 ||
        redemptionLimit > 100
      )
    ) {
      setError(
        "Reward Credits Redemption Limit must be between 0% and 100%."
      );
      return;
    }

    try {
      setSaving(true);

      await updateMerchantMarketingSettings(
        merchantId,
        {
          normalBudget,

          boostEnabled:
            form.boostEnabled,

          boostBudget:
            form.boostEnabled
              ? boostBudget
              : 0,

          boostStart:
            form.boostEnabled
              ? localDateTimeToIso(
                  form.boostStart
                )
              : "",

          boostEnd:
            form.boostEnabled
              ? localDateTimeToIso(
                  form.boostEnd
                )
              : "",

          acceptRewardCredits:
            form.acceptRewardCredits,

          redemptionLimit:
            form.acceptRewardCredits
              ? redemptionLimit
              : 0,
        }
      );

      await onUpdated();

      setEditing(false);
      setSuccess(
        "Marketing settings updated successfully."
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update marketing settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <MessageBox
          type="error"
          message={error}
        />
      ) : null}

      {success ? (
        <MessageBox
          type="success"
          message={success}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MarketingStatCard
          icon={BadgePercent}
          label="Current Budget"
          value={formatPercent(
            summary.currentBudget
          )}
          description={
            summary.boostActive
              ? "Temporary Boost Budget is active"
              : "Normal Marketing Budget is active"
          }
        />

        <MarketingStatCard
          icon={ShieldCheck}
          label="Normal Budget"
          value={formatPercent(
            summary.normalBudget
          )}
          description="Permanent merchant marketing rate"
        />

        <MarketingStatCard
          icon={Sparkles}
          label="Boost Budget"
          value={
            summary.boostEnabled
              ? formatPercent(
                  summary.boostBudget
                )
              : "Disabled"
          }
          description={`${formatNumber(
            summary.boostCount
          )} boost period${
            summary.boostCount === 1
              ? ""
              : "s"
          } created`}
        />

        <MarketingStatCard
          icon={CreditCard}
          label="Reward Credits"
          value={
            summary.acceptRewardCredits
              ? "Accepted"
              : "Not Accepted"
          }
          description={
            summary.acceptRewardCredits
              ? `${formatPercent(
                  summary.redemptionLimit
                )} transaction limit`
              : "Members cannot redeem credits"
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Megaphone className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Marketing Configuration
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    Configure budget,
                    Boost Period and
                    Reward Credits
                  </p>
                </div>
              </div>

              {!editing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  <Pencil className="h-4 w-4" />

                  Edit Settings
                </button>
              ) : (
                <span className="inline-flex h-9 items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 text-xs font-semibold text-amber-300">
                  Editing
                </span>
              )}
            </div>

            {editing ? (
              <MarketingForm
                form={form}
                setForm={setForm}
              />
            ) : (
              <MarketingOverview
                summary={summary}
                boostStatus={
                  boostStatus
                }
              />
            )}

            {editing ? (
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    handleCancel
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />

                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleSave()
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            ) : null}
          </section>

          <BoostPeriodCard
            summary={summary}
            boostStatus={
              boostStatus
            }
          />
        </div>

        <div className="space-y-5">
          <CurrentBudgetCard
            summary={summary}
          />

          <RewardCreditsCard
            summary={summary}
          />

          <MarketingRules />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
 * Marketing Overview
 * ============================================================
 */

function MarketingOverview({
  summary,
  boostStatus,
}: {
  summary:
    MerchantMarketingSummary;

  boostStatus:
    BoostStatus;
}) {
  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      <DisplayField
        label="Normal Budget"
        value={formatPercent(
          summary.normalBudget
        )}
      />

      <DisplayField
        label="Current Budget"
        value={formatPercent(
          summary.currentBudget
        )}
      />

      <DisplayField
        label="Boost Status"
        value={
          boostStatus.label
        }
        badgeClassName={
          boostStatus.className
        }
      />

      <DisplayField
        label="Boost Budget"
        value={
          summary.boostEnabled
            ? formatPercent(
                summary.boostBudget
              )
            : "—"
        }
      />

      <DisplayField
        label="Accept Reward Credits"
        value={
          summary.acceptRewardCredits
            ? "Yes"
            : "No"
        }
      />

      <DisplayField
        label="Redemption Limit"
        value={
          summary.acceptRewardCredits
            ? formatPercent(
                summary.redemptionLimit
              )
            : "0%"
        }
      />

      <DisplayField
        label="Last Updated"
        value={formatDateTime(
          summary.updatedAt
        )}
      />

      <DisplayField
        label="Return to Normal"
        value={formatDateTime(
          summary.nextNormalUpdate
        )}
      />
    </div>
  );
}

/* ============================================================
 * Marketing Form
 * ============================================================
 */

function MarketingForm({
  form,
  setForm,
}: {
  form:
    MarketingFormState;

  setForm: Dispatch<
    SetStateAction<MarketingFormState>
  >;
}) {
  return (
    <div className="mt-7 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          label="Normal Budget"
          value={
            form.normalBudget
          }
          min={5}
          max={100}
          suffix="%"
          description="Permanent Marketing Budget. Minimum 5%."
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                normalBudget:
                  value,
              })
            )
          }
        />

        <ToggleField
          label="Enable Boost Budget"
          description="Temporarily increase the Marketing Budget for a selected period."
          checked={
            form.boostEnabled
          }
          onChange={(checked) =>
            setForm(
              (current) => ({
                ...current,
                boostEnabled:
                  checked,

                boostBudget:
                  checked &&
                  !current.boostBudget
                    ? current.normalBudget
                    : current.boostBudget,
              })
            )
          }
        />
      </div>

      {form.boostEnabled ? (
        <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />

            <div>
              <h3 className="text-sm font-semibold text-white">
                Boost Period
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                The system will use
                Normal Budget again when
                the Boost Period ends.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Boost Budget"
              value={
                form.boostBudget
              }
              min={5}
              max={100}
              suffix="%"
              description="Must be equal to or higher than Normal Budget."
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    boostBudget:
                      value,
                  })
                )
              }
            />

            <div className="hidden sm:block" />

            <DateTimeField
              label="Boost Start"
              value={
                form.boostStart
              }
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    boostStart:
                      value,
                  })
                )
              }
            />

            <DateTimeField
              label="Boost End"
              value={
                form.boostEnd
              }
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    boostEnd:
                      value,
                  })
                )
              }
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4 sm:p-5">
        <ToggleField
          label="Accept Reward Credits"
          description="Allow members to use Reward Credits when paying this merchant."
          checked={
            form.acceptRewardCredits
          }
          onChange={(checked) =>
            setForm(
              (current) => ({
                ...current,

                acceptRewardCredits:
                  checked,

                redemptionLimit:
                  checked
                    ? current.redemptionLimit ||
                      "30"
                    : "0",
              })
            )
          }
        />

        {form.acceptRewardCredits ? (
          <div className="mt-5 max-w-md">
            <NumberField
              label="Redemption Limit"
              value={
                form.redemptionLimit
              }
              min={0}
              max={100}
              suffix="%"
              description="Maximum percentage of a transaction that can be paid using Reward Credits."
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    redemptionLimit:
                      value,
                  })
                )
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
 * Boost Period Card
 * ============================================================
 */

function BoostPeriodCard({
  summary,
  boostStatus,
}: {
  summary:
    MerchantMarketingSummary;

  boostStatus:
    BoostStatus;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
            <CalendarClock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Boost Period
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Temporary Marketing Budget
              schedule
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${boostStatus.className}`}
        >
          {boostStatus.label}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DisplayField
          label="Boost Budget"
          value={
            summary.boostEnabled
              ? formatPercent(
                  summary.boostBudget
                )
              : "—"
          }
        />

        <DisplayField
          label="Starts"
          value={formatDateTime(
            summary.boostStart
          )}
        />

        <DisplayField
          label="Ends"
          value={formatDateTime(
            summary.boostEnd
          )}
        />

        <DisplayField
          label="Boost Count"
          value={formatNumber(
            summary.boostCount
          )}
        />
      </div>
    </section>
  );
}

/* ============================================================
 * Current Budget Card
 * ============================================================
 */

function CurrentBudgetCard({
  summary,
}: {
  summary:
    MerchantMarketingSummary;
}) {
  return (
    <section className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.10] to-slate-900/50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
        <Megaphone className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-400">
        Current Effective Budget
      </p>

      <p className="mt-2 text-4xl font-semibold text-white">
        {formatPercent(
          summary.currentBudget
        )}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {summary.boostActive
          ? "The temporary Boost Budget is currently active."
          : "The merchant's Normal Budget is currently active."}
      </p>

      <div className="mt-6 border-t border-white/[0.08] pt-5">
        <InfoRow
          label="Normal Budget"
          value={formatPercent(
            summary.normalBudget
          )}
        />

        <InfoRow
          label="Last Updated"
          value={formatDateTime(
            summary.updatedAt
          )}
        />

        <InfoRow
          label="Return to Normal"
          value={formatDateTime(
            summary.nextNormalUpdate
          )}
        />
      </div>
    </section>
  );
}

/* ============================================================
 * Reward Credits Card
 * ============================================================
 */

function RewardCreditsCard({
  summary,
}: {
  summary:
    MerchantMarketingSummary;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
          <CreditCard className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">
            Reward Credits
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Member redemption settings
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-1">
        <InfoRow
          label="Accepted"
          value={
            summary.acceptRewardCredits
              ? "Yes"
              : "No"
          }
        />

        <InfoRow
          label="Redemption Limit"
          value={
            summary.acceptRewardCredits
              ? formatPercent(
                  summary.redemptionLimit
                )
              : "0%"
          }
        />
      </div>
    </section>
  );
}

/* ============================================================
 * Marketing Rules
 * ============================================================
 */

function MarketingRules() {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <h2 className="text-base font-semibold text-white">
        Marketing Rules
      </h2>

      <div className="mt-5 space-y-4 text-sm leading-6 text-slate-500">
        <p>
          Normal Budget must be at least
          5%.
        </p>

        <p>
          Boost Budget temporarily
          replaces Normal Budget during
          the selected period.
        </p>

        <p>
          Boost Budget cannot be lower
          than Normal Budget.
        </p>

        <p>
          After the Boost Period ends,
          the payment engine uses Normal
          Budget again.
        </p>

        <p>
          Redemption Limit controls the
          maximum percentage payable
          using Reward Credits.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
 * Shared Components
 * ============================================================
 */

function MarketingStatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-slate-950/40 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function DisplayField({
  label,
  value,
  badgeClassName,
}: {
  label: string;
  value: string;
  badgeClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4">
      <p className="text-xs uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>

      {badgeClassName ? (
        <span
          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClassName}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 break-words text-sm font-semibold text-slate-200">
          {value}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4">
      <div>
        <p className="text-sm font-medium text-white">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked
            ? "bg-emerald-400"
            : "bg-slate-700",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
            checked
              ? "left-6"
              : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  suffix,
  description,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  suffix: string;
  description: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">
        {label}
      </span>

      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step="0.01"
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/45 px-4 pr-12 text-sm text-white outline-none transition focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10"
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
          {suffix}
        </span>
      </div>

      <span className="mt-2 block text-xs leading-5 text-slate-600">
        {description}
      </span>
    </label>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">
        {label}
      </span>

      <input
        type="datetime-local"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-slate-950/45 px-4 text-sm text-white outline-none transition focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-400/10"
      />
    </label>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span className="max-w-[210px] break-words text-right text-xs font-medium text-slate-400">
        {value}
      </span>
    </div>
  );
}

function MessageBox({
  type,
  message,
}: {
  type:
    | "error"
    | "success";
  message: string;
}) {
  const isSuccess =
    type === "success";

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        isSuccess
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-red-400/20 bg-red-400/10 text-red-200",
      ].join(" ")}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <span>{message}</span>
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================
 */

function createFormState(
  setting:
    AdminMerchantMarketingSetting | null,
  summary:
    MerchantMarketingSummary
): MarketingFormState {
  const normalBudget =
    setting?.normalBudget ??
    summary.normalBudget ??
    5;

  const boostEnabled =
    setting?.boostEnabled ??
    summary.boostEnabled ??
    false;

  const boostBudget =
    setting?.boostBudget ??
    summary.boostBudget ??
    normalBudget;

  const boostStart =
    setting?.boostStart ??
    summary.boostStart ??
    "";

  const boostEnd =
    setting?.boostEnd ??
    summary.boostEnd ??
    "";

  const acceptRewardCredits =
    setting?.acceptRewardCredits ??
    summary.acceptRewardCredits ??
    false;

  const redemptionLimit =
    setting?.redemptionLimit ??
    summary.redemptionLimit ??
    0;

  return {
    normalBudget:
      String(normalBudget),

    boostEnabled,

    boostBudget:
      String(boostBudget),

    boostStart:
      toDateTimeLocal(
        boostStart
      ),

    boostEnd:
      toDateTimeLocal(
        boostEnd
      ),

    acceptRewardCredits,

    redemptionLimit:
      String(redemptionLimit),
  };
}

function parseNumericInput(
  value: string
) {
  const normalized =
    String(value || "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

  if (!normalized) {
    return 0;
  }

  return Number(normalized);
}

function localDateTimeToIso(
  value: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toISOString();
}

function toDateTimeLocal(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        timezoneOffset *
          60_000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getTimestamp(
  value: string
) {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;
}

function formatPercent(
  value: number
) {
  return `${Number(
    value || 0
  ).toLocaleString(
    "en-MY",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(
    Number(value || 0)
  );
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}