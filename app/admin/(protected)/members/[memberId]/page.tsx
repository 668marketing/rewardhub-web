"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminMemberDetailData,
  getAdminMemberDetail,
} from "@/lib/admin-member-detail";
import MemberStatusAction from "@/components/admin/members/MemberStatusAction";
import MemberTierAction from "@/components/admin/members/MemberTierAction";
import MemberRewardCreditsAction from "@/components/admin/members/MemberRewardCreditsAction";
import MemberPointsAction from "@/components/admin/members/MemberPointsAction";
import MemberProfileAction from "@/components/admin/members/MemberProfileAction";
import MemberPasswordAction from "@/components/admin/members/MemberPasswordAction";

type TabKey =
  | "overview"
  | "transactions"
  | "points"
  | "referrals"
  | "cards"
  | "devices";

export default function AdminMemberDetailPage() {
  const params =
    useParams<{
      memberId: string;
    }>();

  const memberId =
    decodeURIComponent(
      String(params.memberId || "")
    );

  const [data, setData] =
    useState<AdminMemberDetailData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<TabKey>("overview");

  const [copiedValue, setCopiedValue] =
    useState("");

  const loadMember =
    useCallback(
      async (
        manualRefresh = false
      ) => {
        if (!memberId) {
          setError(
            "Member ID is missing."
          );
          setLoading(false);
          return;
        }

        try {
          setError("");

          if (manualRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const result =
            await getAdminMemberDetail(
              memberId
            );

          setData(result);
        } catch (loadError) {
          console.error(
            "Member detail load error:",
            loadError
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load member details."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [memberId]
    );

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const fullAddress =
    useMemo(() => {
      if (!data) {
        return "";
      }

      return [
        data.member.addressLine1,
        data.member.addressLine2,
        data.member.postcode,
        data.member.city,
        data.member.state,
        data.member.country,
      ]
        .filter(Boolean)
        .join(", ");
    }, [data]);

  async function copyValue(
    label: string,
    value: string
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopiedValue(label);

      window.setTimeout(() => {
        setCopiedValue("");
      }, 1800);
    } catch {
      setCopiedValue("");
    }
  }

  if (loading) {
    return <MemberDetailLoading />;
  }

  if (!data) {
    return (
      <MemberDetailError
        message={
          error ||
          "Member details are unavailable."
        }
        onRetry={() =>
          loadMember()
        }
      />
    );
  }

  const member = data.member;

  const tabs: Array<{
    key: TabKey;
    label: string;
    count?: number;
  }> = [
    {
      key: "overview",
      label: "Overview",
    },
    {
      key: "transactions",
      label: "Transactions",
      count:
        data.transactions.recent.length,
    },
    {
      key: "points",
      label: "Points",
      count:
        data.points.history.length,
    },
    {
      key: "referrals",
      label: "Referrals",
      count:
        data.referrals.history.length,
    },
    {
      key: "cards",
      label: "Card Applications",
      count:
        data.cardApplications.length,
    },
    {
      key: "devices",
      label: "Push Devices",
      count:
        data.pushSubscriptions.length,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1650px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/members"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to members
        </Link>

        <button
          type="button"
          onClick={() =>
            loadMember(true)
          }
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              refreshing
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          {refreshing
            ? "Refreshing…"
            : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <MemberAvatar
                fullName={member.fullName}
                profilePhotoUrl={
                  member.profilePhotoUrl
                }
                tier={member.tier}
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {member.fullName ||
                      "Unnamed Member"}
                  </h1>

                  <TierBadge
                    tier={member.tier}
                  />

                  <StatusBadge
                    status={member.status}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  RewardHub Member Account
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <CopyField
                    label="Member ID"
                    value={member.memberId}
                    copied={
                      copiedValue ===
                      "memberId"
                    }
                    onCopy={() =>
                      copyValue(
                        "memberId",
                        member.memberId
                      )
                    }
                  />

                  <CopyField
                    label="Card ID"
                    value={
                      member.cardId ||
                      "Not assigned"
                    }
                    copied={
                      copiedValue ===
                      "cardId"
                    }
                    onCopy={() =>
                      copyValue(
                        "cardId",
                        member.cardId
                      )
                    }
                    disabled={
                      !member.cardId
                    }
                  />

                  <CopyField
                    label="Referral Code"
                    value={
                      member.referralCode ||
                      "Unavailable"
                    }
                    copied={
                      copiedValue ===
                      "referralCode"
                    }
                    onCopy={() =>
                      copyValue(
                        "referralCode",
                        member.referralCode
                      )
                    }
                    disabled={
                      !member.referralCode
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[410px]">
              <HeaderMetric
                label="Registered"
                value={formatDateTime(
                  member.createdAt
                )}
                icon={CalendarDays}
              />

              <HeaderMetric
                label="Last Login"
                value={formatDateTime(
                  member.lastLoginAt || ""
                )}
                icon={Clock3}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-white/[0.07]">
          <div className="flex min-w-max px-3">
            {tabs.map((tab) => {
              const active =
                activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.key)
                  }
                  className={[
                    "relative flex h-14 items-center gap-2 px-4 text-sm font-medium transition",
                    active
                      ? "text-emerald-300"
                      : "text-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {tab.label}

                  {tab.count !==
                  undefined ? (
                    <span
                      className={[
                        "rounded-md px-1.5 py-0.5 text-[10px]",
                        active
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-white/[0.05] text-slate-600",
                      ].join(" ")}
                    >
                      {tab.count}
                    </span>
                  ) : null}

                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-400" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "overview" ? (
        <OverviewTab
  data={data}
  fullAddress={fullAddress}
  onMemberUpdated={() =>
    loadMember(true)
  }
/>
      ) : null}

      {activeTab ===
      "transactions" ? (
        <TransactionsTab
          data={data}
        />
      ) : null}

      {activeTab === "points" ? (
        <PointsTab data={data} />
      ) : null}

      {activeTab ===
      "referrals" ? (
        <ReferralsTab data={data} />
      ) : null}

      {activeTab === "cards" ? (
        <CardApplicationsTab
          data={data}
        />
      ) : null}

      {activeTab === "devices" ? (
        <PushDevicesTab data={data} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  data,
  fullAddress,
  onMemberUpdated,
}: {
  data: AdminMemberDetailData;
  fullAddress: string;
  onMemberUpdated: () => void;
}) {
  const member = data.member;

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Reward Credits"
            value={formatCurrency(
              data.referrals.summary
                .availableCommission
            )}
            note={`${formatCurrency(
              data.referrals.summary
                .totalCommission
            )} lifetime earned`}
            icon={WalletCards}
          />

          <MetricCard
            label="Current Points"
            value={formatNumber(
              data.points.summary
                .currentPoints
            )}
            note={`${formatNumber(
              data.points.summary
                .totalEarned
            )} lifetime earned`}
            icon={Star}
          />

          <MetricCard
            label="Lifetime Spend"
            value={formatCurrency(
              data.transactions.summary
                .totalSpend
            )}
            note={`${formatNumber(
              data.transactions.summary
                .totalTransactions
            )} completed transactions`}
            icon={CircleDollarSign}
          />

          <MetricCard
            label="Total Cashback"
            value={formatCurrency(
              data.transactions.summary
                .totalCashback
            )}
            note={`${formatCurrency(
              data.transactions.summary
                .rewardCreditsUsed
            )} credits used`}
            icon={Gift}
          />
        </section>

        <InformationCard
          title="Personal Information"
          description="Member contact and identity information"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InformationRow
              icon={Mail}
              label="Email"
              value={
                member.email ||
                "Not provided"
              }
            />

            <InformationRow
              icon={Phone}
              label="Phone"
              value={
                member.phone ||
                "Not provided"
              }
            />

            <InformationRow
              icon={CalendarDays}
              label="Date of Birth"
              value={formatDate(
                member.dateOfBirth || ""
              )}
            />

            <InformationRow
              icon={UserRound}
              label="Gender"
              value={
                member.gender ||
                "Not provided"
              }
            />

            <div className="md:col-span-2">
              <InformationRow
                icon={MapPin}
                label="Address"
                value={
                  fullAddress ||
                  "No address provided"
                }
              />
            </div>
          </div>
        </InformationCard>

        <InformationCard
          title="Referral Information"
          description="Sponsor and Reward Credit relationship"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InformationRow
              icon={Users}
              label="Referred By Member"
              value={
                member.referredByMemberId ||
                "Direct registration"
              }
            />

            <InformationRow
              icon={Store}
              label="Referred By Merchant"
              value={
                member.referredByMerchantId ||
                "Not referred by merchant"
              }
            />

            <InformationRow
              icon={Gift}
              label="Available Reward Credits"
              value={formatCurrency(
                data.referrals.summary
                  .availableCommission
              )}
            />

            <InformationRow
              icon={CircleDollarSign}
              label="Lifetime Commission"
              value={formatCurrency(
                data.referrals.summary
                  .totalCommission
              )}
            />
          </div>
        </InformationCard>
      </div>

      <div className="space-y-6">
        <InformationCard
          title="Account Summary"
          description="Membership and account activity"
        >
          <div className="space-y-1">
            <DetailRow
              label="Member ID"
              value={member.memberId}
            />

            <DetailRow
              label="Card ID"
              value={
                member.cardId ||
                "Not assigned"
              }
            />

            <DetailRow
              label="Referral Code"
              value={
                member.referralCode ||
                "Unavailable"
              }
            />

            <DetailRow
              label="Tier"
              value={member.tier}
            />

            <DetailRow
              label="Status"
              value={member.status}
            />

            <DetailRow
              label="Registered"
              value={formatDateTime(
                member.createdAt
              )}
            />

            <DetailRow
              label="Last Transaction"
              value={formatDateTime(
                data.transactions.summary
                  .lastTransactionAt
              )}
            />

            <DetailRow
              label="Last Login"
              value={formatDateTime(
                member.lastLoginAt || ""
              )}
            />
          </div>
        </InformationCard>

        <InformationCard
          title="Connected Services"
          description="Member cards and push devices"
        >
          <div className="space-y-3">
            <ConnectedService
              icon={CreditCard}
              title="Card Applications"
              value={
                data.cardApplications
                  .length
              }
            />

            <ConnectedService
              icon={Smartphone}
              title="Push Devices"
              value={
                data.pushSubscriptions
                  .filter(
                    (item) =>
                      item.status ===
                      "ACTIVE"
                  ).length
              }
            />

            <ConnectedService
              icon={ReceiptText}
              title="Recent Transactions"
              value={
                data.transactions.recent
                  .length
              }
            />

            <ConnectedService
              icon={Users}
              title="Referral Records"
              value={
                data.referrals.history
                  .length
              }
            />
          </div>
        </InformationCard>

        <section className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Admin Actions
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Management controls will
                be enabled in the next phase
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
  <MemberStatusAction
    memberId={member.memberId}
    memberName={
      member.fullName ||
      member.memberId
    }
    currentStatus={member.status}
    onSuccess={onMemberUpdated}
  />

  <MemberTierAction
    memberId={member.memberId}
    memberName={
      member.fullName ||
      member.memberId
    }
    currentTier={member.tier}
    onSuccess={onMemberUpdated}
  />

  <MemberRewardCreditsAction
    memberId={member.memberId}
    memberName={
      member.fullName ||
      member.memberId
    }
    currentBalance={
      data.referrals.summary
        .availableCommission
    }
    onSuccess={onMemberUpdated}
  />

  <MemberPointsAction
  memberId={member.memberId}
  memberName={
    member.fullName ||
    member.memberId
  }
  currentPoints={
    data.points.summary
      .currentPoints
  }
  onSuccess={
    onMemberUpdated
  }
/>

<MemberProfileAction
  memberId={member.memberId}
  member={{
    fullName:
      member.fullName,
    email:
      member.email,
    phone:
      member.phone,
    dateOfBirth:
      member.dateOfBirth,
    gender:
      member.gender,
    addressLine1:
      member.addressLine1,
    addressLine2:
      member.addressLine2,
    city:
      member.city,
    state:
      member.state,
    postcode:
      member.postcode,
    country:
      member.country,
  }}
  onSuccess={
    onMemberUpdated
  }
/>

  <MemberPasswordAction
  memberId={
    member.memberId
  }
  memberName={
    member.fullName ||
    member.memberId
  }
  onSuccess={
    onMemberUpdated
  }
/>
</div>
        </section>
      </div>
    </div>
  );
}

function TransactionsTab({
  data,
}: {
  data: AdminMemberDetailData;
}) {
  const transactions =
    data.transactions.recent;

  return (
    <ContentCard
      title="Recent Transactions"
      description="Latest member purchase and payment activity"
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions found"
          description="Completed member transactions will appear here."
        />
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {transactions.map(
            (transaction, index) => (
              <div
                key={[
                  transaction.transactionId,
                  transaction.referenceNo,
                  transaction.createdAt,
                  index,
                ].join("-")}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <ReceiptText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {transaction.merchantName ||
                        transaction.merchantId ||
                        "Merchant"}
                    </p>

                    <StatusBadge
                      status={
                        transaction.status
                      }
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {transaction.transactionId ||
                      transaction.referenceNo ||
                      "No reference"}
                    {" · "}
                    {transaction.paymentMethod ||
                      "Unknown method"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8">
                  <TransactionAmount
                    label="Amount"
                    value={formatCurrency(
                      transaction.amount
                    )}
                  />

                  <TransactionAmount
                    label="Cashback"
                    value={formatCurrency(
                      transaction.cashback
                    )}
                  />

                  <TransactionAmount
                    label="Credits Used"
                    value={formatCurrency(
                      transaction
                        .rewardCreditsUsed
                    )}
                  />

                  <TransactionAmount
                    label="Date"
                    value={formatDateTime(
                      transaction.createdAt
                    )}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </ContentCard>
  );
}

function PointsTab({
  data,
}: {
  data: AdminMemberDetailData;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Current Points"
          value={formatNumber(
            data.points.summary
              .currentPoints
          )}
          note="Available points balance"
          icon={Star}
        />

        <MetricCard
          label="Total Earned"
          value={formatNumber(
            data.points.summary
              .totalEarned
          )}
          note="Lifetime points earned"
          icon={CheckCircle2}
        />

        <MetricCard
          label="Total Redeemed"
          value={formatNumber(
            data.points.summary
              .totalRedeemed
          )}
          note="Lifetime points redeemed"
          icon={Gift}
        />
      </section>

      <ContentCard
        title="Points History"
        description="Latest points credits and deductions"
      >
        {data.points.history.length ===
        0 ? (
          <EmptyState
            icon={Star}
            title="No points history"
            description="Points activity will appear here."
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data.points.history.map(
              (item, index) => (
                <div
                  key={[
                    item.historyId,
                    item.createdAt,
                    index,
                  ].join("-")}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {item.description ||
                        item.type ||
                        "Points activity"}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {item.referenceId ||
                        "No reference"}
                      {" · "}
                      {formatDateTime(
                        item.createdAt
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p
                      className={[
                        "text-sm font-semibold",
                        item.points >= 0
                          ? "text-emerald-300"
                          : "text-red-300",
                      ].join(" ")}
                    >
                      {item.points >= 0
                        ? "+"
                        : ""}
                      {formatNumber(
                        item.points
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Balance{" "}
                      {formatNumber(
                        item.balanceAfter
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </ContentCard>
    </div>
  );
}

function ReferralsTab({
  data,
}: {
  data: AdminMemberDetailData;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Available Credits"
          value={formatCurrency(
            data.referrals.summary
              .availableCommission
          )}
          note="Available for member use"
          icon={WalletCards}
        />

        <MetricCard
          label="Lifetime Commission"
          value={formatCurrency(
            data.referrals.summary
              .totalCommission
          )}
          note="Referral commission earned"
          icon={CircleDollarSign}
        />

        <MetricCard
          label="Used or Paid"
          value={formatCurrency(
            data.referrals.summary
              .totalPaid
          )}
          note="Credits previously used"
          icon={Gift}
        />
      </section>

      <ContentCard
        title="Referral Commission History"
        description="Latest Level 1, Level 2 and Level 3 rewards"
      >
        {data.referrals.history.length ===
        0 ? (
          <EmptyState
            icon={Users}
            title="No referral commission"
            description="Referral commission records will appear here."
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data.referrals.history.map(
              (item, index) => (
                <div
                  key={[
                    item.historyId,
                    item.transactionId,
                    item.createdAt,
                    index,
                  ].join("-")}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {item.sourceMemberId ||
                        "Referral commission"}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Level{" "}
                      {item.level ||
                        "Unknown"}
                      {" · "}
                      {item.transactionId ||
                        "No transaction"}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-semibold text-emerald-300">
                      +
                      {formatCurrency(
                        item.amount
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {formatDateTime(
                        item.createdAt
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </ContentCard>
    </div>
  );
}

function CardApplicationsTab({
  data,
}: {
  data: AdminMemberDetailData;
}) {
  return (
    <ContentCard
      title="Card Applications"
      description="Physical membership card requests and delivery status"
    >
      {data.cardApplications.length ===
      0 ? (
        <EmptyState
          icon={CreditCard}
          title="No card applications"
          description="Member card applications will appear here."
        />
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {data.cardApplications.map(
            (application, index) => (
              <div
                key={[
                  application.applicationId,
                  application.createdAt,
                  index,
                ].join("-")}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {application.applicationType ||
                        "Member Card"}
                    </p>

                    <StatusBadge
                      status={
                        application.status
                      }
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {application.applicationId ||
                      "No application ID"}
                    {" · "}
                    {formatDateTime(
                      application.createdAt
                    )}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-600">
                    Tracking Number
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-300">
                    {application.trackingNumber ||
                      "Not available"}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </ContentCard>
  );
}

function PushDevicesTab({
  data,
}: {
  data: AdminMemberDetailData;
}) {
  return (
    <ContentCard
      title="Push Notification Devices"
      description="Browsers and installed PWA devices subscribed to notifications"
    >
      {data.pushSubscriptions.length ===
      0 ? (
        <EmptyState
          icon={Bell}
          title="No push subscriptions"
          description="The member has not enabled RewardHub push notifications."
        />
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {data.pushSubscriptions.map(
            (subscription, index) => (
              <div
                key={[
                  subscription.subscriptionId,
                  subscription.endpoint,
                  index,
                ].join("-")}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
                  <Smartphone className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {detectDeviceName(
                        subscription.userAgent
                      )}
                    </p>

                    <StatusBadge
                      status={
                        subscription.status
                      }
                    />
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-600">
                    {subscription.userAgent ||
                      "Unknown browser"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-600">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {formatDateTime(
                      subscription.updatedAt ||
                        subscription.createdAt
                    )}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </ContentCard>
  );
}

function MemberAvatar({
  fullName,
  profilePhotoUrl,
  tier,
}: {
  fullName: string;
  profilePhotoUrl?: string;
  tier: string;
}) {
  if (profilePhotoUrl) {
    return (
      <img
        src={profilePhotoUrl}
        alt={fullName}
        className="h-24 w-24 shrink-0 rounded-3xl border border-white/[0.09] object-cover"
      />
    );
  }

  const normalizedTier =
    tier.toUpperCase();

  const style =
    normalizedTier === "PLATINUM"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
      : normalizedTier === "GOLD"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-400/15 bg-slate-400/10 text-slate-300";

  return (
    <div
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border text-2xl font-semibold uppercase ${style}`}
    >
      {getInitials(fullName)}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <article className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-650">
        {note}
      </p>
    </article>
  );
}

function HeaderMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-600">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  copied,
  onCopy,
  disabled = false,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-slate-950/35 px-3 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-default"
    >
      <span className="text-slate-600">
        {label}
      </span>

      <span className="max-w-40 truncate font-medium text-slate-300">
        {value}
      </span>

      {!disabled ? (
        copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )
      ) : null}
    </button>
  );
}

function InformationCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.07] bg-white/[0.03]">
      <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
        <h2 className="font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function InformationRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/30 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-white/[0.055] py-3.5 last:border-b-0">
      <p className="text-sm text-slate-600">
        {label}
      </p>

      <p className="max-w-[65%] break-words text-right text-sm font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function ConnectedService({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-slate-950/30 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.045] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <p className="min-w-0 flex-1 text-sm text-slate-400">
        {title}
      </p>

      <span className="text-lg font-semibold text-white">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function ContentCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03]">
      <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
        <h2 className="font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function TransactionAmount({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-700">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-slate-600">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-sm font-medium text-slate-300">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function TierBadge({
  tier,
}: {
  tier: string;
}) {
  const normalized =
    tier.toUpperCase();

  const style =
    normalized === "PLATINUM"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
      : normalized === "GOLD"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-slate-400/15 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {normalized || "SILVER"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  const style =
    normalized === "ACTIVE" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS" ||
    normalized === "APPROVED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : normalized === "PENDING" ||
          normalized === "PROCESSING"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : normalized === "SUSPENDED" ||
            normalized === "REJECTED" ||
            normalized === "FAILED"
          ? "border-red-400/20 bg-red-400/10 text-red-300"
          : "border-slate-400/15 bg-slate-400/10 text-slate-400";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

function MemberDetailLoading() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035]">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Loading member details…
        </p>
      </div>
    </div>
  );
}

function MemberDetailError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-lg font-semibold text-white">
          Unable to load member
        </h1>

        <p className="mt-3 text-sm leading-6 text-red-200">
          {message}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/admin/members"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-300/20 px-4 text-sm text-red-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Members
          </Link>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-300 px-5 text-sm font-semibold text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(
  fullName: string
) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "MB";
  }

  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function detectDeviceName(
  userAgent: string
) {
  const value =
    userAgent.toLowerCase();

  if (
    value.includes("iphone") ||
    value.includes("ipad")
  ) {
    return "Apple iOS Device";
  }

  if (value.includes("android")) {
    return "Android Device";
  }

  if (value.includes("macintosh")) {
    return "Mac Browser";
  }

  if (value.includes("windows")) {
    return "Windows Browser";
  }

  return "Web Browser";
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY"
  ).format(Number(value || 0));
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-MY",
    {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}

function formatDate(
  value: string
) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
    }
  ).format(date);
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}