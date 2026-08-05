"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";

import {
  AdminCampaign,
  CampaignTargetType,
  campaignAction,
  createAdminCampaign,
  formatCampaignDate,
  getAdminCampaignDashboard,
  getAdminCampaigns,
} from "@/lib/admin-campaigns";
import {
  sendAdminNotification,
} from "@/lib/admin-notifications";

const EMPTY_FORM = {
  campaignName: "",
  targetType:
    "ALL_MEMBERS" as CampaignTargetType,
  targetId: "",
  title: "",
  message: "",
  url: "",
  image: "",
  scheduledAt: "",
};

type CampaignSubmitAction =
  | "draft"
  | "schedule"
  | "send"
  | null;

export default function AdminCampaignsPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    items,
    setItems,
  ] =
    useState<AdminCampaign[]>([]);

  const [
    dashboard,
    setDashboard,
  ] =
    useState({
      total: 0,
      draft: 0,
      scheduled: 0,
      running: 0,
      completed: 0,
      cancelled: 0,
    });

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    drawerOpen,
    setDrawerOpen,
  ] =
    useState(false);

  const [
    selected,
    setSelected,
  ] =
    useState<AdminCampaign | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState(EMPTY_FORM);

  const [
    activeAction,
    setActiveAction,
  ] =
    useState<CampaignSubmitAction>(
      null
    );

  const isSubmitting =
    activeAction !== null;

  const [
    feedback,
    setFeedback,
  ] =
    useState("");

  async function load() {
  try {
    setLoading(true);
    setFeedback("");

    const [
      dashboardResult,
      listResult,
    ] =
      await Promise.all([
        getAdminCampaignDashboard(),
        getAdminCampaigns({
          search,
          status,
        }),
      ]);

    setDashboard(
      dashboardResult?.totals || {
        total: 0,
        draft: 0,
        scheduled: 0,
        running: 0,
        completed: 0,
        cancelled: 0,
      }
    );

    setItems(
      Array.isArray(
        listResult?.items
      )
        ? listResult.items
        : []
    );
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : "Unable to load campaigns."
    );
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    void load();
  }, [search, status]);

  const canUseTargetId =
    form.targetType ===
      "SPECIFIC_MEMBER" ||
    form.targetType ===
      "SPECIFIC_MERCHANT";

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFeedback("");
    setDrawerOpen(true);
  }

  function openDetail(
    campaign: AdminCampaign
  ) {
    setSelected(
      campaign
    );

    setForm({
      campaignName:
        campaign.campaignName,
      targetType:
        campaign.targetType as
          CampaignTargetType,
      targetId:
        campaign.targetId,
      title:
        campaign.title,
      message:
        campaign.message,
      url:
        campaign.url,
      image:
        campaign.image,
      scheduledAt:
        campaign.scheduledAt
          ? toLocalDateTime(
              campaign.scheduledAt
            )
          : "",
    });

    setDrawerOpen(true);
  }

  async function saveCampaign(
    nextStatus:
      | "DRAFT"
      | "SCHEDULED"
  ) {
    const nextAction:
      CampaignSubmitAction =
        nextStatus === "DRAFT"
          ? "draft"
          : "schedule";

    if (isSubmitting) {
      return;
    }

    try {
      setActiveAction(
        nextAction
      );
      setFeedback("");

      await createAdminCampaign({
        ...form,
        status:
          nextStatus,
        scheduledAt:
          nextStatus ===
          "SCHEDULED"
            ? new Date(
                form.scheduledAt
              ).toISOString()
            : "",
      });

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to save campaign."
      );
    } finally {
      setActiveAction(
        null
      );
    }
  }

  async function sendNow(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      setActiveAction(
        "send"
      );
      setFeedback("");

      const created =
        await createAdminCampaign({
          ...form,
          status:
            "DRAFT",
        });

      const result =
        await sendAdminNotification({
          targetType:
            form.targetType,
          targetId:
            form.targetId,
          title:
            form.title,
          message:
            form.message,
          url:
            form.url,
          image:
            form.image,
        });

      await campaignAction(
        created.campaign.campaignId,
        "complete",
        {
          attemptedCount:
            result.attemptedCount,
          sentCount:
            result.sentCount,
          failedCount:
            result.failedCount,
        }
      );

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to send campaign."
      );
    } finally {
      setActiveAction(
        null
      );
    }
  }

  async function duplicateSelected() {
    if (!selected) {
      return;
    }

    await campaignAction(
      selected.campaignId,
      "duplicate"
    );

    setDrawerOpen(false);
    await load();
  }

  async function cancelSelected() {
    if (!selected) {
      return;
    }

    if (
      !window.confirm(
        "Cancel this campaign?"
      )
    ) {
      return;
    }

    await campaignAction(
      selected.campaignId,
      "cancel"
    );

    setDrawerOpen(false);
    await load();
  }

  return (
    <div className="min-h-screen bg-[#030817] px-6 py-8 text-slate-200">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              Marketing Automation
            </p>

            <h1 className="mt-3 text-4xl font-black text-white">
              Campaigns
            </h1>

            <p className="mt-3 text-slate-500">
              Create, schedule and monitor RewardHub marketing campaigns.
            </p>
          </div>

          <div className="flex gap-3">
            <button
  type="button"
  disabled={loading}
  onClick={() => void load()}
  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-800 px-5 font-bold transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
>
  <RefreshCw
    className={`h-4 w-4 ${
      loading ? "animate-spin" : ""
    }`}
  />

  {loading ? "Refreshing..." : "Refresh"}
</button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-slate-950"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        {feedback ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {feedback}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Stat
            label="Total"
            value={
              dashboard.total
            }
          />
          <Stat
            label="Draft"
            value={
              dashboard.draft
            }
          />
          <Stat
            label="Scheduled"
            value={
              dashboard.scheduled
            }
          />
          <Stat
            label="Running"
            value={
              dashboard.running
            }
          />
          <Stat
            label="Completed"
            value={
              dashboard.completed
            }
          />
          <Stat
            label="Cancelled"
            value={
              dashboard.cancelled
            }
          />
        </div>

        <section className="mt-7 rounded-3xl border border-slate-800 bg-[#071126] p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-[#030817] px-4">
              <Search className="h-4 w-4 text-slate-600" />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search campaign, title or target"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-slate-800 bg-[#030817] px-4"
            >
              <option value="">
                All statuses
              </option>
              <option value="DRAFT">
                Draft
              </option>
              <option value="SCHEDULED">
                Scheduled
              </option>
              <option value="RUNNING">
                Running
              </option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-3xl border border-slate-800 bg-[#071126]">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-black text-white">
              Campaign Directory
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {Array.isArray(items)
                ? items.length
                : 0} campaigns
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading campaigns...
            </div>
          ) : !Array.isArray(items) ||
            items.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No campaigns found.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {(Array.isArray(items)
                ? items
                : []
              ).map(
                (campaign) => (
                  <button
                    type="button"
                    key={
                      campaign.campaignId
                    }
                    onClick={() =>
                      openDetail(
                        campaign
                      )
                    }
                    className="grid w-full gap-4 px-6 py-5 text-left transition hover:bg-white/[0.025] md:grid-cols-[1.5fr_1fr_160px_180px]"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {
                          campaign.campaignName
                        }
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {
                          campaign.title
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-300">
                        {
                          campaign.targetType
                        }
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {
                          campaign.targetId ||
                          "All recipients"
                        }
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        campaign.status
                      }
                    />

                    <div className="text-sm text-slate-500">
                      {formatCampaignDate(
                        campaign.scheduledAt ||
                        campaign.sentAt ||
                        campaign.updatedAt
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            onClick={() =>
              setDrawerOpen(false)
            }
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-slate-800 bg-[#050d1e]">
            <header className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  Campaigns
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {selected
                    ? selected.campaignName
                    : "New Campaign"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDrawerOpen(false)
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {selected &&
              (
                selected.status ===
                  "COMPLETED" ||
                selected.status ===
                  "CANCELLED"
              ) ? (
                <CampaignReadOnly
                  campaign={
                    selected
                  }
                />
              ) : (
                <form
                  id="campaign-form"
                  onSubmit={sendNow}
                  className="space-y-5"
                >
                  <Field
                    label="Campaign Name"
                    value={
                      form.campaignName
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        campaignName:
                          value,
                      })
                    }
                  />

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Target
                    </span>
                    <select
                      value={
                        form.targetType
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          targetType:
                            event.target.value as CampaignTargetType,
                          targetId:
                            "",
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-800 bg-[#030817] px-4"
                    >
                      <option value="ALL_MEMBERS">
                        All Members
                      </option>
                      <option value="ALL_MERCHANTS">
                        All Merchants
                      </option>
                      <option value="SPECIFIC_MEMBER">
                        Specific Member
                      </option>
                      <option value="SPECIFIC_MERCHANT">
                        Specific Merchant
                      </option>
                    </select>
                  </label>

                  {canUseTargetId ? (
                    <Field
                      label="Target ID"
                      value={
                        form.targetId
                      }
                      onChange={(value) =>
                        setForm({
                          ...form,
                          targetId:
                            value,
                        })
                      }
                    />
                  ) : null}

                  <Field
                    label="Notification Title"
                    value={
                      form.title
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        title:
                          value,
                      })
                    }
                  />

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Message
                    </span>
                    <textarea
                      value={
                        form.message
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          message:
                            event.target.value,
                        })
                      }
                      rows={6}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-[#030817] p-4 outline-none"
                    />
                  </label>

                  <Field
                    label="Destination URL"
                    value={
                      form.url
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        url:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Image URL"
                    value={
                      form.image
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        image:
                          value,
                      })
                    }
                  />

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Schedule Date & Time
                    </span>
                    <input
                      type="datetime-local"
                      value={
                        form.scheduledAt
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          scheduledAt:
                            event.target.value,
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-800 bg-[#030817] px-4"
                    />
                  </label>
                </form>
              )}
            </div>

            <footer className="grid gap-3 border-t border-slate-800 p-5 sm:grid-cols-2">
              {selected ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void duplicateSelected()
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 font-black text-slate-950"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>

                  {selected.status !==
                    "COMPLETED" &&
                  selected.status !==
                    "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void cancelSelected()
                      }
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 font-black text-red-300"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Campaign
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      void saveCampaign(
                        "DRAFT"
                      )
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-800 font-black transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeAction ===
                    "draft" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Draft...
                      </>
                    ) : (
                      "Save Draft"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      !form.scheduledAt
                    }
                    onClick={() =>
                      void saveCampaign(
                        "SCHEDULED"
                      )
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 font-black text-amber-300 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {activeAction ===
                    "schedule" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <CalendarClock className="h-4 w-4" />
                        Schedule
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    form="campaign-form"
                    disabled={
                      isSubmitting
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                  >
                    {activeAction ===
                    "send" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Now
                      </>
                    )}
                  </button>
                </>
              )}
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#071126] p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function Field({
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
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-12 w-full rounded-2xl border border-slate-800 bg-[#030817] px-4 outline-none"
      />
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const upper =
    String(
      status || ""
    ).toUpperCase();

  return (
    <span className="inline-flex h-10 w-28 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 text-center text-xs font-black text-emerald-300">
      {upper || "UNKNOWN"}
    </span>
  );
}

function CampaignReadOnly({
  campaign,
}: {
  campaign: AdminCampaign;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-800 bg-[#071126] p-5">
        <StatusBadge
          status={
            campaign.status
          }
        />

        <h3 className="mt-4 text-xl font-black text-white">
          {campaign.title}
        </h3>

        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
          {campaign.message}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Attempted"
          value={
            campaign.attemptedCount
          }
        />
        <Stat
          label="Sent"
          value={
            campaign.sentCount
          }
        />
        <Stat
          label="Failed"
          value={
            campaign.failedCount
          }
        />
      </div>
    </div>
  );
}

function toLocalDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
    offset * 60000
  )
    .toISOString()
    .slice(0, 16);
}