"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  Coins,
  Gift,
  Globe2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

import {
  type AdminSystemSetting,
  formatAdminSettingDate,
  getAdminSystemSettings,
  updateAdminSystemSettings,
} from "@/lib/admin-settings";

const CATEGORY_ORDER = [
  "GENERAL",
  "MEMBER",
  "MERCHANT",
  "REWARDS",
  "REFERRAL",
  "SECURITY",
  "NOTIFICATIONS",
  "SYSTEM",
];

const CATEGORY_META: Record<
  string,
  {
    title: string;
    description: string;
    icon: typeof Settings2;
  }
> = {
  GENERAL: {
    title: "General",
    description:
      "Core RewardHub identity, locale and support information.",
    icon: Globe2,
  },
  MEMBER: {
    title: "Members",
    description:
      "Membership tiers, spending thresholds and cashback rates.",
    icon: Users,
  },
  MERCHANT: {
    title: "Merchants",
    description:
      "Merchant participation and minimum marketing requirements.",
    icon: Building2,
  },
  REWARDS: {
    title: "Rewards & Points",
    description:
      "Points earning and platform reward configuration.",
    icon: Gift,
  },
  REFERRAL: {
    title: "Referral",
    description:
      "Referral allocation percentages for each network level.",
    icon: Coins,
  },
  SECURITY: {
    title: "Security",
    description:
      "Administrator session, lock and authentication controls.",
    icon: LockKeyhole,
  },
  NOTIFICATIONS: {
    title: "Notifications",
    description:
      "Platform notification delivery controls.",
    icon: Bell,
  },
  SYSTEM: {
    title: "System",
    description:
      "Maintenance and platform-wide operational controls.",
    icon: Wrench,
  },
};

type DraftValues = Record<
  string,
  string | number | boolean
>;

function comparable(
  setting: AdminSystemSetting,
  value: string | number | boolean
) {
  if (setting.valueType === "BOOLEAN") {
    return value === true;
  }

  if (
    setting.valueType === "NUMBER" ||
    setting.valueType === "PERCENT"
  ) {
    const number = Number(value);
    return Number.isFinite(number)
      ? number
      : 0;
  }

  return String(value ?? "").trim();
}

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<AdminSystemSetting[]>([]);

  const [draft, setDraft] =
    useState<DraftValues>({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [canUpdate, setCanUpdate] =
    useState(false);

  const load = useCallback(
    async () => {
      try {
        setLoading(true);
        setFeedback("");

        const result =
          await getAdminSystemSettings();

        setSettings(result.items);
        setCanUpdate(
          result.canUpdate
        );

        const nextDraft:
          DraftValues = {};

        result.items.forEach(
          (setting) => {
            nextDraft[
              setting.key
            ] =
              setting.value;
          }
        );

        setDraft(nextDraft);
        setReason("");
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to load system settings."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const groupedSettings =
    useMemo(() => {
      const groups: Record<
        string,
        AdminSystemSetting[]
      > = {};

      settings.forEach(
        (setting) => {
          const category =
            setting.category ||
            "OTHER";

          groups[category] ||= [];
          groups[category].push(
            setting
          );
        }
      );

      return groups;
    }, [settings]);

  const changedSettings =
    useMemo(
      () =>
        settings.filter(
          (setting) =>
            comparable(
              setting,
              draft[setting.key]
            ) !==
            comparable(
              setting,
              setting.value
            )
        ),
      [draft, settings]
    );

  const isDirty =
    changedSettings.length >
    0;

  function updateValue(
    key: string,
    value:
      | string
      | number
      | boolean
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
  }

  function resetChanges() {
    const nextDraft:
      DraftValues = {};

    settings.forEach(
      (setting) => {
        nextDraft[setting.key] =
          setting.value;
      }
    );

    setDraft(nextDraft);
    setReason("");
    setFeedback("");
    setSuccess("");
  }

  async function save() {
    if (!canUpdate) {
      setFeedback(
        "You do not have permission to update system settings."
      );
      return;
    }

    if (!isDirty) {
      setFeedback(
        "No system setting changes were detected."
      );
      return;
    }

    if (!reason.trim()) {
      setFeedback(
        "Please enter a reason for changing system settings."
      );
      return;
    }

    try {
      setSaving(true);
      setFeedback("");
      setSuccess("");

      const result =
        await updateAdminSystemSettings(
          {
            settings:
              changedSettings.map(
                (setting) => ({
                  key:
                    setting.key,
                  value:
                    draft[
                      setting.key
                    ],
                })
              ),
            reason:
              reason.trim(),
          }
        );

      setSuccess(
        result.updated
          ? `${result.changedCount} system setting(s) updated successfully.`
          : "No system setting changes were detected."
      );

      await load();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to save system settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-full bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Settings2 className="h-4 w-4" />
              System Configuration
            </div>

            <h1 className="mt-3 text-4xl font-black">
              Settings
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Manage RewardHub platform rules, membership thresholds, security controls and operational preferences.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                loading ||
                saving
              }
              onClick={() =>
                void load()
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-5 font-bold transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              disabled={
                saving ||
                !isDirty
              }
              onClick={
                resetChanges
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-amber-400/25 px-5 font-bold text-amber-300 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Changes
            </button>
          </div>
        </header>

        {feedback ? (
          <Message
            error
            text={feedback}
          />
        ) : null}

        {success ? (
          <Message
            text={success}
          />
        ) : null}

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Available Settings"
            value={
              settings.length
            }
            icon={Settings2}
          />

          <SummaryCard
            label="Changed"
            value={
              changedSettings.length
            }
            icon={RefreshCw}
          />

          <SummaryCard
            label="Access"
            value={
              canUpdate
                ? "View & Edit"
                : "View Only"
            }
            icon={ShieldCheck}
          />
        </section>

        {loading ? (
          <div className="mt-7 flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-300" />
              <p className="mt-4 text-slate-400">
                Loading system settings...
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-6">
            {CATEGORY_ORDER.map(
              (category) => {
                const items =
                  groupedSettings[
                    category
                  ] || [];

                if (
                  items.length ===
                  0
                ) {
                  return null;
                }

                const meta =
                  CATEGORY_META[
                    category
                  ];

                const Icon =
                  meta.icon;

                return (
                  <section
                    key={category}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60"
                  >
                    <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-xl font-black">
                            {meta.title}
                          </h2>

                          <p className="mt-1 text-sm text-slate-400">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {items.length} setting(s)
                      </div>
                    </div>

                    {category === "MEMBER" ? (
                      <MemberSettingsLayout
                        items={items}
                        draft={draft}
                        disabled={
                          !canUpdate ||
                          saving
                        }
                        changedKeys={
                          new Set(
                            changedSettings.map(
                              (setting) =>
                                setting.key
                            )
                          )
                        }
                        onChange={
                          updateValue
                        }
                      />
                    ) : (
                      <div className="grid gap-5 p-6 lg:grid-cols-2">
                        {items.map(
                          (setting) => (
                            <SettingField
                              key={
                                setting.key
                              }
                              setting={
                                setting
                              }
                              value={
                                draft[
                                  setting.key
                                ]
                              }
                              disabled={
                                !canUpdate ||
                                saving
                              }
                              changed={
                                changedSettings.some(
                                  (
                                    changed
                                  ) =>
                                    changed.key ===
                                    setting.key
                                )
                              }
                              onChange={(
                                value
                              ) =>
                                updateValue(
                                  setting.key,
                                  value
                                )
                              }
                            />
                          )
                        )}
                      </div>
                    )}
                  </section>
                );
              }
            )}

            <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                  <CalendarClock className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-black">
                    Change Reason
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Required for every settings update and stored in the administrator audit log.
                  </p>
                </div>
              </div>

              <textarea
                value={reason}
                onChange={(
                  event
                ) =>
                  setReason(
                    event.target.value
                  )
                }
                disabled={
                  !canUpdate ||
                  saving
                }
                maxLength={500}
                rows={4}
                placeholder="Example: Update tier thresholds for the new RewardHub policy."
                className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="mt-2 text-right text-xs text-slate-500">
                {reason.length}/500
              </div>
            </section>

            <div className="sticky bottom-4 z-20 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-white">
                    {isDirty
                      ? `${changedSettings.length} unsaved change(s)`
                      : "All settings are up to date"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Changes are saved to Google Sheets and recorded in the audit log.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !canUpdate ||
                    !isDirty ||
                    !reason.trim()
                  }
                  onClick={() =>
                    void save()
                  }
                  className="inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : !canUpdate ? (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      View Only
                    </>
                  ) : !reason.trim() &&
                    isDirty ? (
                    <>
                      <Save className="h-4 w-4" />
                      Enter Reason First
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


type MemberSettingsLayoutProps = {
  items: AdminSystemSetting[];
  draft: DraftValues;
  disabled: boolean;
  changedKeys: Set<string>;
  onChange: (
    key: string,
    value: string | number | boolean
  ) => void;
};

const MEMBER_SETTING_GROUPS = [
  {
    id: "DEFAULT",
    title: "Default Membership",
    description:
      "The membership tier automatically assigned to every newly registered member.",
    keys: [
      "member.default_tier",
    ],
    badgeClass:
      "border-slate-400/20 bg-slate-400/10 text-slate-300",
  },
  {
    id: "SILVER",
    title: "Silver Tier",
    description:
      "Entry-level membership benefits for all new RewardHub members.",
    keys: [
      "member.silver_cashback",
    ],
    badgeClass:
      "border-slate-300/25 bg-slate-300/10 text-slate-200",
  },
  {
    id: "GOLD",
    title: "Gold Tier",
    description:
      "Lifetime spending requirement and cashback benefit for Gold members.",
    keys: [
      "member.gold_threshold",
      "member.gold_cashback",
    ],
    badgeClass:
      "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  {
    id: "PLATINUM",
    title: "Platinum Tier",
    description:
      "Lifetime spending requirement and cashback benefit for Platinum members.",
    keys: [
      "member.platinum_threshold",
      "member.platinum_cashback",
    ],
    badgeClass:
      "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  },
] as const;

function MemberSettingsLayout({
  items,
  draft,
  disabled,
  changedKeys,
  onChange,
}: MemberSettingsLayoutProps) {
  const itemMap = new Map(
    items.map((setting) => [
      setting.key,
      setting,
    ])
  );

  const groupedKeys: Set<string> = new Set(
    MEMBER_SETTING_GROUPS.flatMap(
      (group) => [...group.keys]
    )
  );

  const remainingItems =
    items.filter(
      (setting) =>
        !groupedKeys.has(
          setting.key
        )
    );

  return (
    <div className="space-y-5 p-6">
      {MEMBER_SETTING_GROUPS.map(
        (group) => {
          const groupItems =
            group.keys
              .map((key) =>
                itemMap.get(key)
              )
              .filter(
                (
                  setting
                ): setting is AdminSystemSetting =>
                  Boolean(setting)
              );

          if (
            groupItems.length === 0
          ) {
            return null;
          }

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/25"
            >
              <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-black text-white">
                      {group.title}
                    </h3>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                        group.badgeClass,
                      ].join(" ")}
                    >
                      {group.id}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {group.description}
                  </p>
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  {groupItems.length} setting(s)
                </span>
              </div>

              <div
                className={[
                  "grid gap-5 p-5",
                  groupItems.length > 1
                    ? "lg:grid-cols-2"
                    : "grid-cols-1",
                ].join(" ")}
              >
                {groupItems.map(
                  (setting) => (
                    <SettingField
                      key={setting.key}
                      setting={setting}
                      value={
                        draft[
                          setting.key
                        ]
                      }
                      disabled={disabled}
                      changed={
                        changedKeys.has(
                          setting.key
                        )
                      }
                      onChange={(
                        value
                      ) =>
                        onChange(
                          setting.key,
                          value
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          );
        }
      )}

      {remainingItems.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/25">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h3 className="text-lg font-black text-white">
              Additional Member Settings
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Other membership settings that are not assigned to a tier group.
            </p>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {remainingItems.map(
              (setting) => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  value={
                    draft[
                      setting.key
                    ]
                  }
                  disabled={disabled}
                  changed={
                    changedKeys.has(
                      setting.key
                    )
                  }
                  onChange={(
                    value
                  ) =>
                    onChange(
                      setting.key,
                      value
                    )
                  }
                />
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value:
    | string
    | number;
  icon:
    typeof Settings2;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function Message({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <div
      className={[
        "mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold",
        error
          ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function SettingField({
  setting,
  value,
  disabled,
  changed,
  onChange,
}: {
  setting:
    AdminSystemSetting;
  value:
    | string
    | number
    | boolean;
  disabled:
    boolean;
  changed:
    boolean;
  onChange: (
    value:
      | string
      | number
      | boolean
  ) => void;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 transition",
        changed
          ? "border-amber-400/25 bg-amber-400/[0.04]"
          : "border-white/[0.07] bg-slate-950/35",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="font-bold text-white">
            {setting.label}
          </label>

          <p className="mt-1 font-mono text-[11px] text-slate-600">
            {setting.key}
          </p>
        </div>

        {changed ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300">
            Changed
          </span>
        ) : null}
      </div>

      {setting.valueType ===
      "BOOLEAN" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(
              value !== true
            )
          }
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-semibold">
            {value === true
              ? "Enabled"
              : "Disabled"}
          </span>

          <span
            className={[
              "relative h-7 w-12 rounded-full transition",
              value === true
                ? "bg-emerald-400"
                : "bg-slate-700",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                value === true
                  ? "left-6"
                  : "left-1",
              ].join(" ")}
            />
          </span>
        </button>
      ) : (
        <div className="relative">
          <input
            type={
              setting.valueType ===
              "EMAIL"
                ? "email"
                : setting.valueType ===
                      "NUMBER" ||
                    setting.valueType ===
                      "PERCENT"
                  ? "number"
                  : "text"
            }
            step={
              setting.valueType ===
              "PERCENT"
                ? "0.1"
                : setting.valueType ===
                    "NUMBER"
                  ? "1"
                  : undefined
            }
            value={
              String(
                value ?? ""
              )
            }
            disabled={disabled}
            onChange={(
              event
            ) =>
              onChange(
                event.target.value
              )
            }
            className={[
              "mt-3 h-12 w-full rounded-2xl border bg-slate-950/70 px-4 text-white outline-none transition",
              changed
                ? "border-amber-400/50"
                : "border-white/10 focus:border-emerald-400/50",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "",
            ].join(" ")}
          />

          {setting.valueType ===
          "PERCENT" ? (
            <span className="pointer-events-none absolute right-4 top-[27px] text-sm font-bold text-slate-500">
              %
            </span>
          ) : null}
        </div>
      )}

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {setting.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <span>
          Type:{" "}
          {setting.valueType}
        </span>

        <span>
          Updated:{" "}
          {formatAdminSettingDate(
            setting.updatedAt
          )}
        </span>
      </div>
    </div>
  );
}