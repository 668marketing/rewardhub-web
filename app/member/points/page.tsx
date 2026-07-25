/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import {
  getMemberWalletSummary,
  getMemberPointsHistory,
  getMemberRewards,
  getRewardCategories,
  redeemMemberReward,
  type MemberRewardItem,
  type RewardCategoryItem,
} from "@/lib/api";

type RewardSort =
  | "DEFAULT"
  | "NEWEST"
  | "POINTS_LOW"
  | "POINTS_HIGH";

export default function PointsPage() {
  const [wallet, setWallet] =
    useState<any>(null);

    const [redeeming, setRedeeming] =
  useState(false);

const [
  redemptionMessage,
  setRedemptionMessage,
] = useState("");

  const [history, setHistory] =
    useState<any[]>([]);

  const [rewards, setRewards] =
    useState<MemberRewardItem[]>([]);

  const [categories, setCategories] =
    useState<RewardCategoryItem[]>([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState<RewardSort>("DEFAULT");

  const [
    selectedReward,
    setSelectedReward,
  ] =
    useState<MemberRewardItem | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const member = JSON.parse(
        localStorage.getItem("member") ||
          "{}"
      );

      const memberId =
        member?.memberId ||
        member?.MEMBER_ID;

      if (!memberId) {
        setError(
          "Member session not found. Please log in again."
        );
        return;
      }

      const [
        walletRes,
        historyRes,
        rewardsRes,
        categoriesRes,
      ] = await Promise.all([
        getMemberWalletSummary({
          memberId,
        }),

        getMemberPointsHistory({
          memberId,
          limit: 50,
        }),

        getMemberRewards({
          memberId,
          keyword: "",
          category: "",
          filter: "ALL",
          sort: "DEFAULT",
          limit: 500,
        }),

        getRewardCategories(),
      ]);

      const walletData =
        unwrapApiData(walletRes);

      const historyData =
        unwrapApiData(historyRes);

      const rewardsData =
        unwrapApiData(rewardsRes);

      const categoriesData =
        unwrapApiData(categoriesRes);

      setWallet(walletData || {});

      setHistory(
        Array.isArray(
          historyData?.history
        )
          ? historyData.history
          : []
      );

      setRewards(
        Array.isArray(
          rewardsData?.rewards
        )
          ? rewardsData.rewards
          : []
      );

      setCategories(
        Array.isArray(
          categoriesData?.categories
        )
          ? categoriesData.categories
          : []
      );
    } catch (err: any) {
      console.error(
        "Failed to load Points page:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your rewards."
      );

      setWallet({});
      setHistory([]);
      setRewards([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const currentPoints = Number(
    wallet?.currentPoints ||
      wallet?.points ||
      0
  );

  const totalEarned = Number(
    wallet?.totalPointsEarned ||
      wallet?.totalEarned ||
      currentPoints ||
      0
  );

  const redeemed = Number(
    wallet?.pointsRedeemed ||
      wallet?.totalRedeemed ||
      0
  );

  const rewardCredits = Number(
    wallet?.rewardCredits ||
      wallet?.rewardCreditBalance ||
      0
  );

  const cashbackSaved = Number(
    wallet?.cashbackSaved ||
      wallet?.totalCashback ||
      0
  );

  const newRewards = useMemo(() => {
    return rewards
      .filter(
        (reward) => reward.isNew
      )
      .sort(
        (a, b) =>
          parseDate(b.createdAt) -
          parseDate(a.createdAt)
      );
  }, [rewards]);

  const visibleRewards =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      let list = rewards.filter(
        (reward) => {
          if (
            selectedCategory === "New"
          ) {
            if (!reward.isNew) {
              return false;
            }
          } else if (
            selectedCategory !== "All"
          ) {
            if (
              reward.category
                .trim()
                .toLowerCase() !==
              selectedCategory
                .trim()
                .toLowerCase()
            ) {
              return false;
            }
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchText = [
            reward.title,
            reward.brand,
            reward.category,
            reward.description,
            reward.rewardType,
          ]
            .join(" ")
            .toLowerCase();

          return searchText.includes(
            normalizedSearch
          );
        }
      );

      list = [...list].sort(
        (a, b) => {
          if (sort === "NEWEST") {
            return (
              parseDate(
                b.createdAt
              ) -
              parseDate(
                a.createdAt
              )
            );
          }

          if (
            sort === "POINTS_LOW"
          ) {
            return (
              Number(
                a.pointsRequired
              ) -
              Number(
                b.pointsRequired
              )
            );
          }

          if (
            sort === "POINTS_HIGH"
          ) {
            return (
              Number(
                b.pointsRequired
              ) -
              Number(
                a.pointsRequired
              )
            );
          }

          if (
            a.isNew !== b.isNew
          ) {
            return a.isNew ? -1 : 1;
          }

          if (
            a.featured !==
            b.featured
          ) {
            return a.featured
              ? -1
              : 1;
          }

          if (
            a.isHot !== b.isHot
          ) {
            return a.isHot ? -1 : 1;
          }

          if (
            a.isRecommended !==
            b.isRecommended
          ) {
            return a.isRecommended
              ? -1
              : 1;
          }

          return (
            Number(
              a.sortOrder || 999999
            ) -
            Number(
              b.sortOrder || 999999
            )
          );
        }
      );

      return list;
    }, [
      rewards,
      search,
      selectedCategory,
      sort,
    ]);

    async function handleRedeemReward(
  reward: MemberRewardItem,
  shippingData?: {
    recipientName: string;
    phone: string;
    address: string;
  }
) {
  try {
    const member = JSON.parse(
      localStorage.getItem("member") ||
        "{}"
    );

    const memberId =
      member?.memberId ||
      member?.MEMBER_ID;

    if (!memberId) {
      throw new Error(
        "Member session not found"
      );
    }

    setRedeeming(true);
    setRedemptionMessage("");

    const result =
      await redeemMemberReward({
        memberId,
        rewardId:
          reward.rewardId,
        quantity: 1,
        recipientName:
          shippingData?.recipientName ||
          "",
        phone:
          shippingData?.phone || "",
        address:
          shippingData?.address ||
          "",
      });

    const resultData =
      unwrapApiData(result);

    let successMessage =
      `${reward.title} redeemed successfully.`;

    if (
      resultData?.voucherCode
    ) {
      successMessage +=
        ` Voucher Code: ${resultData.voucherCode}`;
    }

    setRedemptionMessage(
      successMessage
    );

    await loadPage();
  } catch (err: any) {
    const rawMessage = String(
  err?.message ||
    "Unable to redeem reward."
);

const safeMessage =
  rawMessage.includes(
    "Backend returned non-JSON"
  )
    ? "The reward service encountered an error. Please check your redemption history before trying again."
    : rawMessage;

setRedemptionMessage(
  safeMessage
);

    throw err;
  } finally {
    setRedeeming(false);
  }
}

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 pb-28 sm:px-6 sm:py-6 md:px-8 xl:px-12">
        <section className="mx-auto w-full max-w-7xl">
          <Link
            href="/member/dashboard"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to Dashboard
          </Link>

          <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-2xl sm:mt-6 sm:rounded-[2.5rem]">
            <div className="relative p-5 sm:p-7 md:p-9">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

              <p className="relative text-[10px] font-black uppercase tracking-[0.24em] text-amber-300 sm:text-xs">
                Rewards Wallet
              </p>

              <h1 className="relative mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Points & Rewards
              </h1>

              <p className="relative mt-3 max-w-2xl text-xs font-bold leading-5 text-slate-400 sm:text-sm sm:leading-6">
                Earn points when you spend
                with RewardHub merchants,
                then redeem official rewards
                prepared by RewardHub.
              </p>

              <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
                <StatCard
                  title="Current Points"
                  value={`${numberFormat(
                    currentPoints
                  )} pts`}
                  highlight
                />

                <StatCard
                  title="Reward Credits"
                  value={`RM${money(
                    rewardCredits
                  )}`}
                />

                <StatCard
                  title="Total Earned"
                  value={`${numberFormat(
                    totalEarned
                  )} pts`}
                />

                <StatCard
                  title="Cashback Saved"
                  value={`RM${money(
                    cashbackSaved
                  )}`}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 sm:mt-6 sm:rounded-3xl sm:p-5">
              <p className="text-sm font-black text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={loadPage}
                className="mt-3 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          <section className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 sm:text-xs">
                    Spendable Balance
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                    Reward Credits
                  </h2>
                </div>

                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                  <p className="text-[9px] font-black text-amber-300 sm:text-xs">
                    Available
                  </p>

                  <p className="mt-1 text-xl font-black sm:text-2xl">
                    RM
                    {money(
                      rewardCredits
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Reward Credits can offset
                payments at supported
                merchants. Points are used
                separately to redeem
                RewardHub official rewards.
              </p>

              <Link
                href="/member/pay"
                className="mt-5 block rounded-2xl bg-slate-950 px-4 py-3.5 text-center text-xs font-black text-white no-underline transition hover:bg-slate-800 sm:text-sm"
              >
                Use Reward Credits
              </Link>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 sm:text-xs">
                    Loyalty Points
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                    How Points Work
                  </h2>
                </div>

                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                  <p className="text-[9px] font-black text-amber-700 sm:text-xs">
                    Redeemed
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                    {numberFormat(
                      redeemed
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoRow
                  title="Earn Rate"
                  detail="RM1 eligible spending earns 1 point."
                />

                <InfoRow
                  title="Official Rewards"
                  detail="Only RewardHub rewards can be redeemed using points."
                />

                <InfoRow
                  title="Non-transferable"
                  detail="Points cannot be sent to another member."
                />

                <InfoRow
                  title="Separate Balance"
                  detail="Points and Reward Credits have different uses."
                />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">
                    🔥
                  </span>

                  <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                    New Rewards
                  </h2>
                </div>

                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                  Rewards uploaded within
                  the last 30 days appear
                  here automatically.
                </p>
              </div>

              {newRewards.length >
                0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(
                      "New"
                    );

                    document
                      .getElementById(
                        "all-rewards"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      });
                  }}
                  className="shrink-0 text-xs font-black text-amber-700 sm:text-sm"
                >
                  View All →
                </button>
              )}
            </div>

            {loading ? (
              <RewardSkeletonRow />
            ) : newRewards.length >
              0 ? (
              <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:mt-6 sm:gap-4 sm:px-7">
                {newRewards.map(
                  (reward) => (
                    <div
                      key={
                        reward.rewardId
                      }
                      className="w-[72%] min-w-[220px] max-w-[280px] snap-start sm:w-[280px]"
                    >
                      <RewardCard
                        reward={reward}
                        currentPoints={
                          currentPoints
                        }
                        compact
                        onOpen={() =>
                          setSelectedReward(
                            reward
                          )
                        }
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyRewards
                title="No new rewards yet"
                description="New rewards will automatically appear here for 30 days after they are uploaded."
              />
            )}
          </section>

          <section
            id="all-rewards"
            className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7"
          >
            <div>
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Browse Rewards
              </h2>

              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                Explore vouchers, digital
                rewards and physical gifts
                prepared by RewardHub.
              </p>
            </div>

            <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:mt-6 sm:gap-3 sm:px-7">
              {categories.map(
                (category) => {
                  const active =
                    selectedCategory ===
                    category.categoryName;

                  return (
                    <button
                      key={
                        category.categoryId
                      }
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category.categoryName
                        )
                      }
                      className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition sm:px-5 sm:py-3 sm:text-sm ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="mr-1.5">
                        {category.icon ||
                          "🎁"}
                      </span>

                      {
                        category.categoryName
                      }

                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[9px] ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {category.rewardCount ??
                          0}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-[1fr_auto] sm:gap-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">
                  🔍
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search rewards, categories or brands..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-xs font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:py-4 sm:text-sm"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as RewardSort
                  )
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-black text-slate-700 outline-none focus:border-slate-400 sm:min-w-[190px] sm:py-4 sm:text-sm"
              >
                <option value="DEFAULT">
                  Recommended
                </option>

                <option value="NEWEST">
                  Newest First
                </option>

                <option value="POINTS_LOW">
                  Points: Low to High
                </option>

                <option value="POINTS_HIGH">
                  Points: High to Low
                </option>
              </select>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
              <p className="text-xs font-black text-slate-950 sm:text-sm">
                {selectedCategory}
              </p>

              <p className="text-[10px] font-bold text-slate-500 sm:text-xs">
                {visibleRewards.length}{" "}
                reward
                {visibleRewards.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            {loading ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <RewardCardSkeleton
                    key={`reward-skeleton-${index}`}
                  />
                ))}
              </div>
            ) : visibleRewards.length >
              0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visibleRewards.map(
                  (reward) => (
                    <RewardCard
                      key={
                        reward.rewardId
                      }
                      reward={reward}
                      currentPoints={
                        currentPoints
                      }
                      onOpen={() =>
                        setSelectedReward(
                          reward
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyRewards
                title="No rewards found"
                description="Try another category or clear your search."
              />
            )}
          </section>

          <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Points History
                </h2>

                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  Your earned and redeemed
                  points activity.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 sm:px-4 sm:py-2 sm:text-xs">
                {history.length} Records
              </span>
            </div>

            <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {history.map(
                (item, index) => (
                  <HistoryRow
                    key={
                      item.pointId ||
                      item.pointsTxId ||
                      item.id ||
                      item.transactionId ||
                      `points-history-${index}`
                    }
                    title={
                      cleanUpper(
                        item.type
                      ) === "EARN"
                        ? "Points Earned"
                        : "Points Redeemed"
                    }
                    detail={
                      item.description ||
                      item.source ||
                      "-"
                    }
                    points={`${Number(
                      item.points
                    ) > 0
                      ? "+"
                      : ""}${Number(
                      item.points || 0
                    )} pts`}
                    negative={
                      Number(
                        item.points
                      ) < 0
                    }
                    date={
                      item.createdAt ||
                      ""
                    }
                  />
                )
              )}

              {!loading &&
                history.length ===
                  0 && (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center sm:rounded-3xl sm:p-8">
                    <p className="text-base font-black text-slate-950 sm:text-lg">
                      No points history yet
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
                      Your earned and
                      redeemed points will
                      appear here.
                    </p>
                  </div>
                )}

              {loading && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
                  Loading points
                  history...
                </div>
              )}
            </div>
          </section>
        </section>
      </main>

      {selectedReward && (
        <RewardDetailModal
  reward={selectedReward}
  currentPoints={currentPoints}
  redeeming={redeeming}
  redemptionMessage={
    redemptionMessage
  }
  onRedeem={
    handleRedeemReward
  }
  onClose={() => {
    setSelectedReward(null);
    setRedemptionMessage("");
  }}
/>
      )}
    </MemberLayout>
  );
}

function RewardCard({
  reward,
  currentPoints,
  onOpen,
  compact = false,
}: {
  reward: MemberRewardItem;
  currentPoints: number;
  onOpen: () => void;
  compact?: boolean;
}) {
  const unavailable =
    getRewardUnavailableText(
      reward,
      currentPoints
    );

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:rounded-[1.75rem]">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
      >
        {reward.thumbnailUrl ||
        reward.imageUrl ? (
          <img
            src={
              reward.thumbnailUrl ||
              reward.imageUrl
            }
            alt={reward.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
            <span
              className={
                compact
                  ? "text-5xl"
                  : "text-4xl sm:text-6xl"
              }
            >
              {rewardIcon(
                reward.category,
                reward.rewardType
              )}
            </span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex max-w-[85%] flex-wrap gap-1.5 sm:left-3 sm:top-3">
          {reward.isNew && (
            <RewardBadge
              label="NEW"
              styleName="bg-amber-400 text-slate-950"
            />
          )}

          {reward.featured && (
            <RewardBadge
              label="FEATURED"
              styleName="bg-slate-950 text-white"
            />
          )}

          {reward.isHot && (
            <RewardBadge
              label="HOT"
              styleName="bg-red-600 text-white"
            />
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-amber-700 sm:text-[10px]">
            {reward.brand ||
              reward.category ||
              "RewardHub"}
          </p>

          <p className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">
            {reward.stockLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-2 line-clamp-2 min-h-[2.5rem] text-left text-xs font-black leading-5 text-slate-950 sm:min-h-[3rem] sm:text-base sm:leading-6"
        >
          {reward.title}
        </button>

        <p className="mt-1 line-clamp-2 text-[9px] font-bold leading-4 text-slate-500 sm:text-xs sm:leading-5">
          {reward.description ||
            "Official RewardHub reward."}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">
                Redeem with
              </p>

              <p className="mt-0.5 text-sm font-black text-slate-950 sm:text-lg">
                {numberFormat(
                  reward.pointsRequired
                )}{" "}
                pts
              </p>
            </div>

            {reward.pointsShort >
              0 && (
              <p className="text-right text-[9px] font-black text-red-600 sm:text-[10px]">
                Need{" "}
                {numberFormat(
                  reward.pointsShort
                )}{" "}
                more
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onOpen}
            className={`mt-3 w-full rounded-xl px-3 py-2.5 text-[10px] font-black transition sm:rounded-2xl sm:py-3 sm:text-xs ${
              reward.canRedeem
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {unavailable ||
              "View & Redeem"}
          </button>
        </div>
      </div>
    </article>
  );
}

function RewardDetailModal({
  reward,
  currentPoints,
  redeeming,
  redemptionMessage,
  onRedeem,
  onClose,
}: {
  reward: MemberRewardItem;
  currentPoints: number;
  redeeming: boolean;
  redemptionMessage: string;
  onRedeem: (
    reward: MemberRewardItem,
    shippingData?: {
      recipientName: string;
      phone: string;
      address: string;
    }
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);

  const unavailable = getRewardUnavailableText(
    reward,
    currentPoints
  );

  const redemptionSucceeded = redemptionMessage
    .toLowerCase()
    .includes("successfully");

  const voucherCode = extractVoucherCode(
    redemptionMessage
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !redeeming) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, redeeming]);

  async function submitRedemption() {
    if (
      redeeming ||
      !reward.canRedeem ||
      redemptionSucceeded
    ) {
      return;
    }

    setFormError("");

    if (reward.shippingRequired) {
      if (!recipientName.trim()) {
        setFormError("Please enter the recipient name.");
        return;
      }

      if (!phone.trim()) {
        setFormError("Please enter the phone number.");
        return;
      }

      if (!address.trim()) {
        setFormError("Please enter the delivery address.");
        return;
      }
    }

    const confirmed = window.confirm(
      `Redeem "${reward.title}" for ${numberFormat(
        reward.pointsRequired
      )} points?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await onRedeem(
        reward,
        reward.shippingRequired
          ? {
              recipientName: recipientName.trim(),
              phone: phone.trim(),
              address: address.trim(),
            }
          : undefined
      );
    } catch (err: any) {
      setFormError(
        err?.message ||
          "Unable to redeem this reward."
      );
    }
  }

  async function copyVoucherCode() {
    if (!voucherCode) return;

    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setFormError(
        "Unable to copy the voucher code."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close reward details"
        onClick={() => {
          if (!redeeming) {
            onClose();
          }
        }}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2.25rem]">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {reward.imageUrl || reward.thumbnailUrl ? (
            <img
              src={
                reward.imageUrl ||
                reward.thumbnailUrl
              }
              alt={reward.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
              <span className="text-7xl sm:text-8xl">
                {rewardIcon(
                  reward.category,
                  reward.rewardType
                )}
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={redeeming}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {reward.isNew && (
              <RewardBadge
                label="NEW"
                styleName="bg-amber-400 text-slate-950"
              />
            )}

            {reward.featured && (
              <RewardBadge
                label="FEATURED"
                styleName="bg-slate-950 text-white"
              />
            )}

            {reward.isHot && (
              <RewardBadge
                label="HOT"
                styleName="bg-red-600 text-white"
              />
            )}

            {reward.isRecommended && (
              <RewardBadge
                label="RECOMMENDED"
                styleName="bg-emerald-600 text-white"
              />
            )}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 sm:text-xs">
            {reward.brand ||
              reward.category ||
              "RewardHub Official Reward"}
          </p>

          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            {reward.title}
          </h2>

          <p className="mt-3 text-xs font-bold leading-6 text-slate-500 sm:text-sm">
            {reward.description ||
              "Official reward prepared by RewardHub for eligible members."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailStat
              title="Required"
              value={`${numberFormat(
                reward.pointsRequired
              )} pts`}
            />

            <DetailStat
              title="Your Points"
              value={`${numberFormat(
                currentPoints
              )} pts`}
            />

            <DetailStat
              title="Stock"
              value={reward.stockLabel}
            />

            <DetailStat
              title="Delivery"
              value={
                reward.deliveryMethod ||
                "-"
              }
            />
          </div>

          {reward.maxPerMember > 0 && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-950">
                Redemption Limit
              </p>

              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                Maximum {reward.maxPerMember} redemption
                {reward.maxPerMember > 1 ? "s" : ""} per member.
                You have redeemed {reward.memberRedeemedQuantity}.
              </p>
            </div>
          )}

          {reward.shippingRequired &&
            !redemptionSucceeded && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <p className="text-sm font-black text-amber-950">
                  Delivery Information
                </p>

                <p className="mt-1 text-[11px] font-bold leading-5 text-amber-800">
                  Enter the recipient details before confirming this physical reward.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                      Recipient Name
                    </span>

                    <input
                      value={recipientName}
                      onChange={(event) =>
                        setRecipientName(
                          event.target.value
                        )
                      }
                      disabled={redeeming}
                      placeholder="Full name"
                      className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs font-bold text-slate-950 outline-none focus:border-amber-500 disabled:opacity-60 sm:text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                      Phone Number
                    </span>

                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      disabled={redeeming}
                      inputMode="tel"
                      placeholder="e.g. 0123456789"
                      className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs font-bold text-slate-950 outline-none focus:border-amber-500 disabled:opacity-60 sm:text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                      Delivery Address
                    </span>

                    <textarea
                      value={address}
                      onChange={(event) =>
                        setAddress(
                          event.target.value
                        )
                      }
                      disabled={redeeming}
                      rows={3}
                      placeholder="Complete delivery address"
                      className="mt-1.5 w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs font-bold text-slate-950 outline-none focus:border-amber-500 disabled:opacity-60 sm:text-sm"
                    />
                  </label>
                </div>
              </div>
            )}

          {(formError || redemptionMessage) && (
            <div
              className={`mt-4 rounded-2xl border p-4 ${
                redemptionSucceeded
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p
                className={`text-xs font-black sm:text-sm ${
                  redemptionSucceeded
                    ? "text-emerald-800"
                    : "text-red-700"
                }`}
              >
                {redemptionSucceeded
                  ? "Redemption Successful"
                  : "Unable to Redeem"}
              </p>

              <p
                className={`mt-1 text-[11px] font-bold leading-5 sm:text-xs ${
                  redemptionSucceeded
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {formError || redemptionMessage}
              </p>

              {voucherCode && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Voucher Code
                    </p>

                    <p className="mt-1 break-all text-sm font-black text-slate-950">
                      {voucherCode}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyVoucherCode}
                    className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!redemptionSucceeded && (
            <button
              type="button"
              disabled={
                redeeming ||
                !reward.canRedeem
              }
              onClick={submitRedemption}
              className={`mt-5 w-full rounded-2xl px-4 py-4 text-sm font-black transition ${
                reward.canRedeem
                  ? "bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              {redeeming
                ? "Processing..."
                : unavailable ||
                  `Redeem ${numberFormat(
                    reward.pointsRequired
                  )} Points`}
            </button>
          )}

          {redemptionSucceeded && (
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white"
            >
              Done
            </button>
          )}

          {!redemptionSucceeded &&
            reward.canRedeem && (
              <p className="mt-3 text-center text-[10px] font-bold leading-5 text-slate-400 sm:text-xs">
                Points and stock will be updated immediately after confirmation.
              </p>
            )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl p-4 sm:rounded-[2rem] sm:p-5 lg:p-6 ${
        highlight
          ? "bg-white text-slate-950"
          : "bg-white/10 text-white"
      }`}
    >
      <p
        className={`truncate text-[10px] font-black sm:text-sm ${
          highlight
            ? "text-slate-500"
            : "text-slate-300"
        }`}
      >
        {title}
      </p>

      <h2 className="mt-2 break-words text-xl font-black leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">
        {value}
      </h2>
    </div>
  );
}

function InfoRow({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-4">
      <p className="text-xs font-black text-slate-950 sm:text-sm">
        {title}
      </p>

      <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500 sm:text-xs sm:leading-5">
        {detail}
      </p>
    </div>
  );
}

function DetailStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
        {title}
      </p>

      <p className="mt-1 break-words text-xs font-black text-slate-950 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function RewardBadge({
  label,
  styleName,
}: {
  label: string;
  styleName: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[8px] font-black tracking-wide shadow-sm sm:px-2.5 sm:text-[9px] ${styleName}`}
    >
      {label}
    </span>
  );
}

function HistoryRow({
  title,
  detail,
  points,
  negative = false,
  date = "",
}: {
  title: string;
  detail: string;
  points: string;
  negative?: boolean;
  date?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:rounded-3xl sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950 sm:text-base">
          {title}
        </p>

        <p className="mt-1 truncate text-[10px] font-bold text-slate-500 sm:text-sm">
          {detail}
        </p>

        {date && (
          <p className="mt-1 text-[9px] font-bold text-slate-400 sm:text-xs">
            {formatDisplayDate(
              date
            )}
          </p>
        )}
      </div>

      <p
        className={`shrink-0 text-sm font-black sm:text-xl ${
          negative
            ? "text-red-600"
            : "text-emerald-700"
        }`}
      >
        {points}
      </p>
    </div>
  );
}

function RewardSkeletonRow() {
  return (
    <div className="-mx-4 mt-5 flex gap-3 overflow-hidden px-4 sm:-mx-7 sm:px-7">
      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div
          key={`new-skeleton-${index}`}
          className="h-72 w-[72%] min-w-[220px] animate-pulse rounded-[1.5rem] bg-slate-100 sm:w-[280px]"
        />
      ))}
    </div>
  );
}

function RewardCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white sm:rounded-[1.75rem]">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />

      <div className="p-3 sm:p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyRewards({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-3xl bg-slate-50 p-7 text-center sm:mt-6 sm:p-10">
      <div className="text-4xl">
        🎁
      </div>

      <p className="mt-3 text-base font-black text-slate-950 sm:text-lg">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-md text-xs font-bold leading-5 text-slate-500 sm:text-sm">
        {description}
      </p>
    </div>
  );
}

function getRewardUnavailableText(
  reward: MemberRewardItem,
  currentPoints: number
) {
  if (
    reward.unavailableReason ===
      "OUT_OF_STOCK" ||
    !reward.stockAvailable
  ) {
    return "Out of Stock";
  }

  if (
    reward.unavailableReason ===
      "MEMBER_LIMIT_REACHED" ||
    reward.reachedMemberLimit
  ) {
    return "Limit Reached";
  }

  if (
    reward.unavailableReason ===
      "INSUFFICIENT_POINTS" ||
    currentPoints <
      reward.pointsRequired
  ) {
    return `Need ${numberFormat(
      Math.max(
        reward.pointsRequired -
          currentPoints,
        0
      )
    )} More`;
  }

  return "";
}

function rewardIcon(
  category: string,
  rewardType: string
) {
  const text =
    `${category} ${rewardType}`.toUpperCase();

  if (
    text.includes("VOUCHER")
  ) {
    return "🎫";
  }

  if (
    text.includes("DIGITAL")
  ) {
    return "📱";
  }

  if (
    text.includes("ELECTRONIC")
  ) {
    return "🎧";
  }

  if (text.includes("FOOD")) {
    return "🍔";
  }

  if (
    text.includes("TRAVEL")
  ) {
    return "✈️";
  }

  if (
    text.includes("LIFESTYLE")
  ) {
    return "👕";
  }

  if (
    text.includes("GIFT")
  ) {
    return "🎁";
  }

  return "⭐";
}

function extractVoucherCode(
  message: string
) {
  const match = String(
    message || ""
  ).match(
    /Voucher Code:\s*(.+)$/i
  );

  return match
    ? match[1].trim()
    : "";
}


function unwrapApiData(
  response: any
) {
  return (
    response?.data?.data ||
    response?.data ||
    response?.result ||
    response ||
    {}
  );
}

function parseDate(
  value: string
) {
  if (!value) return 0;

  const normalized =
    value.replace(
      /^(\d{4})-(\d{2})-(\d{2})\s/,
      "$1/$2/$3 "
    );

  const timestamp =
    new Date(
      normalized
    ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function formatDisplayDate(
  value: string
) {
  const timestamp =
    parseDate(value);

  if (!timestamp) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(timestamp));
}

function cleanUpper(value: any) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function numberFormat(value: any) {
  return Number(
    value || 0
  ).toLocaleString("en-MY");
}

function money(value: any) {
  return Number(
    value || 0
  ).toFixed(2);
}