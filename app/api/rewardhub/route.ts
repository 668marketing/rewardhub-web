import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL =
  process.env.REWARDHUB_APPS_SCRIPT_URL || "";

type JsonObject = Record<string, unknown>;

function isJsonObject(
  value: unknown
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function safeTextPreview(
  value: string,
  maxLength = 500
) {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength) + "...";
}

function removeJsonPrefix(
  value: string
) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/^\)\]\}',?\s*/, "")
    .trim();
}

function isValidAppsScriptUrl(
  value: string
) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(
    String(value || "").trim()
  );
}

/**
 * ============================================================
 * RewardHub read-only actions
 * ============================================================
 *
 * Only these actions may be retried automatically.
 *
 * IMPORTANT:
 * Mutation actions MUST NEVER be automatically replayed.
 */
function isReadOnlyAction(
  action: string
) {
  const normalized =
    String(action || "").trim();

  if (!normalized) {
    return false;
  }

  /**
   * All current RewardHub read methods follow
   * get / list / search style naming.
   *
   * Anything else is considered a mutation by default.
   */
  return /^(get|list|search|validate|check)/i.test(
    normalized
  );
}

function generateRequestId() {
  return [
    "RHREQ",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}


/**
 * ============================================================
 * PostgreSQL/Supabase direct-read migration layer
 * ============================================================
 *
 * IMPORTANT:
 * - Only explicitly migrated READ actions are handled here.
 * - Any Supabase query error / missing legacy row falls back to
 *   Apps Script so existing RewardHub behaviour is preserved.
 * - Response envelopes intentionally match:
 *
 *   jsonSuccess(
 *     responseMessage(message, data)
 *   )
 *
 *   => {
 *        success: true,
 *        data: {
 *          message,
 *          data
 *        }
 *      }
 *
 * This lets existing frontend code continue working unchanged.
 */
async function tryHandleSupabaseRead(
  action: string,
  body: JsonObject,
  requestId: string
): Promise<NextResponse | null> {
  const supportedActions = [
    "getMemberPointsSummary",
    "getMemberPointsHistory",
    "getMemberWalletSummary",
    "getMemberRewardCreditSummary",
    "getMemberCommissionSummary",
    "getMemberReferralSummary",
    "getMemberReferralHistory",
    "getMemberDashboard",
    "getTransactionHistory",
    "getMerchantTransactionHistory",
    "getMerchantSettlementSummary",
    "getMarketplaceMerchants",
    "getMerchantDetail",
    "getMerchantReviews",
    "getMerchantGallery",
    "getMerchantProducts",
    "getMerchantOrders",
    "getMemberOrderDetail",
    "checkFavouriteMerchant",
    "toggleFavouriteMerchant",
    "getMerchantRating",
    "getMemberNotifications",
    "getMerchantNotifications",
    "getUnreadNotificationCount",
    "markNotificationRead",
    "markAllNotificationsRead",
  ];

if (
  !supportedActions.includes(
    action
  )
) {
  return null;
}

  const memberId =
    typeof body.memberId ===
    "string"
      ? body.memberId.trim()
      : "";

  const requiresMemberId =
    ![
      "getMerchantTransactionHistory",
      "getMerchantSettlementSummary",
      "getMarketplaceMerchants",
      "getMerchantDetail",
      "getMerchantReviews",
      "getMerchantGallery",
      "getMerchantProducts",
      "getMerchantOrders",
      "getMerchantRating",
      "getMemberNotifications",
      "getMerchantNotifications",
      "getUnreadNotificationCount",
      "markNotificationRead",
      "markAllNotificationsRead",
    ].includes(action);

  if (
    requiresMemberId &&
    !memberId
  ) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error:
          "Missing memberId",
        message:
          "Missing memberId",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const supabase =
      getSupabaseAdmin();

    /*
     * ============================================================
     * MERCHANT SETTLEMENT SUMMARY
     * ============================================================
     *
     * Supabase-first read for the Merchant Settlement page.
     * - settlement history comes from public.settlements
     * - current previous-month calculation comes from the existing
     *   get_merchant_settlement_calculation RPC
     * - any Supabase error returns null so Apps Script remains the
     *   compatibility fallback
     */
    if (
      action ===
      "getMerchantSettlementSummary"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const round2 = (
        value: unknown
      ) => {
        const numberValue =
          Number(value || 0);

        return Math.round(
          (
            numberValue +
            Number.EPSILON
          ) * 100
        ) / 100;
      };

      const getKualaLumpurYearMonth = (
        date: Date
      ) => {
        const parts =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              timeZone:
                "Asia/Kuala_Lumpur",
              year: "numeric",
              month: "2-digit",
            }
          ).formatToParts(
            date
          );

        const year =
          parts.find(
            (part) =>
              part.type === "year"
          )?.value || "";

        const month =
          parts.find(
            (part) =>
              part.type === "month"
          )?.value || "";

        return {
          year: Number(year),
          month: Number(month),
        };
      };

      const nowParts =
        getKualaLumpurYearMonth(
          new Date()
        );

      let settlementYear =
        nowParts.year;
      // Current-month settlement calculation.
      let settlementMonthNumber =
        nowParts.month;

      if (
        settlementMonthNumber < 1
      ) {
        settlementMonthNumber = 12;
        settlementYear -= 1;
      }

      const settlementMonth =
        `${settlementYear}-${String(
          settlementMonthNumber
        ).padStart(2, "0")}`;

      let nextYear =
        settlementYear;
      let nextMonth =
        settlementMonthNumber + 1;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      const periodStart =
        `${settlementMonth}-01T00:00:00+08:00`;

      const periodEnd =
        `${nextYear}-${String(
          nextMonth
        ).padStart(
          2,
          "0"
        )}-01T00:00:00+08:00`;

      type SettlementRow = {
        settlement_id:
          string | null;
        merchant_id:
          string | null;
        settlement_month:
          string | null;
        total_sales:
          number | string | null;
        total_cashback:
          number | string | null;
        total_reward_credits:
          number | string | null;
        total_voucher_discount:
          number | string | null;
        total_marketing_budget:
          number | string | null;
        amount_payable:
          number | string | null;
        merchant_due:
          number | string | null;
        rewardhub_due:
          number | string | null;
        net_amount:
          number | string | null;
        settlement_direction:
          string | null;
        bank_name:
          string | null;
        bank_account:
          string | null;
        merchant_name:
          string | null;
        bank_account_name:
          string | null;
        bank_qr_url:
          string | null;
        status:
          string | null;
        payment_method:
          string | null;
        receipt_url:
          string | null;
        payment_note:
          string | null;
        reject_reason:
          string | null;
        approved_at:
          string | null;
        approved_by:
          string | null;
        rejected_at:
          string | null;
        rejected_by:
          string | null;
        paid_at:
          string | null;
        created_at:
          string | null;
        updated_at:
          string | null;
      };

      const settlementResult =
        await supabase
          .from("settlements")
          .select(
            "settlement_id,merchant_id,settlement_month,total_sales,total_cashback,total_reward_credits,total_voucher_discount,total_marketing_budget,amount_payable,merchant_due,rewardhub_due,net_amount,settlement_direction,bank_name,bank_account,merchant_name,bank_account_name,bank_qr_url,status,payment_method,receipt_url,payment_note,reject_reason,approved_at,approved_by,rejected_at,rejected_by,paid_at,created_at,updated_at"
          )
          .eq(
            "merchant_id",
            merchantId
          )
          .order(
            "settlement_month",
            {
              ascending: false,
            }
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (settlementResult.error) {
        console.warn(
          "REWARDHUB SUPABASE SETTLEMENT SUMMARY FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            stage:
              "settlement-history",
            reason:
              settlementResult.error.message,
          }
        );

        return null;
      }

      /*
       * IMPORTANT:
       * Read the settlement-period transactions directly from
       * merchant_transactions instead of relying on the RPC.
       * This keeps the settlement page on the same Supabase data
       * source as the merchant transaction history and avoids RPC
       * result differences between SQL Editor and the Next.js server.
       */
      type SettlementTransactionRow = {
        transaction_id: string | null;
        amount: number | string | null;
        cashback: number | string | null;
        reward_credits_used: number | string | null;
        voucher_discount: number | string | null;
        marketing_amount: number | string | null;
        status: string | null;
        created_at: string | null;
      };

      const periodStartUtc =
        new Date(
          periodStart
        ).toISOString();

      const periodEndUtc =
        new Date(
          periodEnd
        ).toISOString();

      /*
       * NOTE:
       * Direct PostgREST fetch is intentionally used only for this
       * settlement-period transaction query.
       *
       * We verified that:
       * - PostgreSQL SQL returns the expected transaction.
       * - Direct PostgREST with the same merchant/date filters returns it.
       * - supabase-js unexpectedly returned an empty array for this exact
       *   range query in this project.
       *
       * Keeping this workaround local avoids changing the rest of the
       * Supabase-backed RewardHub functionality.
       */
      const supabaseUrl =
        String(
          process.env.SUPABASE_URL ||
          ""
        ).trim();

      const supabaseServiceRoleKey =
        String(
          process.env
            .SUPABASE_SERVICE_ROLE_KEY ||
          ""
        ).trim();

      if (
        !supabaseUrl ||
        !supabaseServiceRoleKey
      ) {
        console.warn(
          "REWARDHUB SUPABASE SETTLEMENT SUMMARY FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            stage:
              "settlement-transactions-env",
            reason:
              "Supabase server credentials are missing.",
          }
        );

        return null;
      }

      const transactionUrl =
        new URL(
          `${supabaseUrl.replace(
            /\/$/,
            ""
          )}/rest/v1/merchant_transactions`
        );

      transactionUrl.searchParams.set(
        "select",
        [
          "transaction_id",
          "amount",
          "cashback",
          "reward_credits_used",
          "voucher_discount",
          "marketing_amount",
          "status",
          "created_at",
        ].join(",")
      );

      transactionUrl.searchParams.set(
        "merchant_id",
        `eq.${merchantId}`
      );

      /*
       * Fetch this merchant's transactions without a PostgREST
       * created_at range filter, then apply the settlement-month
       * boundary in Node.js using Asia/Kuala_Lumpur.
       *
       * This avoids the date-range mismatch that previously caused
       * valid July transactions to return an empty settlement total.
       */
      transactionUrl.searchParams.set(
        "order",
        "created_at.asc"
      );

      transactionUrl.searchParams.set(
        "limit",
        "5000"
      );

      let transactionRows:
        SettlementTransactionRow[] =
          [];

      try {
        const transactionResponse =
          await fetch(
            transactionUrl.toString(),
            {
              method:
                "GET",
              headers: {
                apikey:
                  supabaseServiceRoleKey,
                Authorization:
                  `Bearer ${supabaseServiceRoleKey}`,
                Accept:
                  "application/json",
              },
              cache:
                "no-store",
            }
          );

        const transactionText =
          await transactionResponse.text();

          console.log(
  "REWARDHUB SETTLEMENT POSTGREST RAW DEBUG:",
  {
    requestId,
    merchantId,
    url:
      transactionUrl.toString(),
    status:
      transactionResponse.status,
    ok:
      transactionResponse.ok,
    responseText:
      transactionText,
  }
);

        let transactionJson:
          unknown = [];

        try {
          transactionJson =
            transactionText
              ? JSON.parse(
                  transactionText
                )
              : [];
        } catch {
          throw new Error(
            "Settlement transaction query returned invalid JSON."
          );
        }

        if (
          !transactionResponse.ok
        ) {
          const errorMessage =
            transactionJson &&
            typeof transactionJson ===
              "object" &&
            "message" in
              transactionJson
              ? String(
                  (
                    transactionJson as Record<
                      string,
                      unknown
                    >
                  ).message ||
                    "PostgREST settlement transaction query failed."
                )
              : "PostgREST settlement transaction query failed.";

          throw new Error(
            errorMessage
          );
        }

        transactionRows =
          Array.isArray(
            transactionJson
          )
            ? (
                transactionJson as SettlementTransactionRow[]
              )
            : [];
      } catch (error) {
        console.warn(
          "REWARDHUB SUPABASE SETTLEMENT SUMMARY FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            stage:
              "settlement-transactions-postgrest",
            reason:
              error instanceof Error
                ? error.message
                : String(
                    error ||
                    "Unknown PostgREST error"
                  ),
          }
        );

        return null;
      }

      const settlementTransactions =
        transactionRows.filter(
          (row) => {
            if (
              cleanText(
                row.status
              ).toUpperCase() !==
              "COMPLETED"
            ) {
              return false;
            }

            const createdAt =
              cleanText(
                row.created_at
              );

            if (!createdAt) {
              return false;
            }

            const parsedDate =
              new Date(
                createdAt
              );

            if (
              Number.isNaN(
                parsedDate.getTime()
              )
            ) {
              return false;
            }

            const parts =
              new Intl.DateTimeFormat(
                "en-CA",
                {
                  timeZone:
                    "Asia/Kuala_Lumpur",
                  year:
                    "numeric",
                  month:
                    "2-digit",
                }
              ).formatToParts(
                parsedDate
              );

            const year =
              parts.find(
                (part) =>
                  part.type ===
                  "year"
              )?.value || "";

            const month =
              parts.find(
                (part) =>
                  part.type ===
                  "month"
              )?.value || "";

            return (
              `${year}-${month}` ===
              settlementMonth
            );
          }
        );

      console.log(
        "REWARDHUB SETTLEMENT TRANSACTION DEBUG:",
        {
          requestId,
          merchantId,
          settlementMonth,
          periodStart,
          periodEnd,
          periodStartUtc,
          periodEndUtc,
          transactionCount:
            settlementTransactions.length,
          transactions:
            settlementTransactions.map(
              (row) => ({
                transactionId:
                  cleanText(
                    row.transaction_id
                  ),
                amount:
                  Number(
                    row.amount || 0
                  ),
                cashback:
                  Number(
                    row.cashback || 0
                  ),
                marketingAmount:
                  Number(
                    row.marketing_amount || 0
                  ),
                status:
                  cleanText(
                    row.status
                  ),
                createdAt:
                  row.created_at ||
                  "",
              })
            ),
        }
      );

      /*
       * ==========================================================
       * FULL MONTH TOTALS
       * ==========================================================
       */
      let fullTotalSales = 0;
      let fullTotalCashback = 0;
      let fullTotalRewardCredits = 0;
      let fullTotalVoucherDiscount = 0;
      let fullTotalMarketingBudget = 0;

      settlementTransactions.forEach(
        (row) => {
          fullTotalSales +=
            Number(
              row.amount || 0
            );

          fullTotalCashback +=
            Number(
              row.cashback || 0
            );

          fullTotalRewardCredits +=
            Number(
              row.reward_credits_used || 0
            );

          fullTotalVoucherDiscount +=
            Number(
              row.voucher_discount || 0
            );

          fullTotalMarketingBudget +=
            Number(
              row.marketing_amount || 0
            );
        }
      );

      fullTotalSales =
        round2(fullTotalSales);
      fullTotalCashback =
        round2(fullTotalCashback);
      fullTotalRewardCredits =
        round2(
          fullTotalRewardCredits
        );
      fullTotalVoucherDiscount =
        round2(
          fullTotalVoucherDiscount
        );
      fullTotalMarketingBudget =
        round2(
          fullTotalMarketingBudget
        );

      const history =
        (
          (settlementResult.data ||
            []) as SettlementRow[]
        ).map((row) => {
          const storedNetText =
            row.net_amount ===
              null ||
            row.net_amount ===
              undefined
              ? ""
              : String(
                  row.net_amount
                ).trim();

          const storedAmount =
            round2(
              row.amount_payable
            );

          let rowDirection =
            cleanText(
              row.settlement_direction
            )
              .toUpperCase()
              .replace(
                /[\s-]+/g,
                "_"
              );

          let signedNet = 0;

          if (
            storedNetText !== "" &&
            Number.isFinite(
              Number(
                storedNetText
              )
            )
          ) {
            signedNet =
              round2(
                Number(
                  storedNetText
                )
              );
          } else {
            if (
              rowDirection ===
              "REWARDHUB_TO_MERCHANT"
            ) {
              signedNet =
                round2(
                  -storedAmount
                );
            } else if (
              rowDirection ===
              "NO_PAYMENT"
            ) {
              signedNet = 0;
            } else {
              signedNet =
                storedAmount;
            }
          }

          if (
            ![
              "MERCHANT_TO_REWARDHUB",
              "REWARDHUB_TO_MERCHANT",
              "NO_PAYMENT",
            ].includes(
              rowDirection
            )
          ) {
            rowDirection =
              signedNet > 0
                ? "MERCHANT_TO_REWARDHUB"
                : signedNet < 0
                  ? "REWARDHUB_TO_MERCHANT"
                  : storedAmount > 0
                    ? "MERCHANT_TO_REWARDHUB"
                    : "NO_PAYMENT";
          }

          const month =
            cleanText(
              row.settlement_month
            ).slice(0, 7);

          return {
            settlementId:
              cleanText(
                row.settlement_id
              ),
            merchantId:
              cleanText(
                row.merchant_id
              ),
            month,
            totalSales:
              round2(
                row.total_sales
              ),
            totalCashback:
              round2(
                row.total_cashback
              ),
            totalRewardCredits:
              round2(
                row.total_reward_credits
              ),
            totalVoucherDiscount:
              round2(
                row.total_voucher_discount
              ),
            totalMarketingBudget:
              round2(
                row.total_marketing_budget
              ),
            merchantDue:
              row.merchant_due ===
                null ||
              row.merchant_due ===
                undefined
                ? round2(
                    Math.max(
                      Number(
                        row.total_marketing_budget ||
                          0
                      ) -
                        Number(
                          row.total_cashback ||
                            0
                        ),
                      0
                    )
                  )
                : round2(
                    row.merchant_due
                  ),
            rewardHubDue:
              row.rewardhub_due ===
                null ||
              row.rewardhub_due ===
                undefined
                ? round2(
                    Number(
                      row.total_reward_credits ||
                        0
                    ) +
                      Number(
                        row.total_voucher_discount ||
                          0
                      )
                  )
                : round2(
                    row.rewardhub_due
                  ),
            netAmount:
              signedNet,
            settlementDirection:
              rowDirection,
            amountPayable:
              storedAmount,
            bankName:
              cleanText(
                row.bank_name
              ),
            bankAccount:
              cleanText(
                row.bank_account
              ),
            bankAccountName:
              cleanText(
                row.bank_account_name
              ),
            bankQrUrl:
              cleanText(
                row.bank_qr_url
              ),
            merchantName:
              cleanText(
                row.merchant_name
              ),
            status:
              cleanText(
                row.status
              ),
            paymentMethod:
              cleanText(
                row.payment_method
              ),
            receiptUrl:
              cleanText(
                row.receipt_url
              ),
            paymentNote:
              cleanText(
                row.payment_note
              ),
            rejectReason:
              cleanText(
                row.reject_reason
              ),
            approvedAt:
              row.approved_at || "",
            approvedBy:
              cleanText(
                row.approved_by
              ),
            rejectedAt:
              row.rejected_at || "",
            rejectedBy:
              cleanText(
                row.rejected_by
              ),
            createdAt:
              row.created_at || "",
            paidAt:
              row.paid_at || "",
            updatedAt:
              row.updated_at || "",
          };
        });

      let pendingAmount = 0;
      let paidAmount = 0;
      let lastSettlement = 0;

      const reserved = {
        totalSales: 0,
        totalCashback: 0,
        totalRewardCredits: 0,
        totalVoucherDiscount: 0,
        totalMarketingBudget: 0,
      };

      let hasOpenSettlement =
        false;

      history.forEach(
        (settlement) => {
          const status =
            cleanText(
              settlement.status
            ).toUpperCase();

          if (
            [
              "PENDING",
              "SUBMITTED",
              "APPROVED",
            ].includes(status)
          ) {
            pendingAmount +=
              Number(
                settlement.amountPayable ||
                  0
              );

            if (
              settlement.month ===
              settlementMonth
            ) {
              hasOpenSettlement =
                true;
            }
          }

          if (status === "PAID") {
            paidAmount +=
              Number(
                settlement.amountPayable ||
                  0
              );

            if (
              lastSettlement === 0
            ) {
              lastSettlement =
                Number(
                  settlement.amountPayable ||
                    0
                );
            }
          }

          if (
            settlement.month ===
              settlementMonth &&
            [
              "PENDING",
              "SUBMITTED",
              "APPROVED",
              "PAID",
            ].includes(status)
          ) {
            reserved.totalSales +=
              Number(
                settlement.totalSales ||
                  0
              );

            reserved.totalCashback +=
              Number(
                settlement.totalCashback ||
                  0
              );

            reserved.totalRewardCredits +=
              Number(
                settlement.totalRewardCredits ||
                  0
              );

            reserved.totalVoucherDiscount +=
              Number(
                settlement.totalVoucherDiscount ||
                  0
              );

            reserved.totalMarketingBudget +=
              Number(
                settlement.totalMarketingBudget ||
                  0
              );
          }
        }
      );

      const totalSales =
        round2(
          Math.max(
            fullTotalSales -
              reserved.totalSales,
            0
          )
        );

      const totalCashback =
        round2(
          Math.max(
            fullTotalCashback -
              reserved.totalCashback,
            0
          )
        );

      const totalRewardCredits =
        round2(
          Math.max(
            fullTotalRewardCredits -
              reserved.totalRewardCredits,
            0
          )
        );

      const totalVoucherDiscount =
        round2(
          Math.max(
            fullTotalVoucherDiscount -
              reserved.totalVoucherDiscount,
            0
          )
        );

      const totalMarketingBudget =
        round2(
          Math.max(
            fullTotalMarketingBudget -
              reserved.totalMarketingBudget,
            0
          )
        );

      const merchantDue =
        round2(
          Math.max(
            totalMarketingBudget -
              totalCashback,
            0
          )
        );

      const rewardHubDue =
        round2(
          Math.max(
            totalRewardCredits,
            0
          ) +
            Math.max(
              totalVoucherDiscount,
              0
            )
        );

      const netAmount =
        round2(
          merchantDue -
            rewardHubDue
        );

      const settlementDirection =
        netAmount > 0
          ? "MERCHANT_TO_REWARDHUB"
          : netAmount < 0
            ? "REWARDHUB_TO_MERCHANT"
            : "NO_PAYMENT";

      const amountPayable =
        round2(
          Math.abs(
            netAmount
          )
        );

      const availablePayable =
        hasOpenSettlement
          ? 0
          : amountPayable;

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          settlementMonth,
          historyCount:
            history.length,
          transactionCount:
            Number(
              settlementTransactions.length
            ),
        }
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            message:
              "Merchant settlement summary loaded",
            data: {
              merchantId,
              pendingAmount:
                round2(
                  pendingAmount
                ),
              paidAmount:
                round2(
                  paidAmount
                ),
              lastSettlement:
                round2(
                  lastSettlement
                ),
              availablePayable:
                round2(
                  availablePayable
                ),
              currentMonth:
                settlementMonth,
              totalSales,
              totalCashback,
              totalRewardCredits,
              totalVoucherDiscount,
              totalMarketingBudget,
              merchantDue,
              rewardHubDue,
              netAmount,
              settlementDirection,
              amountPayable,
              currentAmountPayable:
                amountPayable,
              history,
            },
          },
          requestId,
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MARKETPLACE MERCHANTS
     * ============================================================
     *
     * Mirrors the Apps Script getMarketplaceMerchants() response:
     * - active / approved merchants only
     * - keyword + category filtering
     * - published review rating aggregation
     * - completed transaction aggregation
     * - rating DESC, transactionCount DESC, displayName ASC
     *
     * Marketplace is public and therefore does NOT require memberId.
     * Any Supabase query failure returns null so the existing
     * Apps Script fallback remains available.
     */
    if (
      action ===
      "getMarketplaceMerchants"
    ) {
      const keyword =
        typeof body.keyword ===
        "string"
          ? body.keyword
              .trim()
              .toLowerCase()
          : "";

      const category =
        typeof body.category ===
        "string"
          ? body.category.trim()
          : "";

      const requestedLimit =
        typeof body.limit === "number"
          ? body.limit
          : typeof body.limit === "string"
            ? Number(body.limit)
            : 50;

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(
                requestedLimit
              ),
              200
            )
          : 50;

      const [
        merchantResult,
        reviewResult,
        transactionResult,
      ] =
        await Promise.all([
          supabase
            .from("merchants")
            .select(
              "merchant_id,business_name,display_name,phone,category,sub_category,state,area,logo_url,banner_url,address,marketing_budget,reward_credit_enabled,max_reward_credit_percent,status,created_at,updated_at"
            ),

          supabase
            .from(
              "merchant_reviews"
            )
            .select(
              "merchant_id,rating,status"
            ),

          supabase
            .from(
              "merchant_transactions"
            )
            .select(
              "merchant_id,pay_amount,cashback,status"
            ),
        ]);

      const firstError =
        merchantResult.error ||
        reviewResult.error ||
        transactionResult.error;

      if (firstError) {
        console.warn(
          "REWARDHUB SUPABASE MARKETPLACE FALLBACK:",
          {
            requestId,
            action,
            reason:
              firstError.message,
          }
        );

        return null;
      }

      type MarketplaceMerchantRow = {
        merchant_id:
          string | null;
        business_name:
          string | null;
        display_name:
          string | null;
        phone:
          string | null;
        category:
          string | null;
        sub_category:
          string | null;
        state:
          string | null;
        area:
          string | null;
        logo_url:
          string | null;
        banner_url:
          string | null;
        address:
          string | null;
        marketing_budget:
          number | string | null;
        reward_credit_enabled:
          boolean | string | null;
        max_reward_credit_percent:
          number | string | null;
        status:
          string | null;
        created_at:
          string | null;
        updated_at:
          string | null;
      };

      type MarketplaceReviewRow = {
        merchant_id:
          string | null;
        rating:
          number | string | null;
        status:
          string | null;
      };

      type MarketplaceTransactionRow = {
        merchant_id:
          string | null;
        pay_amount:
          number | string | null;
        cashback:
          number | string | null;
        status:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(value ?? "").trim();

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            Number(value || 0) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const ratingMap:
        Record<
          string,
          {
            totalRating: number;
            reviewCount: number;
          }
        > = {};

      (
        (reviewResult.data ||
          []) as MarketplaceReviewRow[]
      ).forEach((review) => {
        const merchantId =
          cleanText(
            review.merchant_id
          );

        const status =
          cleanText(
            review.status ||
              "Published"
          ).toUpperCase();

        const rating =
          Number(
            review.rating || 0
          );

        if (
          !merchantId ||
          status !==
            "PUBLISHED" ||
          rating < 1 ||
          rating > 5
        ) {
          return;
        }

        if (
          !ratingMap[
            merchantId
          ]
        ) {
          ratingMap[
            merchantId
          ] = {
            totalRating: 0,
            reviewCount: 0,
          };
        }

        ratingMap[
          merchantId
        ].totalRating +=
          rating;

        ratingMap[
          merchantId
        ].reviewCount +=
          1;
      });

      const transactionMap:
        Record<
          string,
          {
            transactionCount: number;
            totalSales: number;
            totalCashback: number;
          }
        > = {};

      (
        (transactionResult.data ||
          []) as MarketplaceTransactionRow[]
      ).forEach(
        (transaction) => {
          const merchantId =
            cleanText(
              transaction.merchant_id
            );

          const status =
            cleanText(
              transaction.status
            ).toUpperCase();

          if (
            !merchantId ||
            status !==
              "COMPLETED"
          ) {
            return;
          }

          if (
            !transactionMap[
              merchantId
            ]
          ) {
            transactionMap[
              merchantId
            ] = {
              transactionCount: 0,
              totalSales: 0,
              totalCashback: 0,
            };
          }

          const stats =
            transactionMap[
              merchantId
            ];

          stats.transactionCount +=
            1;

          stats.totalSales +=
            Number(
              transaction.pay_amount ||
              0
            );

          stats.totalCashback +=
            Number(
              transaction.cashback ||
              0
            );
        }
      );

      const merchants =
        (
          (merchantResult.data ||
            []) as MarketplaceMerchantRow[]
        )
          .filter((merchant) => {
            const status =
              cleanText(
                merchant.status
              ).toUpperCase();

            if (
              status !==
                "ACTIVE" &&
              status !==
                "APPROVED"
            ) {
              return false;
            }

            const name =
              cleanText(
                merchant.display_name ||
                merchant.business_name
              ).toLowerCase();

            const businessName =
              cleanText(
                merchant.business_name
              ).toLowerCase();

            const merchantCategory =
              cleanText(
                merchant.category
              );

            const merchantCategoryLower =
              merchantCategory
                .toLowerCase();

            const subCategory =
              cleanText(
                merchant.sub_category
              ).toLowerCase();

            const address =
              cleanText(
                merchant.address
              ).toLowerCase();

            const state =
              cleanText(
                merchant.state
              ).toLowerCase();

            const area =
              cleanText(
                merchant.area
              ).toLowerCase();

            const matchKeyword =
              !keyword ||
              name.includes(
                keyword
              ) ||
              businessName.includes(
                keyword
              ) ||
              merchantCategoryLower.includes(
                keyword
              ) ||
              subCategory.includes(
                keyword
              ) ||
              address.includes(
                keyword
              ) ||
              state.includes(
                keyword
              ) ||
              area.includes(
                keyword
              );

            const matchCategory =
              !category ||
              category.toLowerCase() ===
                "all" ||
              merchantCategoryLower ===
                category.toLowerCase();

            return (
              matchKeyword &&
              matchCategory
            );
          })
          .map((merchant) => {
            const merchantId =
              cleanText(
                merchant.merchant_id
              );

            const ratingStats =
              ratingMap[
                merchantId
              ] || {
                totalRating: 0,
                reviewCount: 0,
              };

            const transactionStats =
              transactionMap[
                merchantId
              ] || {
                transactionCount: 0,
                totalSales: 0,
                totalCashback: 0,
              };

            const averageRating =
              ratingStats.reviewCount >
              0
                ? ratingStats.totalRating /
                  ratingStats.reviewCount
                : 0;

            const rawRewardCreditEnabled =
              merchant
                .reward_credit_enabled;

            const rewardCreditEnabled =
              typeof rawRewardCreditEnabled ===
              "boolean"
                ? rawRewardCreditEnabled
                : [
                    "YES",
                    "TRUE",
                    "1",
                  ].includes(
                    cleanText(
                      rawRewardCreditEnabled
                    ).toUpperCase()
                  );

            const marketingBudgetValue =
              Number(
                merchant.marketing_budget ||
                5
              );

            const maxRewardCreditPercentValue =
              Number(
                merchant
                  .max_reward_credit_percent ||
                30
              );

            return {
              merchantId,

              businessName:
                cleanText(
                  merchant.business_name
                ),

              displayName:
                cleanText(
                  merchant.display_name ||
                  merchant.business_name
                ),

              phone:
                String(
                  merchant.phone || ""
                ),

              subCategory:
                cleanText(
                  merchant.sub_category
                ),

              category:
                cleanText(
                  merchant.category
                ) ||
                "Merchant",

              state:
                cleanText(
                  merchant.state
                ),

              area:
                cleanText(
                  merchant.area
                ),

              address:
                cleanText(
                  merchant.address
                ),

              location:
                cleanText(
                  merchant.address
                ) ||
                "Malaysia",

              logoUrl:
                cleanText(
                  merchant.logo_url
                ),

              bannerUrl:
                cleanText(
                  merchant.banner_url
                ),

              marketingBudget:
                Number.isFinite(
                  marketingBudgetValue
                )
                  ? marketingBudgetValue
                  : 5,

              rewardCreditEnabled,

              acceptRewardCredits:
                rewardCreditEnabled,

              maxRewardCreditPercent:
                Number.isFinite(
                  maxRewardCreditPercentValue
                )
                  ? maxRewardCreditPercentValue
                  : 30,

              rating:
                Number(
                  averageRating.toFixed(
                    1
                  )
                ),

              averageRating:
                Number(
                  averageRating.toFixed(
                    1
                  )
                ),

              reviewCount:
                ratingStats.reviewCount,

              transactionCount:
                transactionStats
                  .transactionCount,

              totalSales:
                round2(
                  transactionStats
                    .totalSales
                ),

              totalCashback:
                round2(
                  transactionStats
                    .totalCashback
                ),

              status:
                cleanText(
                  merchant.status
                ),

              createdAt:
                merchant.created_at ||
                "",

              updatedAt:
                merchant.updated_at ||
                "",
            };
          })
          .sort(
            (
              first,
              second
            ) => {
              if (
                second.rating !==
                first.rating
              ) {
                return (
                  second.rating -
                  first.rating
                );
              }

              if (
                second.transactionCount !==
                first.transactionCount
              ) {
                return (
                  second.transactionCount -
                  first.transactionCount
                );
              }

              return first.displayName.localeCompare(
                second.displayName
              );
            }
          )
          .slice(
            0,
            limit
          );

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          keyword,
          category,
          count:
            merchants.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Marketplace merchants loaded",

            data: {
              merchants,

              count:
                merchants.length,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }

    /*
     * ============================================================
     * MERCHANT DETAIL
     * ============================================================
     *
     * Direct PostgreSQL read that mirrors the Apps Script
     * getMerchantDetail() / formatMerchant() response.
     *
     * We intentionally select "*" from the single merchant row and
     * only expose the safe fields below. This avoids coupling this
     * route to every historical merchant-schema column while still
     * preventing sensitive fields such as password_hash from being
     * returned to the browser.
     */
    if (
      action ===
      "getMerchantDetail"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: merchant,
        error,
      } =
        await supabase
          .from("merchants")
          .select("*")
          .eq(
            "merchant_id",
            merchantId
          )
          .maybeSingle();

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT DETAIL FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            reason:
              error.message,
          }
        );

        return null;
      }

      if (!merchant) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Merchant not found",
            message:
              "Merchant not found",
          },
          {
            status: 404,
          }
        );
      }

      const row =
        merchant as Record<
          string,
          unknown
        >;

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const toBoolean = (
        value: unknown
      ) => {
        if (
          typeof value ===
          "boolean"
        ) {
          return value;
        }

        return [
          "YES",
          "TRUE",
          "1",
          "ACTIVE",
        ].includes(
          cleanText(
            value
          ).toUpperCase()
        );
      };

      const numberOr = (
        value: unknown,
        fallback: number
      ) => {
        const parsed =
          Number(value);

        return Number.isFinite(
          parsed
        )
          ? parsed
          : fallback;
      };

      const payload = {
        merchantId:
          cleanText(
            row.merchant_id
          ),

        businessName:
          cleanText(
            row.business_name
          ),

        displayName:
          cleanText(
            row.display_name ||
              row.business_name
          ),

        loginEmail:
          cleanText(
            row.login_email
          ),

        phone:
          String(
            row.phone ?? ""
          ),

        ownerPhone:
          String(
            row.owner_phone ??
              row.phone ??
              ""
          ),

        category:
          cleanText(
            row.category
          ),

        address:
          cleanText(
            row.address
          ),

        description:
          cleanText(
            row.description
          ),

        promotion: {
          active:
            toBoolean(
              row.promotion_active
            ),

          title:
            cleanText(
              row.promotion_title
            ),

          description:
            cleanText(
              row.promotion_description
            ),

          endDate:
            row.promotion_end_date ??
            "",
        },

        postcode:
          cleanText(
            row.postcode
          ),

        city:
          cleanText(
            row.city
          ),

        state:
          cleanText(
            row.state
          ),

        openingHours:
          cleanText(
            row.opening_hours
          ),

        openTime:
          row.open_time ??
          "",

        closeTime:
          row.close_time ??
          "",

        restDay:
          cleanText(
            row.rest_day
          ),

        logoUrl:
          cleanText(
            row.logo_url
          ),

        bannerUrl:
          cleanText(
            row.banner_url
          ),

        bankName:
          cleanText(
            row.bank_name
          ),

        bankAccountName:
          cleanText(
            row.bank_account_name
          ),

        bankAccountNo:
          String(
            row.bank_account_no ??
              ""
          ),

        bankQrUrl:
          cleanText(
            row.bank_qr_url
          ),

        marketingBudget:
          numberOr(
            row.marketing_budget,
            5
          ),

        rewardCreditEnabled:
          toBoolean(
            row.reward_credit_enabled
          ),

        acceptRewardCredits:
          toBoolean(
            row.reward_credit_enabled
          ),

        maxRewardCreditPercent:
          numberOr(
            row.max_reward_credit_percent,
            30
          ),

        referredByMember:
          cleanText(
            row.referred_by_member_id
          ),

        referredByMemberName:
          cleanText(
            row.referred_by_member_name
          ),

        status:
          cleanText(
            row.status
          ),

        createdAt:
          row.created_at ??
          "",

        updatedAt:
          row.updated_at ??
          "",
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          status:
            payload.status,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant detail loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MERCHANT REVIEWS
     * ============================================================
     *
     * Mirrors the existing Apps Script getMerchantReviews():
     * - merchantId is required
     * - only Published reviews are returned
     * - blank/null status is treated as Published
     * - pinned reviews first, then newest first
     * - member display_name/full_name is attached as memberName
     * - averageRating / repliedReviews / pendingReplies are preserved
     *
     * A Supabase query failure returns null so the existing
     * Apps Script fallback remains available.
     */
    if (
      action ===
      "getMerchantReviews"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type MerchantReviewRow = {
        review_id:
          string | null;
        transaction_id:
          string | null;
        member_id:
          string | null;
        merchant_id:
          string | null;
        rating:
          number | string | null;
        comment:
          string | null;
        merchant_reply:
          string | null;
        status:
          string | null;
        is_pinned:
          boolean | string | number | null;
        created_at:
          string | null;
        updated_at:
          string | null;
      };

      type ReviewMemberRow = {
        member_id:
          string | null;
        display_name:
          string | null;
        full_name:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const toBoolean = (
        value: unknown
      ) => {
        if (
          value === true ||
          value === 1
        ) {
          return true;
        }

        return [
          "TRUE",
          "YES",
          "Y",
          "1",
        ].includes(
          cleanText(
            value
          ).toUpperCase()
        );
      };

      const round2 = (
        value: number
      ) =>
        Math.round(
          (
            value +
            Number.EPSILON
          ) * 100
        ) / 100;

      const reviewResult =
        await supabase
          .from(
            "merchant_reviews"
          )
          .select(
            "review_id,transaction_id,member_id,merchant_id,rating,comment,merchant_reply,status,is_pinned,created_at,updated_at"
          )
          .eq(
            "merchant_id",
            merchantId
          );

      if (
        reviewResult.error
      ) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT REVIEWS FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            reason:
              reviewResult.error.message,
          }
        );

        return null;
      }

      const publishedRows =
        (
          (reviewResult.data ||
            []) as MerchantReviewRow[]
        )
          .filter((row) => {
            const status =
              cleanText(
                row.status ||
                "Published"
              ).toUpperCase();

            return (
              status ===
              "PUBLISHED"
            );
          })
          .sort(
            (
              first,
              second
            ) => {
              const firstPinned =
                toBoolean(
                  first.is_pinned
                );

              const secondPinned =
                toBoolean(
                  second.is_pinned
                );

              if (
                firstPinned !==
                secondPinned
              ) {
                return firstPinned
                  ? -1
                  : 1;
              }

              const firstTime =
                first.created_at
                  ? new Date(
                      first.created_at
                    ).getTime()
                  : 0;

              const secondTime =
                second.created_at
                  ? new Date(
                      second.created_at
                    ).getTime()
                  : 0;

              return (
                secondTime -
                firstTime
              );
            }
          );

      const memberIds =
        Array.from(
          new Set(
            publishedRows
              .map((row) =>
                cleanText(
                  row.member_id
                )
              )
              .filter(Boolean)
          )
        );

      const memberMap:
        Record<
          string,
          string
        > = {};

      if (
        memberIds.length > 0
      ) {
        const memberResult =
          await supabase
            .from("members")
            .select(
              "member_id,display_name,full_name"
            )
            .in(
              "member_id",
              memberIds
            );

        if (
          memberResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE MERCHANT REVIEWS MEMBER LOOKUP FALLBACK:",
            {
              requestId,
              action,
              merchantId,
              reason:
                memberResult.error.message,
            }
          );

          return null;
        }

        (
          (memberResult.data ||
            []) as ReviewMemberRow[]
        ).forEach(
          (member) => {
            const id =
              cleanText(
                member.member_id
              );

            if (!id) {
              return;
            }

            memberMap[id] =
              cleanText(
                member.display_name
              ) ||
              cleanText(
                member.full_name
              ) ||
              "Member";
          }
        );
      }

      const reviews =
        publishedRows.map(
          (row) => {
            const reviewMemberId =
              cleanText(
                row.member_id
              );

            return {
              reviewId:
                row.review_id ||
                "",

              transactionId:
                row.transaction_id ||
                "",

              memberId:
                reviewMemberId,

              memberName:
                memberMap[
                  reviewMemberId
                ] ||
                "Member",

              merchantId:
                row.merchant_id ||
                merchantId,

              rating:
                Number(
                  row.rating || 0
                ),

              comment:
                row.comment ||
                "",

              merchantReply:
                row.merchant_reply ||
                "",

              status:
                row.status ||
                "",

              isPinned:
                toBoolean(
                  row.is_pinned
                ),

              createdAt:
                row.created_at ||
                "",

              updatedAt:
                row.updated_at ||
                "",
            };
          }
        );

      const totalReviews =
        reviews.length;

      const totalRating =
        reviews.reduce(
          (
            total,
            review
          ) =>
            total +
            Number(
              review.rating ||
              0
            ),
          0
        );

      const repliedReviews =
        reviews.reduce(
          (
            total,
            review
          ) =>
            cleanText(
              review.merchantReply
            )
              ? total + 1
              : total,
          0
        );

      const averageRating =
        totalReviews > 0
          ? round2(
              totalRating /
                totalReviews
            )
          : 0;

      const payload = {
        merchantId,
        averageRating,
        totalReviews,
        repliedReviews,
        pendingReplies:
          totalReviews -
          repliedReviews,
        reviews,
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          totalReviews,
          averageRating,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant reviews loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MERCHANT GALLERY
     * ============================================================
     *
     * Mirrors the Apps Script getMerchantGallery():
     * - merchantId required
     * - only Active rows
     * - blank/null status is treated as Active
     * - sort by sort_order ascending (blank => 999)
     * - response shape remains unchanged
     */
    if (
      action ===
      "getMerchantGallery"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type MerchantGalleryRow = {
        gallery_id:
          string | null;
        merchant_id:
          string | null;
        image_url:
          string | null;
        title:
          string | null;
        sort_order:
          number | string | null;
        status:
          string | null;
        created_at:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "merchant_gallery"
          )
          .select(
            "gallery_id,merchant_id,image_url,title,sort_order,status,created_at"
          )
          .eq(
            "merchant_id",
            merchantId
          );

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT GALLERY FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            reason:
              error.message,
          }
        );

        return null;
      }

      const gallery =
        (
          (data ||
            []) as MerchantGalleryRow[]
        )
          .filter((row) => {
            const status =
              cleanText(
                row.status ||
                "Active"
              );

            return (
              status ===
              "Active"
            );
          })
          .sort(
            (
              first,
              second
            ) => {
              const firstSort =
                first.sort_order ===
                  null ||
                first.sort_order ===
                  undefined ||
                cleanText(
                  first.sort_order
                ) === ""
                  ? 999
                  : Number(
                      first.sort_order
                    );

              const secondSort =
                second.sort_order ===
                  null ||
                second.sort_order ===
                  undefined ||
                cleanText(
                  second.sort_order
                ) === ""
                  ? 999
                  : Number(
                      second.sort_order
                    );

              return (
                firstSort -
                secondSort
              );
            }
          )
          .map((row) => ({
            galleryId:
              row.gallery_id ||
              "",

            merchantId:
              row.merchant_id ||
              merchantId,

            imageUrl:
              row.image_url ||
              "",

            title:
              row.title ||
              "",

            sortOrder:
              Number(
                row.sort_order ||
                0
              ),

            status:
              row.status ||
              "",

            createdAt:
              row.created_at ||
              "",
          }));

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          count:
            gallery.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant gallery loaded",

            data: {
              merchantId,
              gallery,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MERCHANT PRODUCTS
     * ============================================================
     *
     * Public merchant product listing:
     * - merchantId required
     * - only Active products are returned
     * - blank/null status is treated as Active
     * - featured first
     * - then sort_order ascending
     * - then newest first
     * - gallery jsonb is normalized to string[]
     * - effectivePrice / hasSale are calculated
     * - shipping fields are preserved
     *
     * Any Supabase read failure returns null so the existing
     * Apps Script fallback remains available.
     */
    if (
      action ===
      "getMerchantProducts"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type MerchantProductRow = {
        product_id:
          string | null;
        merchant_id:
          string | null;
        product_type:
          string | null;
        product_name:
          string | null;
        short_description:
          string | null;
        description:
          string | null;
        category:
          string | null;
        price:
          number | string | null;
        sale_price:
          number | string | null;
        image_url:
          string | null;
        gallery:
          unknown;
        stock:
          number | string | null;
        points_earned:
          number | string | null;
        status:
          string | null;
        sort_order:
          number | string | null;
        is_featured:
          boolean | string | number | null;
        shipping_type:
          string | null;
        shipping_fee:
          number | string | null;
        created_at:
          string | null;
        updated_at:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const toBoolean = (
        value: unknown
      ) => {
        if (
          value === true ||
          value === 1
        ) {
          return true;
        }

        return [
          "TRUE",
          "YES",
          "Y",
          "1",
        ].includes(
          cleanText(
            value
          ).toUpperCase()
        );
      };

      const toNumber = (
        value: unknown,
        fallback = 0
      ) => {
        const parsed =
          Number(value);

        return Number.isFinite(
          parsed
        )
          ? parsed
          : fallback;
      };

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            toNumber(value) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const normalizeGallery = (
        value: unknown
      ): string[] => {
        if (
          Array.isArray(value)
        ) {
          return value
            .map((item) =>
              cleanText(item)
            )
            .filter(Boolean);
        }

        if (
          value &&
          typeof value ===
            "object"
        ) {
          const objectValue =
            value as Record<
              string,
              unknown
            >;

          const nested =
            objectValue.images ||
            objectValue.gallery ||
            objectValue.urls;

          if (
            Array.isArray(nested)
          ) {
            return nested
              .map((item) =>
                cleanText(item)
              )
              .filter(Boolean);
          }
        }

        const raw =
          cleanText(value);

        if (!raw) {
          return [];
        }

        try {
          const parsed =
            JSON.parse(raw);

          if (
            Array.isArray(parsed)
          ) {
            return parsed
              .map((item) =>
                cleanText(item)
              )
              .filter(Boolean);
          }
        } catch {
          // Fall through to legacy delimited-string parsing.
        }

        return raw
          .split(/[\n,|]+/)
          .map((item) =>
            cleanText(item)
          )
          .filter(Boolean);
      };

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "merchant_products"
          )
          .select(
            [
              "product_id",
              "merchant_id",
              "product_type",
              "product_name",
              "short_description",
              "description",
              "category",
              "price",
              "sale_price",
              "image_url",
              "gallery",
              "stock",
              "points_earned",
              "status",
              "sort_order",
              "is_featured",
              "shipping_type",
              "shipping_fee",
              "created_at",
              "updated_at",
            ].join(",")
          )
          .eq(
            "merchant_id",
            merchantId
          );

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT PRODUCTS FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            reason:
              error.message,
          }
        );

        return null;
      }

      const products =
        (
          (data ||
            []) as unknown as MerchantProductRow[]
        )
          .filter((row) => {
            const status =
              cleanText(
                row.status ||
                "Active"
              ).toUpperCase();

            return (
              status ===
              "ACTIVE"
            );
          })
          .sort(
            (
              first,
              second
            ) => {
              const firstFeatured =
                toBoolean(
                  first.is_featured
                );

              const secondFeatured =
                toBoolean(
                  second.is_featured
                );

              if (
                firstFeatured !==
                secondFeatured
              ) {
                return firstFeatured
                  ? -1
                  : 1;
              }

              const firstSort =
                first.sort_order ===
                  null ||
                first.sort_order ===
                  undefined ||
                cleanText(
                  first.sort_order
                ) === ""
                  ? 999
                  : toNumber(
                      first.sort_order,
                      999
                    );

              const secondSort =
                second.sort_order ===
                  null ||
                second.sort_order ===
                  undefined ||
                cleanText(
                  second.sort_order
                ) === ""
                  ? 999
                  : toNumber(
                      second.sort_order,
                      999
                    );

              if (
                firstSort !==
                secondSort
              ) {
                return (
                  firstSort -
                  secondSort
                );
              }

              const firstTime =
                first.created_at
                  ? new Date(
                      first.created_at
                    ).getTime()
                  : 0;

              const secondTime =
                second.created_at
                  ? new Date(
                      second.created_at
                    ).getTime()
                  : 0;

              return (
                secondTime -
                firstTime
              );
            }
          )
          .map((row) => {
            const price =
              round2(
                row.price
              );

            const salePrice =
              round2(
                row.sale_price
              );

            const hasSale =
              salePrice > 0 &&
              (
                price <= 0 ||
                salePrice <
                  price
              );

            const effectivePrice =
              hasSale
                ? salePrice
                : price;

            return {
              productId:
                row.product_id ||
                "",

              merchantId:
                row.merchant_id ||
                merchantId,

              productType:
                cleanText(
                  row.product_type ||
                  "PRODUCT"
                ).toUpperCase(),

              productName:
                row.product_name ||
                "",

              shortDescription:
                row.short_description ||
                "",

              description:
                row.description ||
                "",

              category:
                row.category ||
                "",

              price,

              salePrice,

              effectivePrice,

              hasSale,

              imageUrl:
                row.image_url ||
                "",

              gallery:
                normalizeGallery(
                  row.gallery
                ),

              stock:
                Math.max(
                  0,
                  Math.floor(
                    toNumber(
                      row.stock
                    )
                  )
                ),

              pointsEarned:
                round2(
                  row.points_earned
                ),

              status:
                row.status ||
                "",

              sortOrder:
                Math.max(
                  0,
                  Math.floor(
                    toNumber(
                      row.sort_order
                    )
                  )
                ),

              isFeatured:
                toBoolean(
                  row.is_featured
                ),

              shippingType:
                row.shipping_type ||
                "",

              shippingFee:
                round2(
                  row.shipping_fee
                ),

              createdAt:
                row.created_at ||
                "",

              updatedAt:
                row.updated_at ||
                "",
            };
          });

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          count:
            products.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant products loaded",

            data: {
              merchantId,
              products,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * CHECK FAVOURITE MERCHANT
     * ============================================================
     *
     * Mirrors Apps Script checkFavouriteMerchant():
     * - memberId required
     * - merchantId required
     * - MEMBER_FAVOURITES -> public.member_favourites
     * - blank/null status is treated as Active
     * - response shape remains unchanged
     *
     * Supabase query errors return null so the existing Apps Script
     * fallback remains available.
     */
    if (
      action ===
      "checkFavouriteMerchant"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type MemberFavouriteRow = {
        favourite_id:
          string | null;
        member_id:
          string | null;
        merchant_id:
          string | null;
        status:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "member_favourites"
          )
          .select(
            "favourite_id,member_id,merchant_id,status"
          )
          .eq(
            "member_id",
            memberId
          )
          .eq(
            "merchant_id",
            merchantId
          );

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE CHECK FAVOURITE FALLBACK:",
          {
            requestId,
            action,
            memberId,
            merchantId,
            reason:
              error.message,
          }
        );

        return null;
      }

      const isFavourite =
        (
          (data ||
            []) as MemberFavouriteRow[]
        ).some((row) => {
          const status =
            cleanText(
              row.status ||
              "Active"
            );

          return (
            status ===
            "Active"
          );
        });

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          merchantId,
          isFavourite,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Favourite status loaded",

            data: {
              memberId,
              merchantId,
              isFavourite,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * TOGGLE FAVOURITE MERCHANT
     * ============================================================
     *
     * PostgreSQL write migration for member_favourites.
     *
     * Behaviour:
     * - memberId required
     * - merchantId required
     * - if an Active favourite exists -> set it Inactive
     * - otherwise reactivate an existing row when possible
     * - otherwise create a new favourite row
     * - response returns the new isFavourite state
     *
     * Supabase errors return null so the existing Apps Script
     * implementation remains available as fallback during migration.
     */
    if (
      action ===
      "toggleFavouriteMerchant"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type FavouriteToggleRow = {
        id:
          number | string | null;
        favourite_id:
          string | null;
        member_id:
          string | null;
        merchant_id:
          string | null;
        status:
          string | null;
        created_at:
          string | null;
        updated_at:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const existingResult =
        await supabase
          .from(
            "member_favourites"
          )
          .select(
            "id,favourite_id,member_id,merchant_id,status,created_at,updated_at"
          )
          .eq(
            "member_id",
            memberId
          )
          .eq(
            "merchant_id",
            merchantId
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (
        existingResult.error
      ) {
        console.warn(
          "REWARDHUB SUPABASE TOGGLE FAVOURITE LOOKUP FALLBACK:",
          {
            requestId,
            action,
            memberId,
            merchantId,
            reason:
              existingResult.error.message,
          }
        );

        return null;
      }

      const existingRows =
        (
          existingResult.data ||
          []
        ) as unknown as FavouriteToggleRow[];

      const activeRow =
        existingRows.find(
          (row) => {
            const status =
              cleanText(
                row.status ||
                "Active"
              ).toUpperCase();

            return (
              status ===
              "ACTIVE"
            );
          }
        );

      const nowIso =
        new Date().toISOString();

      let isFavourite =
        false;

      let favouriteId =
        "";

      if (activeRow) {
        favouriteId =
          cleanText(
            activeRow.favourite_id
          );

        const updateResult =
          await supabase
            .from(
              "member_favourites"
            )
            .update({
              status:
                "Inactive",
              updated_at:
                nowIso,
            })
            .eq(
              "id",
              activeRow.id
            )
            .select(
              "favourite_id,status"
            )
            .maybeSingle();

        if (
          updateResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE TOGGLE FAVOURITE DEACTIVATE FALLBACK:",
            {
              requestId,
              action,
              memberId,
              merchantId,
              reason:
                updateResult.error.message,
            }
          );

          return null;
        }

        isFavourite =
          false;
      } else {
        const reusableRow =
          existingRows[0];

        if (reusableRow) {
          favouriteId =
            cleanText(
              reusableRow.favourite_id
            );

          const reactivateResult =
            await supabase
              .from(
                "member_favourites"
              )
              .update({
                status:
                  "Active",
                updated_at:
                  nowIso,
              })
              .eq(
                "id",
                reusableRow.id
              )
              .select(
                "favourite_id,status"
              )
              .maybeSingle();

          if (
            reactivateResult.error
          ) {
            console.warn(
              "REWARDHUB SUPABASE TOGGLE FAVOURITE REACTIVATE FALLBACK:",
              {
                requestId,
                action,
                memberId,
                merchantId,
                reason:
                  reactivateResult.error.message,
              }
            );

            return null;
          }

          isFavourite =
            true;
        } else {
          favouriteId =
            `FAV${Date.now()}`;

          const insertResult =
            await supabase
              .from(
                "member_favourites"
              )
              .insert({
                favourite_id:
                  favouriteId,
                member_id:
                  memberId,
                merchant_id:
                  merchantId,
                status:
                  "Active",
                created_at:
                  nowIso,
                updated_at:
                  nowIso,
              })
              .select(
                "favourite_id,status"
              )
              .maybeSingle();

          if (
            insertResult.error
          ) {
            console.warn(
              "REWARDHUB SUPABASE TOGGLE FAVOURITE INSERT FALLBACK:",
              {
                requestId,
                action,
                memberId,
                merchantId,
                reason:
                  insertResult.error.message,
              }
            );

            return null;
          }

          isFavourite =
            true;
        }
      }

      console.log(
        "REWARDHUB SUPABASE WRITE SUCCESS:",
        {
          requestId,
          action,
          memberId,
          merchantId,
          favouriteId,
          isFavourite,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              isFavourite
                ? "Merchant added to favourites"
                : "Merchant removed from favourites",

            data: {
              memberId,
              merchantId,
              favouriteId,
              isFavourite,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MERCHANT RATING
     * ============================================================
     *
     * Mirrors Apps Script getMerchantRating():
     * - merchantId required
     * - only Published reviews count
     * - blank/null status is treated as Published
     * - only ratings from 1 through 5 are valid
     * - response returns average and total
     *
     * Supabase read errors return null so the existing Apps Script
     * implementation remains available as migration fallback.
     */
    if (
      action ===
      "getMerchantRating"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      type MerchantRatingRow = {
        rating:
          number | string | null;
        status:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const round2 = (
        value: number
      ) =>
        Math.round(
          (
            value +
            Number.EPSILON
          ) * 100
        ) / 100;

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "merchant_reviews"
          )
          .select(
            "rating,status"
          )
          .eq(
            "merchant_id",
            merchantId
          );

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT RATING FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            reason:
              error.message,
          }
        );

        return null;
      }

      const validReviews =
        (
          (data ||
            []) as unknown as MerchantRatingRow[]
        ).filter((row) => {
          const status =
            cleanText(
              row.status ||
              "Published"
            );

          const rating =
            Number(
              row.rating || 0
            );

          return (
            status ===
              "Published" &&
            rating >= 1 &&
            rating <= 5
          );
        });

      const total =
        validReviews.length;

      let average =
        0;

      if (total > 0) {
        const ratingTotal =
          validReviews.reduce(
            (
              sum,
              row
            ) =>
              sum +
              Number(
                row.rating ||
                0
              ),
            0
          );

        average =
          ratingTotal /
          total;
      }

      const payload = {
        merchantId,
        average:
          round2(
            average
          ),
        total,
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          average:
            payload.average,
          total:
            payload.total,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant rating loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


      /*
 * ============================================================
 * MEMBER POINTS HISTORY
 * ============================================================
 */

if (
  action ===
  "getMemberPointsHistory"
) {
  const requestedLimit =
    typeof body.limit === "number"
      ? body.limit
      : typeof body.limit === "string"
        ? Number(body.limit)
        : 50;

  const limit =
    Number.isFinite(
      requestedLimit
    ) &&
    requestedLimit > 0
      ? Math.min(
          Math.floor(
            requestedLimit
          ),
          200
        )
      : 50;

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "points_history"
      )
      .select(
        "point_id,member_id,transaction_id,type,source,source_id,points,balance_after,description,created_at"
      )
      .eq(
        "member_id",
        memberId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(
        limit
      );

  if (error) {
    console.warn(
      "REWARDHUB SUPABASE POINTS HISTORY FALLBACK:",
      {
        requestId,
        action,
        memberId,
        reason:
          error.message,
      }
    );

    return null;
  }

  const history =
    (data || []).map(
      (rawRow) => {
        const row =
          rawRow as {
            point_id:
              string | null;
            member_id:
              string | null;
            transaction_id:
              string | null;
            type:
              string | null;
            source:
              string | null;
            source_id:
              string | null;
            points:
              number |
              string |
              null;
            balance_after:
              number |
              string |
              null;
            description:
              string | null;
            created_at:
              string | null;
          };

        return {
          pointId:
            row.point_id ||
            "",

          memberId:
            row.member_id ||
            memberId,

          transactionId:
            row.transaction_id ||
            "",

          type:
            row.type ||
            "",

          source:
            row.source ||
            "",

          sourceId:
            row.source_id ||
            "",

          points:
            Number(
              row.points ||
              0
            ),

          balanceAfter:
            Number(
              row.balance_after ||
              0
            ),

          description:
            row.description ||
            "",

          createdAt:
            row.created_at ||
            "",
        };
      }
    );

  console.log(
    "REWARDHUB SUPABASE READ SUCCESS:",
    {
      requestId,
      action,
      memberId,
      count:
        history.length,
    }
  );

  return NextResponse.json(
    {
      success: true,

      data: {
        message:
          "Member points history loaded",

        data: {
          memberId,
          history,
        },
      },

      requestId,
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma:
          "no-cache",
      },
    }
  );
}



    /*
     * ============================================================
     * MERCHANT ORDERS
     * ============================================================
     *
     * Phase 9K-2 Supabase-first migration for getMerchantOrders().
     *
     * Mirrors the existing Apps Script response:
     * - merchantId required
     * - optional order status filter
     * - newest orders first
     * - maximum 200 rows
     * - order output matches orderFormatOrder_()
     * - empty Supabase result is still a valid SUPABASE result
     *
     * Only a real Supabase query failure falls back to Apps Script.
     */
    if (
      action ===
      "getMerchantOrders"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      const status =
        typeof body.status ===
        "string"
          ? body.status
              .trim()
              .toUpperCase()
          : "";

      const requestedLimit =
        typeof body.limit ===
        "number"
          ? body.limit
          : typeof body.limit ===
              "string"
            ? Number(body.limit)
            : 100;

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              200,
              Math.max(
                1,
                Math.floor(
                  requestedLimit
                )
              )
            )
          : 100;

      type MerchantOrderRow = {
        id?: number | string | null;
        order_id?: string | null;
        member_id?: string | null;
        merchant_id?: string | null;
        transaction_id?: string | null;
        order_amount?: number | string | null;
        cashback?: number | string | null;
        reward_credits_used?: number | string | null;
        pay_amount?: number | string | null;
        points_earned?: number | string | null;
        member_tier?: string | null;
        cashback_rate?: number | string | null;
        marketing_rate?: number | string | null;
        marketing_amount?: number | string | null;
        payment_method?: string | null;
        payment_status?: string | null;
        order_status?: string | null;
        receipt_url?: string | null;
        member_note?: string | null;
        merchant_note?: string | null;
        bank_name?: string | null;
        bank_account_name?: string | null;
        bank_account_no?: string | number | null;
        bank_qr_url?: string | null;
        fulfillment_method?: string | null;
        recipient_name?: string | null;
        recipient_phone?: string | number | null;
        shipping_address_line_1?: string | null;
        shipping_address_line_2?: string | null;
        shipping_area?: string | null;
        shipping_state?: string | null;
        shipping_postcode?: string | number | null;
        shipping_country?: string | null;
        delivery_note?: string | null;
        fulfillment_status?: string | null;
        shipping_fee?: number | string | null;
        total_amount?: number | string | null;
        receipt_uploaded_at?: string | null;
        confirmed_at?: string | null;
        cancelled_at?: string | null;
        fulfillment_updated_at?: string | null;
        completed_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const toNumber = (
        value: unknown,
        fallback = 0
      ) => {
        const parsed =
          Number(value);

        return Number.isFinite(
          parsed
        )
          ? parsed
          : fallback;
      };

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            toNumber(value) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const normalizeDeliveryMethod = (
        value: unknown
      ) => {
        const method =
          cleanText(
            value || "DELIVERY"
          )
            .toUpperCase()
            .replace(
              /\s+/g,
              "_"
            );

        if (
          [
            "SELF_PICKUP",
            "PICKUP",
            "COLLECTION",
            "SELF_COLLECTION",
          ].includes(method)
        ) {
          return "SELF_PICKUP";
        }

        return "DELIVERY";
      };

      const normalizeFulfillmentStatus = (
        value: unknown
      ) =>
        cleanText(
          value || "PENDING"
        )
          .toUpperCase()
          .replace(
            /\s+/g,
            "_"
          );

      const buildFullAddress = (
        row: MerchantOrderRow
      ) => {
        const cityLine = [
          cleanText(
            row.shipping_postcode
          ),
          cleanText(
            row.shipping_area
          ),
        ]
          .filter(Boolean)
          .join(" ");

        return [
          cleanText(
            row.shipping_address_line_1
          ),
          cleanText(
            row.shipping_address_line_2
          ),
          cityLine,
          cleanText(
            row.shipping_state
          ),
          cleanText(
            row.shipping_country
          ),
        ]
          .filter(Boolean)
          .join(", ");
      };

      let query =
        supabase
          .from("member_orders")
          .select("*")
          .eq(
            "merchant_id",
            merchantId
          );

      if (status) {
        query =
          query.eq(
            "order_status",
            status
          );
      }

      const orderResult =
        await query
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(limit);

      if (orderResult.error) {
        console.warn(
          "REWARDHUB SUPABASE MERCHANT ORDERS FALLBACK:",
          {
            requestId,
            action,
            merchantId,
            status,
            reason:
              orderResult.error.message,
          }
        );

        return null;
      }

      const orders =
        (
          (orderResult.data ||
            []) as MerchantOrderRow[]
        ).map((row) => {
          const orderAmount =
            round2(
              row.order_amount
            );

          const shippingFee =
            round2(
              row.shipping_fee
            );

          const rawTotalAmount =
            cleanText(
              row.total_amount
            );

          return {
            orderId:
              cleanText(
                row.order_id
              ),

            memberId:
              cleanText(
                row.member_id
              ),

            merchantId:
              cleanText(
                row.merchant_id
              ),

            transactionId:
              cleanText(
                row.transaction_id
              ),

            orderAmount,

            subtotal:
              orderAmount,

            shippingFee,

            totalAmount:
              rawTotalAmount !== ""
                ? round2(
                    row.total_amount
                  )
                : round2(
                    orderAmount +
                      shippingFee
                  ),

            cashback:
              round2(
                row.cashback
              ),

            rewardCreditsUsed:
              round2(
                row.reward_credits_used
              ),

            payAmount:
              round2(
                row.pay_amount
              ),

            pointsEarned:
              toNumber(
                row.points_earned
              ),

            memberTier:
              cleanText(
                row.member_tier
              ),

            cashbackRate:
              toNumber(
                row.cashback_rate
              ),

            marketingRate:
              toNumber(
                row.marketing_rate
              ),

            marketingAmount:
              round2(
                row.marketing_amount
              ),

            paymentMethod:
              cleanText(
                row.payment_method
              ),

            paymentStatus:
              cleanText(
                row.payment_status
              ),

            orderStatus:
              cleanText(
                row.order_status
              ),

            receiptUrl:
              cleanText(
                row.receipt_url
              ),

            memberNote:
              cleanText(
                row.member_note
              ),

            merchantNote:
              cleanText(
                row.merchant_note
              ),

            deliveryMethod:
              normalizeDeliveryMethod(
                row.fulfillment_method
              ),

            fulfillmentStatus:
              normalizeFulfillmentStatus(
                row.fulfillment_status
              ),

            fulfillmentUpdatedAt:
              row.fulfillment_updated_at ||
              "",

            recipientName:
              cleanText(
                row.recipient_name
              ),

            recipientPhone:
              cleanText(
                row.recipient_phone
              ),

            addressLine1:
              cleanText(
                row.shipping_address_line_1
              ),

            addressLine2:
              cleanText(
                row.shipping_address_line_2
              ),

            area:
              cleanText(
                row.shipping_area
              ),

            state:
              cleanText(
                row.shipping_state
              ),

            postcode:
              cleanText(
                row.shipping_postcode
              ),

            country:
              cleanText(
                row.shipping_country
              ),

            deliveryNote:
              cleanText(
                row.delivery_note ||
                  row.member_note
              ),

            fullAddress:
              buildFullAddress(row),

            bankName:
              cleanText(
                row.bank_name
              ),

            bankAccountName:
              cleanText(
                row.bank_account_name
              ),

            bankAccountNo:
              cleanText(
                row.bank_account_no
              ),

            bankQrUrl:
              cleanText(
                row.bank_qr_url
              ),

            createdAt:
              row.created_at ||
              "",

            receiptUploadedAt:
              row.receipt_uploaded_at ||
              "",

            confirmedAt:
              row.confirmed_at ||
              "",

            completedAt:
              row.completed_at ||
              "",

            cancelledAt:
              row.cancelled_at ||
              "",

            updatedAt:
              row.updated_at ||
              "",
          };
        });

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          status,
          count:
            orders.length,
          source:
            "SUPABASE",
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant orders loaded",

            data: {
              merchantId,
              total:
                orders.length,
              orders,
              source:
                "SUPABASE",
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER ORDER DETAIL
     * ============================================================
     *
     * Phase 9K-3 Supabase-first migration for
     * getMemberOrderDetail().
     *
     * Mirrors the existing Apps Script response:
     * - memberId required
     * - orderId required
     * - verifies the order belongs to the member
     * - order output matches orderFormatOrder_()
     * - item output matches orderMapSupabaseItemToOutput_()
     * - source is SUPABASE when both order + items are read here
     *
     * Compatibility rule:
     * - missing order or missing item snapshots returns null so
     *   Apps Script can perform its existing Sheets fallback.
     * - only READ behaviour is migrated here; receipt upload and
     *   cancellation remain on their existing mutation path.
     */
    if (
      action ===
      "getMemberOrderDetail"
    ) {
      const orderId =
        typeof body.orderId ===
        "string"
          ? body.orderId.trim()
          : "";

      if (!orderId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing orderId",
            message:
              "Missing orderId",
          },
          {
            status: 400,
          }
        );
      }

      type MemberOrderDetailRow = {
        id?: number | string | null;
        order_id?: string | null;
        member_id?: string | null;
        merchant_id?: string | null;
        transaction_id?: string | null;
        order_amount?: number | string | null;
        cashback?: number | string | null;
        reward_credits_used?: number | string | null;
        pay_amount?: number | string | null;
        points_earned?: number | string | null;
        member_tier?: string | null;
        cashback_rate?: number | string | null;
        marketing_rate?: number | string | null;
        marketing_amount?: number | string | null;
        payment_method?: string | null;
        payment_status?: string | null;
        order_status?: string | null;
        receipt_url?: string | null;
        member_note?: string | null;
        merchant_note?: string | null;
        bank_name?: string | null;
        bank_account_name?: string | null;
        bank_account_no?: string | number | null;
        bank_qr_url?: string | null;
        fulfillment_method?: string | null;
        recipient_name?: string | null;
        recipient_phone?: string | number | null;
        shipping_address_line_1?: string | null;
        shipping_address_line_2?: string | null;
        shipping_area?: string | null;
        shipping_state?: string | null;
        shipping_postcode?: string | number | null;
        shipping_country?: string | null;
        delivery_note?: string | null;
        fulfillment_status?: string | null;
        shipping_fee?: number | string | null;
        total_amount?: number | string | null;
        receipt_uploaded_at?: string | null;
        confirmed_at?: string | null;
        cancelled_at?: string | null;
        fulfillment_updated_at?: string | null;
        completed_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      };

      type MemberOrderItemRow = {
        id?: number | string | null;
        order_item_id?: string | null;
        order_id?: string | null;
        member_id?: string | null;
        merchant_id?: string | null;
        product_id?: string | null;
        product_type?: string | null;
        product_name?: string | null;
        category?: string | null;
        image_url?: string | null;
        unit_price?: number | string | null;
        original_price?: number | string | null;
        quantity?: number | string | null;
        subtotal?: number | string | null;
        shipping_type?: string | null;
        shipping_fee?: number | string | null;
        points_per_unit?: number | string | null;
        total_points?: number | string | null;
        created_at?: string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const toNumber = (
        value: unknown,
        fallback = 0
      ) => {
        const parsed =
          Number(value);

        return Number.isFinite(
          parsed
        )
          ? parsed
          : fallback;
      };

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            toNumber(value) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const normalizeDeliveryMethod = (
        value: unknown
      ) => {
        const method =
          cleanText(
            value || "DELIVERY"
          )
            .toUpperCase()
            .replace(
              /\s+/g,
              "_"
            );

        if (
          [
            "SELF_PICKUP",
            "PICKUP",
            "COLLECTION",
            "SELF_COLLECTION",
          ].includes(method)
        ) {
          return "SELF_PICKUP";
        }

        return "DELIVERY";
      };

      const normalizeFulfillmentStatus = (
        value: unknown
      ) =>
        cleanText(
          value || "PENDING"
        )
          .toUpperCase()
          .replace(
            /\s+/g,
            "_"
          );

      const buildFullAddress = (
        row: MemberOrderDetailRow
      ) => {
        const cityLine = [
          cleanText(
            row.shipping_postcode
          ),
          cleanText(
            row.shipping_area
          ),
        ]
          .filter(Boolean)
          .join(" ");

        return [
          cleanText(
            row.shipping_address_line_1
          ),
          cleanText(
            row.shipping_address_line_2
          ),
          cityLine,
          cleanText(
            row.shipping_state
          ),
          cleanText(
            row.shipping_country
          ),
        ]
          .filter(Boolean)
          .join(", ");
      };

      const orderResult =
        await supabase
          .from("member_orders")
          .select("*")
          .eq(
            "order_id",
            orderId
          )
          .limit(1);

      if (orderResult.error) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER ORDER DETAIL FALLBACK:",
          {
            requestId,
            action,
            memberId,
            orderId,
            stage:
              "order",
            reason:
              orderResult.error.message,
          }
        );

        return null;
      }

      const rawOrder =
        (
          (orderResult.data ||
            []) as MemberOrderDetailRow[]
        )[0];

      /*
       * Preserve the legacy fallback behaviour when this order has
       * not reached Supabase yet.
       */
      if (!rawOrder) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER ORDER DETAIL FALLBACK:",
          {
            requestId,
            action,
            memberId,
            orderId,
            stage:
              "order-not-found",
            reason:
              "Order not found in Supabase.",
          }
        );

        return null;
      }

      /*
       * Match Apps Script ownership validation before returning any
       * order details.
       */
      if (
        cleanText(
          rawOrder.member_id
        ) !== memberId
      ) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Order does not belong to member",
            message:
              "Order does not belong to member",
          },
          {
            status: 400,
          }
        );
      }

      const itemResult =
        await supabase
          .from(
            "member_order_items"
          )
          .select("*")
          .eq(
            "order_id",
            orderId
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          )
          .limit(200);

      if (itemResult.error) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER ORDER DETAIL FALLBACK:",
          {
            requestId,
            action,
            memberId,
            orderId,
            stage:
              "items",
            reason:
              itemResult.error.message,
          }
        );

        return null;
      }

      const rawItems =
        (
          (itemResult.data ||
            []) as MemberOrderItemRow[]
        );

      /*
       * A valid RewardHub order is created together with item
       * snapshots. If the order exists but its items have not been
       * migrated yet, let Apps Script use its Sheets fallback rather
       * than returning an incomplete detail page.
       */
      if (rawItems.length === 0) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER ORDER DETAIL FALLBACK:",
          {
            requestId,
            action,
            memberId,
            orderId,
            stage:
              "items-empty",
            reason:
              "Order items not found in Supabase.",
          }
        );

        return null;
      }

      const orderAmount =
        round2(
          rawOrder.order_amount
        );

      const shippingFee =
        round2(
          rawOrder.shipping_fee
        );

      const rawTotalAmount =
        cleanText(
          rawOrder.total_amount
        );

      const order = {
        orderId:
          cleanText(
            rawOrder.order_id
          ),

        memberId:
          cleanText(
            rawOrder.member_id
          ),

        merchantId:
          cleanText(
            rawOrder.merchant_id
          ),

        transactionId:
          cleanText(
            rawOrder.transaction_id
          ),

        orderAmount,

        subtotal:
          orderAmount,

        shippingFee,

        totalAmount:
          rawTotalAmount !== ""
            ? round2(
                rawOrder.total_amount
              )
            : round2(
                orderAmount +
                  shippingFee
              ),

        cashback:
          round2(
            rawOrder.cashback
          ),

        rewardCreditsUsed:
          round2(
            rawOrder.reward_credits_used
          ),

        payAmount:
          round2(
            rawOrder.pay_amount
          ),

        pointsEarned:
          toNumber(
            rawOrder.points_earned
          ),

        memberTier:
          cleanText(
            rawOrder.member_tier
          ),

        cashbackRate:
          toNumber(
            rawOrder.cashback_rate
          ),

        marketingRate:
          toNumber(
            rawOrder.marketing_rate
          ),

        marketingAmount:
          round2(
            rawOrder.marketing_amount
          ),

        paymentMethod:
          cleanText(
            rawOrder.payment_method
          ),

        paymentStatus:
          cleanText(
            rawOrder.payment_status
          ),

        orderStatus:
          cleanText(
            rawOrder.order_status
          ),

        receiptUrl:
          cleanText(
            rawOrder.receipt_url
          ),

        memberNote:
          cleanText(
            rawOrder.member_note
          ),

        merchantNote:
          cleanText(
            rawOrder.merchant_note
          ),

        deliveryMethod:
          normalizeDeliveryMethod(
            rawOrder.fulfillment_method
          ),

        fulfillmentStatus:
          normalizeFulfillmentStatus(
            rawOrder.fulfillment_status
          ),

        fulfillmentUpdatedAt:
          rawOrder.fulfillment_updated_at ||
          "",

        recipientName:
          cleanText(
            rawOrder.recipient_name
          ),

        recipientPhone:
          cleanText(
            rawOrder.recipient_phone
          ),

        addressLine1:
          cleanText(
            rawOrder.shipping_address_line_1
          ),

        addressLine2:
          cleanText(
            rawOrder.shipping_address_line_2
          ),

        area:
          cleanText(
            rawOrder.shipping_area
          ),

        state:
          cleanText(
            rawOrder.shipping_state
          ),

        postcode:
          cleanText(
            rawOrder.shipping_postcode
          ),

        country:
          cleanText(
            rawOrder.shipping_country
          ),

        deliveryNote:
          cleanText(
            rawOrder.delivery_note ||
              rawOrder.member_note
          ),

        fullAddress:
          buildFullAddress(
            rawOrder
          ),

        bankName:
          cleanText(
            rawOrder.bank_name
          ),

        bankAccountName:
          cleanText(
            rawOrder.bank_account_name
          ),

        bankAccountNo:
          cleanText(
            rawOrder.bank_account_no
          ),

        bankQrUrl:
          cleanText(
            rawOrder.bank_qr_url
          ),

        createdAt:
          rawOrder.created_at ||
          "",

        receiptUploadedAt:
          rawOrder.receipt_uploaded_at ||
          "",

        confirmedAt:
          rawOrder.confirmed_at ||
          "",

        completedAt:
          rawOrder.completed_at ||
          "",

        cancelledAt:
          rawOrder.cancelled_at ||
          "",

        updatedAt:
          rawOrder.updated_at ||
          "",
      };

      const items =
        rawItems.map(
          (row) => ({
            orderItemId:
              cleanText(
                row.order_item_id
              ),

            orderId:
              cleanText(
                row.order_id
              ),

            memberId:
              cleanText(
                row.member_id
              ),

            merchantId:
              cleanText(
                row.merchant_id
              ),

            productId:
              cleanText(
                row.product_id
              ),

            productType:
              cleanText(
                row.product_type
              ),

            productName:
              cleanText(
                row.product_name
              ),

            category:
              cleanText(
                row.category
              ),

            imageUrl:
              cleanText(
                row.image_url
              ),

            unitPrice:
              round2(
                row.unit_price
              ),

            originalPrice:
              round2(
                row.original_price
              ),

            quantity:
              Math.max(
                0,
                Math.floor(
                  toNumber(
                    row.quantity
                  )
                )
              ),

            subtotal:
              round2(
                row.subtotal
              ),

            shippingType:
              cleanText(
                row.shipping_type ||
                  "NONE"
              ),

            shippingFee:
              round2(
                row.shipping_fee
              ),

            pointsPerUnit:
              toNumber(
                row.points_per_unit
              ),

            totalPoints:
              toNumber(
                row.total_points
              ),

            createdAt:
              row.created_at ||
              "",
          })
        );

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          orderId,
          itemCount:
            items.length,
          source:
            "SUPABASE",
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member order detail loaded",

            data: {
              order,
              items,
              source:
                "SUPABASE",
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * USER NOTIFICATIONS
     * ============================================================
     *
     * Mirrors 28_UserNotifications.gs:
     * - MEMBER / MERCHANT user types only
     * - unread = status !== "READ"
     * - list supports optional status and limit
     * - newest first
     * - mark one / mark all set status READ and read_at
     *
     * Supabase failures return null so Apps Script remains available
     * as migration fallback.
     */
    if (
      [
        "getMemberNotifications",
        "getMerchantNotifications",
        "getUnreadNotificationCount",
        "markNotificationRead",
        "markAllNotificationsRead",
      ].includes(action)
    ) {
      type UserNotificationRow = {
        id?: number | string | null;
        user_notification_id: string | null;
        user_type: string | null;
        user_id: string | null;
        notification_id: string | null;
        title: string | null;
        message: string | null;
        target_url: string | null;
        image_url: string | null;
        status: string | null;
        created_at: string | null;
        read_at: string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const normalizeUserType = (
        value: unknown
      ) =>
        cleanText(value).toUpperCase();

      const resolveUserType = () => {
        if (
          action ===
          "getMemberNotifications"
        ) {
          return "MEMBER";
        }

        if (
          action ===
          "getMerchantNotifications"
        ) {
          return "MERCHANT";
        }

        return normalizeUserType(
          body.userType
        );
      };

      const userType =
        resolveUserType();

      const userId =
        cleanText(
          body.userId ||
          body.memberId ||
          body.merchantId
        );

      if (
        userType !== "MEMBER" &&
        userType !== "MERCHANT"
      ) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Invalid notification user type.",
            message:
              "Invalid notification user type.",
          },
          {
            status: 400,
          }
        );
      }

      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing notification user ID.",
            message:
              "Missing notification user ID.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ------------------------------------------------------------
       * GET UNREAD COUNT
       * ------------------------------------------------------------
       */
      if (
        action ===
        "getUnreadNotificationCount"
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "user_notifications"
            )
            .select(
              "user_notification_id,status"
            )
            .eq(
              "user_type",
              userType
            )
            .eq(
              "user_id",
              userId
            );

        if (error) {
          console.warn(
            "REWARDHUB SUPABASE UNREAD NOTIFICATION COUNT FALLBACK:",
            {
              requestId,
              action,
              userType,
              userId,
              reason:
                error.message,
            }
          );

          return null;
        }

        const unreadCount =
          (
            (data ||
              []) as unknown as Pick<
              UserNotificationRow,
              | "user_notification_id"
              | "status"
            >[]
          ).filter((row) => {
            return (
              normalizeUserType(
                row.status
              ) !==
              "READ"
            );
          }).length;

        console.log(
          "REWARDHUB SUPABASE READ SUCCESS:",
          {
            requestId,
            action,
            userType,
            userId,
            unreadCount,
          }
        );

        return NextResponse.json(
          {
            success: true,

            data: {
              message:
                "Unread notification count loaded",

              data: {
                userType,
                userId,
                unreadCount,
              },
            },

            requestId,
          },
          {
            status: 200,

            headers: {
              "Cache-Control":
                "no-store, no-cache, must-revalidate",

              Pragma:
                "no-cache",
            },
          }
        );
      }

      /*
       * ------------------------------------------------------------
       * GET MEMBER / MERCHANT NOTIFICATIONS
       * ------------------------------------------------------------
       */
      if (
        action ===
          "getMemberNotifications" ||
        action ===
          "getMerchantNotifications"
      ) {
        const requestedLimit =
          typeof body.limit ===
          "number"
            ? body.limit
            : typeof body.limit ===
                "string"
              ? Number(
                  body.limit
                )
              : 100;

        let limit =
          Number.isFinite(
            requestedLimit
          ) &&
          requestedLimit > 0
            ? Math.floor(
                requestedLimit
              )
            : 100;

        if (limit > 500) {
          limit = 500;
        }

        const statusFilter =
          normalizeUserType(
            body.status
          );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "user_notifications"
            )
            .select(
              [
                "user_notification_id",
                "user_type",
                "user_id",
                "notification_id",
                "title",
                "message",
                "target_url",
                "image_url",
                "status",
                "created_at",
                "read_at",
              ].join(",")
            )
            .eq(
              "user_type",
              userType
            )
            .eq(
              "user_id",
              userId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (error) {
          console.warn(
            "REWARDHUB SUPABASE USER NOTIFICATIONS FALLBACK:",
            {
              requestId,
              action,
              userType,
              userId,
              reason:
                error.message,
            }
          );

          return null;
        }

        const filteredRows =
          (
            (data ||
              []) as unknown as UserNotificationRow[]
          ).filter((row) => {
            if (!statusFilter) {
              return true;
            }

            return (
              normalizeUserType(
                row.status
              ) ===
              statusFilter
            );
          });

        const items =
          filteredRows
            .slice(
              0,
              limit
            )
            .map((row) => {
              const status =
                normalizeUserType(
                  row.status
                ) ||
                "UNREAD";

              return {
                userNotificationId:
                  cleanText(
                    row.user_notification_id
                  ),

                notificationId:
                  cleanText(
                    row.notification_id
                  ),

                userType:
                  normalizeUserType(
                    row.user_type
                  ),

                userId:
                  cleanText(
                    row.user_id
                  ),

                title:
                  cleanText(
                    row.title
                  ),

                message:
                  cleanText(
                    row.message
                  ),

                targetUrl:
                  cleanText(
                    row.target_url
                  ),

                imageUrl:
                  cleanText(
                    row.image_url
                  ),

                status,

                isRead:
                  status ===
                  "READ",

                createdAt:
                  row.created_at ||
                  "",

                readAt:
                  row.read_at ||
                  "",
              };
            });

        const unreadCount =
          filteredRows.filter(
            (row) =>
              normalizeUserType(
                row.status
              ) !==
              "READ"
          ).length;

        console.log(
          "REWARDHUB SUPABASE READ SUCCESS:",
          {
            requestId,
            action,
            userType,
            userId,
            total:
              filteredRows.length,
            count:
              items.length,
            unreadCount,
          }
        );

        return NextResponse.json(
          {
            success: true,

            data: {
              message:
                "User notifications loaded",

              data: {
                userType,
                userId,
                total:
                  filteredRows.length,
                count:
                  items.length,
                unreadCount,
                items,
              },
            },

            requestId,
          },
          {
            status: 200,

            headers: {
              "Cache-Control":
                "no-store, no-cache, must-revalidate",

              Pragma:
                "no-cache",
            },
          }
        );
      }

      /*
       * ------------------------------------------------------------
       * MARK ONE READ
       * ------------------------------------------------------------
       */
      if (
        action ===
        "markNotificationRead"
      ) {
        const userNotificationId =
          cleanText(
            body.userNotificationId
          );

        if (
          !userNotificationId
        ) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error:
                "Missing userNotificationId",
              message:
                "Missing userNotificationId",
            },
            {
              status: 400,
            }
          );
        }

        const existingResult =
          await supabase
            .from(
              "user_notifications"
            )
            .select(
              "user_notification_id,user_type,user_id,status"
            )
            .eq(
              "user_notification_id",
              userNotificationId
            )
            .maybeSingle();

        if (
          existingResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE MARK NOTIFICATION READ LOOKUP FALLBACK:",
            {
              requestId,
              action,
              userType,
              userId,
              userNotificationId,
              reason:
                existingResult.error.message,
            }
          );

          return null;
        }

        const existing =
          existingResult.data as
            | Pick<
                UserNotificationRow,
                | "user_notification_id"
                | "user_type"
                | "user_id"
                | "status"
              >
            | null;

        if (!existing) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error:
                "Notification not found.",
              message:
                "Notification not found.",
            },
            {
              status: 404,
            }
          );
        }

        if (
          normalizeUserType(
            existing.user_type
          ) !== userType ||
          cleanText(
            existing.user_id
          ) !== userId
        ) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error:
                "Notification does not belong to this user.",
              message:
                "Notification does not belong to this user.",
            },
            {
              status: 403,
            }
          );
        }

        if (
          normalizeUserType(
            existing.status
          ) !==
          "READ"
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                "user_notifications"
              )
              .update({
                status:
                  "READ",
                read_at:
                  new Date().toISOString(),
              })
              .eq(
                "user_notification_id",
                userNotificationId
              );

          if (error) {
            console.warn(
              "REWARDHUB SUPABASE MARK NOTIFICATION READ FALLBACK:",
              {
                requestId,
                action,
                userType,
                userId,
                userNotificationId,
                reason:
                  error.message,
              }
            );

            return null;
          }
        }

        console.log(
          "REWARDHUB SUPABASE WRITE SUCCESS:",
          {
            requestId,
            action,
            userType,
            userId,
            userNotificationId,
            status:
              "READ",
          }
        );

        return NextResponse.json(
          {
            success: true,

            data: {
              message:
                "Notification marked as read",

              data: {
                userNotificationId,
                status:
                  "READ",
              },
            },

            requestId,
          },
          {
            status: 200,
          }
        );
      }

      /*
       * ------------------------------------------------------------
       * MARK ALL READ
       * ------------------------------------------------------------
       */
      if (
        action ===
        "markAllNotificationsRead"
      ) {
        const existingResult =
          await supabase
            .from(
              "user_notifications"
            )
            .select(
              "user_notification_id,status"
            )
            .eq(
              "user_type",
              userType
            )
            .eq(
              "user_id",
              userId
            );

        if (
          existingResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE MARK ALL NOTIFICATIONS LOOKUP FALLBACK:",
            {
              requestId,
              action,
              userType,
              userId,
              reason:
                existingResult.error.message,
            }
          );

          return null;
        }

        const unreadRows =
          (
            (existingResult.data ||
              []) as unknown as Pick<
              UserNotificationRow,
              | "user_notification_id"
              | "status"
            >[]
          ).filter(
            (row) =>
              normalizeUserType(
                row.status
              ) !==
              "READ"
          );

        const updatedCount =
          unreadRows.length;

        if (
          updatedCount > 0
        ) {
          const ids =
            unreadRows
              .map((row) =>
                cleanText(
                  row.user_notification_id
                )
              )
              .filter(Boolean);

          const {
            error,
          } =
            await supabase
              .from(
                "user_notifications"
              )
              .update({
                status:
                  "READ",
                read_at:
                  new Date().toISOString(),
              })
              .in(
                "user_notification_id",
                ids
              );

          if (error) {
            console.warn(
              "REWARDHUB SUPABASE MARK ALL NOTIFICATIONS FALLBACK:",
              {
                requestId,
                action,
                userType,
                userId,
                reason:
                  error.message,
              }
            );

            return null;
          }
        }

        console.log(
          "REWARDHUB SUPABASE WRITE SUCCESS:",
          {
            requestId,
            action,
            userType,
            userId,
            updatedCount,
          }
        );

        return NextResponse.json(
          {
            success: true,

            data: {
              message:
                "All notifications marked as read",

              data: {
                userType,
                userId,
                updatedCount,
              },
            },

            requestId,
          },
          {
            status: 200,
          }
        );
      }
    }


    /*
     * ============================================================
     * MEMBER REFERRAL HISTORY
     * ============================================================
     * Direct PostgreSQL read for Referral Center history.
     * Empty history is a valid result and must NOT fall back.
     * Only a Supabase query/runtime error falls back to Apps Script.
     */
    if (
      action ===
      "getMemberReferralHistory"
    ) {
      const requestedLimit =
        typeof body.limit === "number"
          ? body.limit
          : typeof body.limit === "string"
            ? Number(body.limit)
            : 50;

      const limit =
        Number.isFinite(requestedLimit) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(requestedLimit),
              200
            )
          : 50;

      const { data, error } =
        await supabase
          .from("referral_history")
          .select(
            "referral_id,member_id,referral_type,from_member_id,from_merchant_id,level,transaction_id,transaction_amount,commission_rate,amount,status,created_at"
          )
          .eq("member_id", memberId)
          .order("created_at", {
            ascending: false,
          })
          .limit(limit);

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE REFERRAL HISTORY FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason: error.message,
          }
        );

        return null;
      }

      const history =
        (data || []).map((rawRow) => {
          const row = rawRow as {
            referral_id: string | null;
            member_id: string | null;
            referral_type: string | null;
            from_member_id: string | null;
            from_merchant_id: string | null;
            level: number | string | null;
            transaction_id: string | null;
            transaction_amount: number | string | null;
            commission_rate: number | string | null;
            amount: number | string | null;
            status: string | null;
            created_at: string | null;
          };

          return {
            referralId:
              row.referral_id || "",

            memberId:
              row.member_id || memberId,

            referralType:
              row.referral_type || "",

            fromMemberId:
              row.from_member_id || "",

            fromMerchantId:
              row.from_merchant_id || "",

            level:
              Number(row.level || 0),

            transactionId:
              row.transaction_id || "",

            transactionAmount:
              Number(
                row.transaction_amount || 0
              ),

            commissionRate:
              Number(
                row.commission_rate || 0
              ),

            amount:
              Number(row.amount || 0),

            status:
              row.status || "",

            createdAt:
              row.created_at || "",
          };
        });

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          count: history.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member referral history loaded",

            data: {
              memberId,
              history,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER REFERRAL SUMMARY
     * ============================================================
     * Mirrors Apps Script getMemberReferralSummary().
     * Source: member_referrals singleton wallet row.
     */
    if (
      action ===
      "getMemberReferralSummary"
    ) {
      const { data, error } =
        await supabase
          .from("member_referrals")
          .select(
            "member_id,available_commission,total_earned,total_paid,updated_at"
          )
          .eq("member_id", memberId)
          .maybeSingle();

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE REFERRAL SUMMARY FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason: error.message,
          }
        );
        return null;
      }

      if (!data) {
        console.warn(
          "REWARDHUB SUPABASE REFERRAL SUMMARY ROW MISSING - FALLBACK:",
          { requestId, action, memberId }
        );
        return null;
      }

      const row = data as {
        member_id: string | null;
        available_commission: number | string | null;
        total_earned: number | string | null;
        total_paid: number | string | null;
        updated_at: string | null;
      };

      const payload = {
        memberId: row.member_id || memberId,
        availableRewardCredits: Number(
          row.available_commission || 0
        ),
        totalEarned: Number(
          row.total_earned || 0
        ),
        totalPaid: Number(
          row.total_paid || 0
        ),
        updatedAt: row.updated_at || "",
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          availableRewardCredits:
            payload.availableRewardCredits,
        }
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            message:
              "Member referral summary loaded",
            data: payload,
          },
          requestId,
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER COMMISSION SUMMARY
     * ============================================================
     *
     * Direct PostgreSQL read for the member Referral Center.
     *
     * Sources:
     * - member_referrals: wallet totals
     * - referral_history: commission history
     * - members: L1 / L2 / L3 referral network counts + member names
     * - merchants: referred merchant count/details + merchant names/logo
     *
     * IMPORTANT:
     * - member_referrals remains the authoritative wallet balance.
     * - referral_history remains the authoritative reward history.
     * - network counts come from the real referral relationships in members,
     *   not from reward history, so a referred member is counted even before
     *   that member generates a commission transaction.
     * - Any Supabase query error or missing migrated wallet row falls back to
     *   the existing Apps Script implementation.
     */

    if (
      action ===
      "getMemberCommissionSummary"
    ) {
      const [
        referralResult,
        historyResult,
        membersResult,
        merchantsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "member_referrals"
            )
            .select(
              "member_id,available_commission,total_earned,total_paid,updated_at"
            )
            .eq(
              "member_id",
              memberId
            )
            .maybeSingle(),

          supabase
            .from(
              "referral_history"
            )
            .select(
              "referral_id,member_id,referral_type,from_member_id,from_merchant_id,level,transaction_id,transaction_amount,commission_rate,amount,status,created_at"
            )
            .eq(
              "member_id",
              memberId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),

          supabase
            .from("members")
            .select(
              "member_id,referred_by_member_id,full_name,display_name"
            ),

          supabase
            .from("merchants")
            .select(
              "merchant_id,referred_by_member_id,business_name,display_name,logo_url,status"
            ),
        ]);

      const firstError =
        referralResult.error ||
        historyResult.error ||
        membersResult.error ||
        merchantsResult.error;

      if (firstError) {
        console.warn(
          "REWARDHUB SUPABASE COMMISSION FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason:
              firstError.message,
          }
        );

        return null;
      }

      if (!referralResult.data) {
        console.warn(
          "REWARDHUB SUPABASE COMMISSION WALLET MISSING - FALLBACK:",
          {
            requestId,
            action,
            memberId,
          }
        );

        return null;
      }

      type ReferralWalletRow = {
        member_id:
          string | null;
        available_commission:
          number | string | null;
        total_earned:
          number | string | null;
        total_paid:
          number | string | null;
        updated_at:
          string | null;
      };

      type ReferralHistoryRow = {
        referral_id:
          string | null;
        member_id:
          string | null;
        referral_type:
          string | null;
        from_member_id:
          string | null;
        from_merchant_id:
          string | null;
        level:
          number | string | null;
        transaction_id:
          string | null;
        transaction_amount:
          number | string | null;
        commission_rate:
          number | string | null;
        amount:
          number | string | null;
        status:
          string | null;
        created_at:
          string | null;
      };

      type ReferralMemberRow = {
        member_id:
          string | null;
        referred_by_member_id:
          string | null;
        full_name:
          string | null;
        display_name:
          string | null;
      };

      type ReferralMerchantRow = {
        merchant_id:
          string | null;
        referred_by_member_id:
          string | null;
        business_name:
          string | null;
        display_name:
          string | null;
        logo_url:
          string | null;
        status:
          string | null;
      };

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            Number(value || 0) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const referralRow =
        referralResult.data as ReferralWalletRow;

      const historyRows =
        (
          historyResult.data ||
          []
        ) as ReferralHistoryRow[];

      const memberRows =
        (
          membersResult.data ||
          []
        ) as ReferralMemberRow[];

      const merchantRows =
        (
          merchantsResult.data ||
          []
        ) as ReferralMerchantRow[];

      const memberMap =
        new Map<
          string,
          ReferralMemberRow
        >();

      memberRows.forEach(
        (row) => {
          const id =
            cleanText(
              row.member_id
            );

          if (id) {
            memberMap.set(
              id,
              row
            );
          }
        }
      );

      const merchantMap =
        new Map<
          string,
          ReferralMerchantRow
        >();

      merchantRows.forEach(
        (row) => {
          const id =
            cleanText(
              row.merchant_id
            );

          if (id) {
            merchantMap.set(
              id,
              row
            );
          }
        }
      );

      /*
       * ==========================================================
       * REAL REFERRAL NETWORK COUNTS
       * ==========================================================
       */

      const directMembers =
        memberRows.filter(
          (row) =>
            cleanText(
              row.referred_by_member_id
            ) === memberId
        );

      const directIds =
        new Set(
          directMembers
            .map((row) =>
              cleanText(
                row.member_id
              )
            )
            .filter(Boolean)
        );

      const level2Members =
        memberRows.filter(
          (row) =>
            directIds.has(
              cleanText(
                row.referred_by_member_id
              )
            )
        );

      const level2Ids =
        new Set(
          level2Members
            .map((row) =>
              cleanText(
                row.member_id
              )
            )
            .filter(Boolean)
        );

      const level3Members =
        memberRows.filter(
          (row) =>
            level2Ids.has(
              cleanText(
                row.referred_by_member_id
              )
            )
        );

      const directCount =
        directMembers.length;

      const level2Count =
        level2Members.length;

      const level3Count =
        level3Members.length;

      const totalReferralMembers =
        directCount +
        level2Count +
        level3Count;

      const referredMerchantRows =
        merchantRows.filter(
          (row) =>
            cleanText(
              row.referred_by_member_id
            ) === memberId
        );

      const referredMerchants =
        referredMerchantRows.map(
          (row) => ({
            merchantId:
              cleanText(
                row.merchant_id
              ),
            businessName:
              cleanText(
                row.business_name
              ),
            displayName:
              cleanText(
                row.display_name ||
                  row.business_name
              ),
            logoUrl:
              cleanText(
                row.logo_url
              ),
            status:
              cleanText(
                row.status
              ),
          })
        );

      const referredMerchantCount =
        referredMerchants.length;

      /*
       * ==========================================================
       * REWARD HISTORY + SOURCE ENRICHMENT
       * ==========================================================
       */

      const history =
        historyRows.map(
          (row) => {
            const referralType =
              cleanText(
                row.referral_type
              ).toUpperCase();

            const fromMemberId =
              cleanText(
                row.from_member_id
              );

            const fromMerchantId =
              cleanText(
                row.from_merchant_id
              );

            const memberSource =
              fromMemberId
                ? memberMap.get(
                    fromMemberId
                  )
                : undefined;

            const merchantSource =
              fromMerchantId
                ? merchantMap.get(
                    fromMerchantId
                  )
                : undefined;

            const fromMemberName =
              memberSource
                ? cleanText(
                    memberSource.display_name ||
                      memberSource.full_name
                  )
                : "";

            const fromMerchantName =
              merchantSource
                ? cleanText(
                    merchantSource.display_name ||
                      merchantSource.business_name
                  )
                : "";

            const level =
              Number(
                row.level ||
                0
              );

            const sourceId =
              referralType ===
              "MERCHANT"
                ? fromMerchantId
                : fromMemberId;

            const sourceName =
              referralType ===
              "MERCHANT"
                ? fromMerchantName
                : fromMemberName;

            const sourceSubtitle =
              referralType ===
              "MERCHANT"
                ? "Merchant Referral"
                : level > 0
                  ? `Level ${level} Member Referral`
                  : "Member Referral";

            return {
              id:
                cleanText(
                  row.referral_id
                ),

              commissionTxId:
                cleanText(
                  row.referral_id
                ),

              referralId:
                cleanText(
                  row.referral_id
                ),

              memberId:
                cleanText(
                  row.member_id
                ) ||
                memberId,

              referralType,

              fromMemberId,
              fromMemberName,

              fromMerchantId,
              fromMerchantName,

              memberName:
                fromMemberName,

              merchantName:
                fromMerchantName,

              sourceId,
              sourceName,
              sourceSubtitle,

              sourceLogoUrl:
                merchantSource
                  ? cleanText(
                      merchantSource.logo_url
                    )
                  : "",

              level,

              transactionId:
                cleanText(
                  row.transaction_id
                ),

              transactionAmount:
                Number(
                  row.transaction_amount ||
                  0
                ),

              commissionRate:
                Number(
                  row.commission_rate ||
                  0
                ),

              amount:
                round2(
                  row.amount
                ),

              status:
                cleanText(
                  row.status
                ),

              createdAt:
                row.created_at ||
                "",
            };
          }
        );

      const releasedHistory =
        historyRows.filter(
          (row) =>
            cleanText(
              row.status
            ).toUpperCase() ===
            "RELEASED"
        );

      const pendingHistory =
        historyRows.filter(
          (row) =>
            cleanText(
              row.status
            ).toUpperCase() ===
            "PENDING"
        );

      const sumHistory = (
        rows: ReferralHistoryRow[],
        predicate?: (
          row: ReferralHistoryRow
        ) => boolean
      ) =>
        round2(
          rows.reduce(
            (
              total,
              row
            ) =>
              !predicate ||
              predicate(row)
                ? total +
                  Number(
                    row.amount ||
                    0
                  )
                : total,
            0
          )
        );

      const memberReferralEarned =
        sumHistory(
          historyRows,
          (row) =>
            cleanText(
              row.referral_type
            ).toUpperCase() ===
            "MEMBER"
        );

      const merchantReferralEarned =
        sumHistory(
          historyRows,
          (row) =>
            cleanText(
              row.referral_type
            ).toUpperCase() ===
            "MERCHANT"
        );

      const level1Earned =
        sumHistory(
          historyRows,
          (row) =>
            cleanText(
              row.referral_type
            ).toUpperCase() ===
              "MEMBER" &&
            Number(
              row.level ||
              0
            ) === 1
        );

      const level2Earned =
        sumHistory(
          historyRows,
          (row) =>
            cleanText(
              row.referral_type
            ).toUpperCase() ===
              "MEMBER" &&
            Number(
              row.level ||
              0
            ) === 2
        );

      const level3Earned =
        sumHistory(
          historyRows,
          (row) =>
            cleanText(
              row.referral_type
            ).toUpperCase() ===
              "MEMBER" &&
            Number(
              row.level ||
              0
            ) === 3
        );

      const pendingCommission =
        sumHistory(
          pendingHistory
        );

      const releasedCommission =
        sumHistory(
          releasedHistory
        );

      const availableCommission =
        round2(
          referralRow
            .available_commission
        );

      const totalEarned =
        round2(
          referralRow
            .total_earned
        );

      const totalPaid =
        round2(
          referralRow
            .total_paid
        );

      const payload = {
        memberId:
          referralRow.member_id ||
          memberId,

        totalCommission:
          totalEarned,

        pendingCommission,

        releasedCommission,

        availableCommission,

        availableRewardCredits:
          availableCommission,

        rewardCredits:
          availableCommission,

        totalEarned,

        totalUsed:
          totalPaid,

        totalPaid,

        totalReleased:
          releasedCommission,

        memberReferralEarned,

        merchantReferralEarned,

        level1Earned,
        level2Earned,
        level3Earned,

        directCount,
        level2Count,
        level3Count,
        totalReferralMembers,

        referredMerchantCount,
        referredMerchants,

        history,

        referralHistory:
          history,

        updatedAt:
          referralRow.updated_at ||
          "",
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          historyCount:
            history.length,
          directCount,
          level2Count,
          level3Count,
          totalReferralMembers,
          referredMerchantCount,
          memberReferralEarned,
          merchantReferralEarned,
          availableCommission,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member commission summary loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER REWARD CREDIT SUMMARY
     * ============================================================
     *
     * Reward Credits use the member_referrals wallet:
     * available_commission = available Reward Credits
     * total_earned         = lifetime Reward Credits earned
     * total_paid           = Reward Credits already used/paid
     *
     * Query errors / missing migrated wallet row fall back to
     * the existing Apps Script path.
     */

    if (
      action ===
      "getMemberRewardCreditSummary"
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "member_referrals"
          )
          .select(
            "member_id,available_commission,total_earned,total_paid,updated_at"
          )
          .eq(
            "member_id",
            memberId
          )
          .maybeSingle();

      if (error) {
        console.warn(
          "REWARDHUB SUPABASE REWARD CREDIT FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason:
              error.message,
          }
        );

        return null;
      }

      /*
       * Unlike history, the referral wallet is a core singleton row.
       * Missing row may indicate legacy data has not yet been migrated,
       * so preserve the Apps Script fallback.
       */
      if (!data) {
        console.warn(
          "REWARDHUB SUPABASE REWARD CREDIT ROW MISSING - FALLBACK:",
          {
            requestId,
            action,
            memberId,
          }
        );

        return null;
      }

      const row =
        data as {
          member_id:
            string | null;
          available_commission:
            number |
            string |
            null;
          total_earned:
            number |
            string |
            null;
          total_paid:
            number |
            string |
            null;
          updated_at:
            string | null;
        };

      const availableRewardCredits =
        Number(
          row.available_commission ||
          0
        );

      const totalEarned =
        Number(
          row.total_earned ||
          0
        );

      const totalPaid =
        Number(
          row.total_paid ||
          0
        );

      const payload = {
        memberId:
          row.member_id ||
          memberId,

        /*
         * Keep aliases for existing RewardHub pages/components.
         */
        rewardCredits:
          availableRewardCredits,

        availableRewardCredits,

        rewardCreditBalance:
          availableRewardCredits,

        totalEarned,

        totalRewardCreditsEarned:
          totalEarned,

        totalPaid,

        totalUsed:
          totalPaid,

        rewardCreditsUsed:
          totalPaid,

        updatedAt:
          row.updated_at ||
          "",
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          availableRewardCredits,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member reward credit summary loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER TRANSACTION HISTORY
     * ============================================================
     *
     * Mirrors Apps Script getTransactionHistory():
     * - memberId required
     * - newest transactions first
     * - default limit 50, maximum 200
     * - merchant name / logo / category enrichment
     * - reviewed flag from merchant_reviews
     * - Supabase query errors fall back to Apps Script
     */
    if (
      action ===
      "getTransactionHistory"
    ) {
      const requestedLimit =
        typeof body.limit ===
        "number"
          ? body.limit
          : typeof body.limit ===
            "string"
            ? Number(
                body.limit
              )
            : 50;

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(
                requestedLimit
              ),
              200
            )
          : 50;

      type MemberTransactionRow = {
        transaction_id:
          string | null;
        member_id:
          string | null;
        merchant_id:
          string | null;
        amount:
          number | string | null;
        cashback:
          number | string | null;
        reward_credits_used:
          number | string | null;
        voucher_id:
          string | null;
        voucher_code:
          string | null;
        voucher_discount:
          number | string | null;
        pay_amount:
          number | string | null;
        points_earned:
          number | string | null;
        payment_method:
          string | null;
        status:
          string | null;
        member_tier:
          string | null;
        cashback_rate:
          number | string | null;
        marketing_rate:
          number | string | null;
        marketing_amount:
          number | string | null;
        receipt_url:
          string | null;
        created_at:
          string | null;
      };

      type TransactionMerchantRow = {
        merchant_id:
          string | null;
        business_name:
          string | null;
        display_name:
          string | null;
        logo_url:
          string | null;
        category:
          string | null;
      };

      type TransactionReviewRow = {
        transaction_id:
          string | null;
        member_id:
          string | null;
      };

      const transactionResult =
        await supabase
          .from(
            "member_transactions"
          )
          .select(
            [
              "transaction_id",
              "member_id",
              "merchant_id",
              "amount",
              "cashback",
              "reward_credits_used",
              "voucher_id",
              "voucher_code",
              "voucher_discount",
              "pay_amount",
              "points_earned",
              "payment_method",
              "status",
              "member_tier",
              "cashback_rate",
              "marketing_rate",
              "marketing_amount",
              "receipt_url",
              "created_at",
            ].join(",")
          )
          .eq(
            "member_id",
            memberId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(
            limit
          );

      if (
        transactionResult.error
      ) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER TRANSACTION HISTORY FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason:
              transactionResult
                .error.message,
          }
        );

        return null;
      }

      const transactionRows =
        (
          transactionResult.data ||
          []
        ) as unknown as MemberTransactionRow[];

      const merchantIds =
        Array.from(
          new Set(
            transactionRows
              .map((row) =>
                String(
                  row.merchant_id ||
                  ""
                ).trim()
              )
              .filter(Boolean)
          )
        );

      const transactionIds =
        Array.from(
          new Set(
            transactionRows
              .map((row) =>
                String(
                  row.transaction_id ||
                  ""
                ).trim()
              )
              .filter(Boolean)
          )
        );

      let merchantMap:
        Record<
          string,
          TransactionMerchantRow
        > = {};

      if (
        merchantIds.length > 0
      ) {
        const merchantResult =
          await supabase
            .from("merchants")
            .select(
              "merchant_id,business_name,display_name,logo_url,category"
            )
            .in(
              "merchant_id",
              merchantIds
            );

        if (
          merchantResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE MEMBER TRANSACTION MERCHANT ENRICHMENT FALLBACK:",
            {
              requestId,
              action,
              memberId,
              reason:
                merchantResult
                  .error.message,
            }
          );

          return null;
        }

        merchantMap =
          (
            merchantResult.data ||
            []
          ).reduce(
            (
              map,
              rawMerchant
            ) => {
              const merchant =
                rawMerchant as TransactionMerchantRow;

              const id =
                String(
                  merchant.merchant_id ||
                  ""
                ).trim();

              if (id) {
                map[id] =
                  merchant;
              }

              return map;
            },
            {} as Record<
              string,
              TransactionMerchantRow
            >
          );
      }

      const reviewedTransactionIds =
        new Set<string>();

      if (
        transactionIds.length > 0
      ) {
        const reviewResult =
          await supabase
            .from(
              "merchant_reviews"
            )
            .select(
              "transaction_id,member_id"
            )
            .eq(
              "member_id",
              memberId
            )
            .in(
              "transaction_id",
              transactionIds
            );

        if (
          reviewResult.error
        ) {
          console.warn(
            "REWARDHUB SUPABASE MEMBER TRANSACTION REVIEW LOOKUP FALLBACK:",
            {
              requestId,
              action,
              memberId,
              reason:
                reviewResult
                  .error.message,
            }
          );

          return null;
        }

        (
          (reviewResult.data ||
            []) as TransactionReviewRow[]
        ).forEach(
          (review) => {
            const transactionId =
              String(
                review.transaction_id ||
                ""
              ).trim();

            if (transactionId) {
              reviewedTransactionIds.add(
                transactionId
              );
            }
          }
        );
      }

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            Number(
              value || 0
            ) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const transactions =
        transactionRows.map(
          (row) => {
            const transactionId =
              String(
                row.transaction_id ||
                ""
              ).trim();

            const merchantId =
              String(
                row.merchant_id ||
                ""
              ).trim();

            const merchant =
              merchantMap[
                merchantId
              ];

            const amount =
              round2(
                row.amount
              );

            const cashback =
              round2(
                row.cashback
              );

            const voucherDiscount =
              round2(
                row.voucher_discount
              );

            const rewardCreditsUsed =
              round2(
                row.reward_credits_used
              );

            const payAmount =
              round2(
                row.pay_amount
              );

            return {
              transactionId,

              memberId:
                row.member_id ||
                memberId,

              merchantId,

              merchantName:
                String(
                  merchant
                    ?.display_name ||
                  merchant
                    ?.business_name ||
                  merchantId ||
                  "Merchant"
                ).trim(),

              merchantLogo:
                String(
                  merchant
                    ?.logo_url ||
                  ""
                ).trim(),

              merchantCategory:
                String(
                  merchant
                    ?.category ||
                  ""
                ).trim(),

              amount,

              cashback,

              discountAmount:
                round2(
                  cashback +
                  voucherDiscount
                ),

              rewardCreditsUsed,

              voucherId:
                row.voucher_id ||
                "",

              voucherCode:
                row.voucher_code ||
                "",

              voucherDiscount,

              payAmount,

              netAmount:
                payAmount,

              pointsEarned:
                Number(
                  row.points_earned ||
                  0
                ),

              paymentMethod:
                row.payment_method ||
                "",

              status:
                row.status ||
                "",

              memberTier:
                row.member_tier ||
                "",

              cashbackRate:
                Number(
                  row.cashback_rate ||
                  0
                ),

              marketingRate:
                Number(
                  row.marketing_rate ||
                  0
                ),

              marketingAmount:
                round2(
                  row.marketing_amount
                ),

              receiptUrl:
                row.receipt_url ||
                "",

              createdAt:
                row.created_at ||
                "",

              reviewed:
                reviewedTransactionIds.has(
                  transactionId
                ),
            };
          }
        );

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          count:
            transactions.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member transactions loaded",

            data: {
              memberId,
              transactions,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MERCHANT TRANSACTION HISTORY
     * ============================================================
     *
     * Mirrors Apps Script getMerchantTransactionHistory():
     * - merchantId required
     * - search / paymentMethod / dateFrom / dateTo filters
     * - newest transactions first
     * - page + pageSize pagination (max 200)
     * - summary is calculated across ALL filtered rows
     * - Supabase query errors fall back to Apps Script
     */
    if (
      action ===
      "getMerchantTransactionHistory"
    ) {
      const merchantId =
        typeof body.merchantId ===
        "string"
          ? body.merchantId.trim()
          : "";

      if (!merchantId) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "Missing merchantId",
            message:
              "Missing merchantId",
          },
          {
            status: 400,
          }
        );
      }

      const search =
        typeof body.search ===
        "string"
          ? body.search
              .trim()
              .toLowerCase()
          : "";

      const paymentMethod =
        typeof body.paymentMethod ===
        "string" &&
        body.paymentMethod.trim()
          ? body.paymentMethod.trim()
          : "All";

      const dateFrom =
        typeof body.dateFrom ===
        "string"
          ? body.dateFrom.trim()
          : "";

      const dateTo =
        typeof body.dateTo ===
        "string"
          ? body.dateTo.trim()
          : "";

      const rawPage =
        typeof body.page ===
        "number"
          ? body.page
          : typeof body.page ===
            "string"
            ? Number(
                body.page
              )
            : 1;

      let page =
        Number.isFinite(
          rawPage
        )
          ? Math.max(
              1,
              Math.floor(
                rawPage
              )
            )
          : 1;

      const rawPageSize =
        typeof body.pageSize ===
        "number"
          ? body.pageSize
          : typeof body.pageSize ===
            "string"
            ? Number(
                body.pageSize
              )
            : 50;

      const pageSize =
        Number.isFinite(
          rawPageSize
        )
          ? Math.min(
              200,
              Math.max(
                1,
                Math.floor(
                  rawPageSize
                )
              )
            )
          : 50;

      let startDate:
        Date | null =
          null;

      let endDate:
        Date | null =
          null;

      if (dateFrom) {
        startDate =
          new Date(
            `${dateFrom}T00:00:00+08:00`
          );

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error:
                "Invalid dateFrom",
              message:
                "Invalid dateFrom",
            },
            {
              status: 400,
            }
          );
        }
      }

      if (dateTo) {
        endDate =
          new Date(
            `${dateTo}T23:59:59.999+08:00`
          );

        if (
          Number.isNaN(
            endDate.getTime()
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error:
                "Invalid dateTo",
              message:
                "Invalid dateTo",
            },
            {
              status: 400,
            }
          );
        }
      }

      if (
        startDate &&
        endDate &&
        startDate.getTime() >
          endDate.getTime()
      ) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error:
              "dateFrom cannot be after dateTo",
            message:
              "dateFrom cannot be after dateTo",
          },
          {
            status: 400,
          }
        );
      }

      type MerchantTransactionHistoryRow = {
        transaction_id:
          string | null;
        member_id:
          string | null;
        merchant_id:
          string | null;
        amount:
          number | string | null;
        cashback:
          number | string | null;
        reward_credits_used:
          number | string | null;
        voucher_id:
          string | null;
        voucher_code:
          string | null;
        voucher_discount:
          number | string | null;
        pay_amount:
          number | string | null;
        points_earned:
          number | string | null;
        payment_method:
          string | null;
        status:
          string | null;
        receipt_url:
          string | null;
        created_at:
          string | null;
      };

      /*
       * Supabase/PostgREST commonly caps a single response at 1000 rows.
       * Read in chunks so pagination totals and summary remain correct
       * even after a merchant has more than 1000 transactions.
       */
      const allRows:
        MerchantTransactionHistoryRow[] =
          [];

      const chunkSize =
        1000;

      let from =
        0;

      while (true) {
        let query =
          supabase
            .from(
              "merchant_transactions"
            )
            .select(
              [
                "transaction_id",
                "member_id",
                "merchant_id",
                "amount",
                "cashback",
                "reward_credits_used",
                "voucher_id",
                "voucher_code",
                "voucher_discount",
                "pay_amount",
                "points_earned",
                "payment_method",
                "status",
                "receipt_url",
                "created_at",
              ].join(",")
            )
            .eq(
              "merchant_id",
              merchantId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .range(
              from,
              from +
                chunkSize -
                1
            );

        if (startDate) {
          query =
            query.gte(
              "created_at",
              startDate.toISOString()
            );
        }

        if (endDate) {
          query =
            query.lte(
              "created_at",
              endDate.toISOString()
            );
        }

        const result =
          await query;

        if (result.error) {
          console.warn(
            "REWARDHUB SUPABASE MERCHANT TRANSACTION HISTORY FALLBACK:",
            {
              requestId,
              action,
              merchantId,
              reason:
                result.error.message,
            }
          );

          return null;
        }

        const rows =
          (
            result.data ||
            []
          ) as unknown as MerchantTransactionHistoryRow[];

        allRows.push(
          ...rows
        );

        if (
          rows.length <
          chunkSize
        ) {
          break;
        }

        from +=
          chunkSize;
      }

      const cleanText = (
        value: unknown
      ) =>
        String(
          value ?? ""
        ).trim();

      const filteredRows =
        allRows.filter(
          (row) => {
            if (search) {
              const haystack =
                [
                  row.transaction_id,
                  row.member_id,
                  row.payment_method,
                  row.status,
                  row.voucher_id,
                  row.voucher_code,
                ]
                  .map(
                    cleanText
                  )
                  .join(" ")
                  .toLowerCase();

              if (
                !haystack.includes(
                  search
                )
              ) {
                return false;
              }
            }

            if (
              paymentMethod &&
              paymentMethod !==
                "All" &&
              cleanText(
                row.payment_method
              ) !==
                paymentMethod
            ) {
              return false;
            }

            /*
             * Date range is already applied in SQL.
             * Keep created_at validation aligned with Apps Script:
             * invalid dates are excluded whenever a date filter is active.
             */
            if (
              startDate ||
              endDate
            ) {
              const txDate =
                new Date(
                  row.created_at ||
                    ""
                );

              if (
                Number.isNaN(
                  txDate.getTime()
                )
              ) {
                return false;
              }
            }

            return true;
          }
        );

      const totalItems =
        filteredRows.length;

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            totalItems /
              pageSize
          )
        );

      if (
        page >
        totalPages
      ) {
        page =
          totalPages;
      }

      const startIndex =
        (page - 1) *
        pageSize;

      const pageRows =
        filteredRows.slice(
          startIndex,
          startIndex +
            pageSize
        );

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          Number(
            value || 0
          ) * 100
        ) / 100;

      const transactions =
        pageRows.map(
          (row) => ({
            transactionId:
              cleanText(
                row.transaction_id
              ),

            memberId:
              cleanText(
                row.member_id
              ),

            merchantId:
              cleanText(
                row.merchant_id
              ),

            amount:
              Number(
                row.amount || 0
              ),

            cashback:
              Number(
                row.cashback || 0
              ),

            rewardCreditsUsed:
              Number(
                row.reward_credits_used ||
                  0
              ),

            voucherId:
              cleanText(
                row.voucher_id
              ),

            voucherCode:
              cleanText(
                row.voucher_code
              ),

            voucherDiscount:
              Number(
                row.voucher_discount ||
                  0
              ),

            payAmount:
              Number(
                row.pay_amount || 0
              ),

            pointsEarned:
              Number(
                row.points_earned ||
                  0
              ),

            paymentMethod:
              cleanText(
                row.payment_method
              ),

            status:
              cleanText(
                row.status
              ),

            createdAt:
              row.created_at ||
                "",

            receiptUrl:
              cleanText(
                row.receipt_url
              ),
          })
        );

      const summary = {
        totalOriginal: 0,
        totalPayAmount: 0,
        totalCashback: 0,
        totalRewardCredits: 0,
        totalPoints: 0,
      };

      filteredRows.forEach(
        (row) => {
          summary.totalOriginal +=
            Number(
              row.amount || 0
            );

          summary.totalPayAmount +=
            Number(
              row.pay_amount ||
                0
            );

          summary.totalCashback +=
            Number(
              row.cashback || 0
            );

          summary.totalRewardCredits +=
            Number(
              row.reward_credits_used ||
                0
            );

          summary.totalPoints +=
            Number(
              row.points_earned ||
                0
            );
        }
      );

      summary.totalOriginal =
        round2(
          summary.totalOriginal
        );

      summary.totalPayAmount =
        round2(
          summary.totalPayAmount
        );

      summary.totalCashback =
        round2(
          summary.totalCashback
        );

      summary.totalRewardCredits =
        round2(
          summary.totalRewardCredits
        );

      summary.totalPoints =
        round2(
          summary.totalPoints
        );

      const pagination = {
        page,
        pageSize,
        totalItems,
        totalPages,

        showingFrom:
          totalItems
            ? startIndex + 1
            : 0,

        showingTo:
          totalItems
            ? Math.min(
                startIndex +
                  transactions.length,
                totalItems
              )
            : 0,

        hasPrevious:
          page > 1,

        hasNext:
          page <
          totalPages,
      };

      const filters = {
        search:
          typeof body.search ===
          "string"
            ? body.search.trim()
            : "",

        paymentMethod,

        dateFrom,

        dateTo,
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          merchantId,
          totalItems,
          page,
          pageSize,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Merchant transactions loaded",

            data: {
              merchantId,
              transactions,
              summary,
              pagination,
              filters,
            },
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER DASHBOARD
     * ============================================================
     *
     * Mirrors the current Apps Script getMemberDashboard():
     * - members: profile
     * - member_points: points wallet
     * - member_referrals: Reward Credits wallet
     * - RPC get_member_transaction_dashboard: totals + recent tx
     * - merchants: enrich recent transaction merchant names
     *
     * If a core query/RPC fails or a singleton wallet row is still
     * missing from PostgreSQL, return null so the existing Apps
     * Script fallback remains available.
     */
    if (
      action ===
      "getMemberDashboard"
    ) {
      const [
        memberResult,
        pointsResult,
        referralResult,
        transactionDashboardResult,
      ] =
        await Promise.all([
          supabase
            .from("members")
            .select(
              "member_id,card_id,referral_code,full_name,display_name,email,phone,member_tier,member_status,join_date,lifetime_spending"
            )
            .eq("member_id", memberId)
            .maybeSingle(),

          supabase
            .from("member_points")
            .select(
              "member_id,current_points,total_earned,total_redeemed"
            )
            .eq("member_id", memberId)
            .maybeSingle(),

          supabase
            .from("member_referrals")
            .select(
              "member_id,available_commission,total_earned,total_paid"
            )
            .eq("member_id", memberId)
            .maybeSingle(),

          supabase.rpc(
            "get_member_transaction_dashboard",
            {
              p_member_id:
                memberId,
            }
          ),
        ]);

      const firstError =
        memberResult.error ||
        pointsResult.error ||
        referralResult.error ||
        transactionDashboardResult.error;

      if (firstError) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER DASHBOARD FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason:
              firstError.message,
          }
        );

        return null;
      }

      if (
        !memberResult.data ||
        !pointsResult.data ||
        !referralResult.data ||
        !transactionDashboardResult.data
      ) {
        console.warn(
          "REWARDHUB SUPABASE MEMBER DASHBOARD CORE DATA MISSING - FALLBACK:",
          {
            requestId,
            action,
            memberId,
            hasMember:
              Boolean(memberResult.data),
            hasPoints:
              Boolean(pointsResult.data),
            hasReferral:
              Boolean(referralResult.data),
            hasTransactionDashboard:
              Boolean(
                transactionDashboardResult.data
              ),
          }
        );

        return null;
      }

      const member =
        memberResult.data as {
          member_id: string | null;
          card_id: string | null;
          referral_code: string | null;
          full_name: string | null;
          display_name: string | null;
          email: string | null;
          phone: string | null;
          member_tier: string | null;
          member_status: string | null;
          join_date: string | null;
          lifetime_spending:
            number | string | null;
        };

      const points =
        pointsResult.data as {
          member_id: string | null;
          current_points:
            number | string | null;
          total_earned:
            number | string | null;
          total_redeemed:
            number | string | null;
        };

      const referral =
        referralResult.data as {
          member_id: string | null;
          available_commission:
            number | string | null;
          total_earned:
            number | string | null;
          total_paid:
            number | string | null;
        };

      const txDashboard =
        transactionDashboardResult.data as {
          total_transactions?:
            number | string | null;
          total_spent?:
            number | string | null;
          cashback_saved?:
            number | string | null;
          reward_credits_used?:
            number | string | null;
          recent_transactions?:
            Array<{
              transaction_id?:
                string | null;
              merchant_id?:
                string | null;
              amount?:
                number | string | null;
              cashback?:
                number | string | null;
              reward_credits_used?:
                number | string | null;
              pay_amount?:
                number | string | null;
              points_earned?:
                number | string | null;
              payment_method?:
                string | null;
              status?:
                string | null;
              created_at?:
                string | null;
            }> | null;
        };

      const recentRows =
        Array.isArray(
          txDashboard.recent_transactions
        )
          ? txDashboard.recent_transactions
          : [];

      const merchantIds =
        Array.from(
          new Set(
            recentRows
              .map((tx) =>
                String(
                  tx.merchant_id ||
                  ""
                ).trim()
              )
              .filter(Boolean)
          )
        );

      let merchantMap:
        Record<
          string,
          {
            merchant_id:
              string | null;
            business_name:
              string | null;
            display_name:
              string | null;
          }
        > = {};

      if (merchantIds.length > 0) {
        const merchantResult =
          await supabase
            .from("merchants")
            .select(
              "merchant_id,business_name,display_name"
            )
            .in(
              "merchant_id",
              merchantIds
            );

        if (merchantResult.error) {
          console.warn(
            "REWARDHUB SUPABASE MEMBER DASHBOARD MERCHANT ENRICHMENT FALLBACK:",
            {
              requestId,
              action,
              memberId,
              reason:
                merchantResult.error.message,
            }
          );

          return null;
        }

        merchantMap =
          (
            merchantResult.data ||
            []
          ).reduce(
            (
              map,
              rawMerchant
            ) => {
              const merchant =
                rawMerchant as {
                  merchant_id:
                    string | null;
                  business_name:
                    string | null;
                  display_name:
                    string | null;
                };

              const merchantKey =
                String(
                  merchant.merchant_id ||
                  ""
                ).trim();

              if (merchantKey) {
                map[
                  merchantKey
                ] = merchant;
              }

              return map;
            },
            {} as Record<
              string,
              {
                merchant_id:
                  string | null;
                business_name:
                  string | null;
                display_name:
                  string | null;
              }
            >
          );
      }

      const round2 = (
        value: unknown
      ) =>
        Math.round(
          (
            Number(value || 0) +
            Number.EPSILON
          ) * 100
        ) / 100;

      const recentTransactions =
        recentRows.map((tx) => {
          const merchantId =
            String(
              tx.merchant_id ||
              ""
            ).trim();

          const merchant =
            merchantMap[
              merchantId
            ];

          return {
            transactionId:
              tx.transaction_id ||
              "",

            merchantId,

            merchantName:
              merchant?.business_name ||
              merchant?.display_name ||
              merchantId,

            amount:
              Number(
                tx.amount || 0
              ),

            cashback:
              Number(
                tx.cashback || 0
              ),

            rewardCreditsUsed:
              Number(
                tx.reward_credits_used ||
                0
              ),

            payAmount:
              Number(
                tx.pay_amount || 0
              ),

            pointsEarned:
              Number(
                tx.points_earned || 0
              ),

            paymentMethod:
              tx.payment_method ||
              "-",

            status:
              tx.status ||
              "Completed",

            createdAt:
              tx.created_at ||
              "",
          };
        });

      const totalTransactions =
        Number(
          txDashboard
            .total_transactions ||
          0
        );

      const totalSpent =
        round2(
          txDashboard
            .total_spent
        );

      const cashbackSaved =
        round2(
          txDashboard
            .cashback_saved
        );

      const rewardCreditsUsed =
        round2(
          txDashboard
            .reward_credits_used
        );

      const payload = {
        profile: {
          memberId:
            member.member_id ||
            memberId,

          cardId:
            member.card_id ||
            "",

          referralCode:
            member.referral_code ||
            "",

          fullName:
            member.full_name ||
            "",

          displayName:
            member.display_name ||
            "",

          email:
            member.email ||
            "",

          phone:
            String(
              member.phone ||
              ""
            ),

          tier:
            member.member_tier ||
            "Silver",

          status:
            member.member_status ||
            "Active",

          joinDate:
            member.join_date ||
            "",

          lifetimeSpending:
            Number(
              member.lifetime_spending ||
              0
            ),
        },

        wallet: {
          rewardCredits:
            Number(
              referral
                .available_commission ||
              0
            ),

          totalRewardCreditsEarned:
            Number(
              referral
                .total_earned ||
              0
            ),

          rewardCreditsUsed:
            Number(
              referral
                .total_paid ||
              0
            ),

          points:
            Number(
              points.current_points ||
              0
            ),

          totalPointsEarned:
            Number(
              points.total_earned ||
              0
            ),

          pointsRedeemed:
            Number(
              points.total_redeemed ||
              0
            ),

          cashbackSaved,
        },

        stats: {
          totalTransactions,
          totalSpent,
          cashbackSaved,
          rewardCreditsUsed,
        },

        recentTransactions,

        transactionSource:
          "SUPABASE",
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          totalTransactions,
          recentTransactionCount:
            recentTransactions.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member dashboard loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    /*
     * ============================================================
     * MEMBER WALLET SUMMARY
     * ============================================================
     *
     * Mirrors the current Apps Script getMemberWalletSummary():
     * - members: tier + lifetime spending
     * - member_points: point balances
     * - member_referrals: Reward Credits / commission wallet
     * - member_transactions: cumulative cashback
     *
     * Any query error or missing migrated core row falls back to
     * Apps Script so the existing RewardHub flow remains safe.
     */

    if (
      action ===
      "getMemberWalletSummary"
    ) {
      const [
        memberResult,
        pointsResult,
        referralResult,
        transactionResult,
      ] =
        await Promise.all([
          supabase
            .from("members")
            .select(
              "member_id,member_tier,lifetime_spending"
            )
            .eq(
              "member_id",
              memberId
            )
            .maybeSingle(),

          supabase
            .from("member_points")
            .select(
              "member_id,current_points,total_earned,total_redeemed"
            )
            .eq(
              "member_id",
              memberId
            )
            .maybeSingle(),

          supabase
            .from("member_referrals")
            .select(
              "member_id,available_commission,total_earned,total_paid"
            )
            .eq(
              "member_id",
              memberId
            )
            .maybeSingle(),

          supabase
            .from("member_transactions")
            .select(
              "cashback"
            )
            .eq(
              "member_id",
              memberId
            ),
        ]);

      const firstError =
        memberResult.error ||
        pointsResult.error ||
        referralResult.error ||
        transactionResult.error;

      if (firstError) {
        console.warn(
          "REWARDHUB SUPABASE WALLET FALLBACK:",
          {
            requestId,
            action,
            memberId,
            reason:
              firstError.message,
          }
        );

        return null;
      }

      /*
       * Missing core rows can still mean legacy data has not
       * finished migrating. Let Apps Script use its existing
       * Sheet fallback / repair behaviour in that situation.
       */
      if (
        !memberResult.data ||
        !pointsResult.data ||
        !referralResult.data
      ) {
        console.warn(
          "REWARDHUB SUPABASE WALLET CORE ROW MISSING - FALLBACK:",
          {
            requestId,
            action,
            memberId,
            hasMember:
              Boolean(
                memberResult.data
              ),
            hasPoints:
              Boolean(
                pointsResult.data
              ),
            hasReferral:
              Boolean(
                referralResult.data
              ),
          }
        );

        return null;
      }

      const memberRow =
        memberResult.data as {
          member_id:
            string | null;
          member_tier:
            string | null;
          lifetime_spending:
            number |
            string |
            null;
        };

      const pointsRow =
        pointsResult.data as {
          member_id:
            string | null;
          current_points:
            number |
            string |
            null;
          total_earned:
            number |
            string |
            null;
          total_redeemed:
            number |
            string |
            null;
        };

      const referralRow =
        referralResult.data as {
          member_id:
            string | null;
          available_commission:
            number |
            string |
            null;
          total_earned:
            number |
            string |
            null;
          total_paid:
            number |
            string |
            null;
        };

      const transactionRows =
        (
          transactionResult.data ||
          []
        ) as Array<{
          cashback:
            number |
            string |
            null;
        }>;

      const cashbackSaved =
        transactionRows.reduce(
          (
            total,
            row
          ) =>
            total +
            Number(
              row.cashback ||
              0
            ),
          0
        );

      const roundedCashback =
        Math.round(
          (
            cashbackSaved +
            Number.EPSILON
          ) * 100
        ) / 100;

      const availableCommission =
        Number(
          referralRow
            .available_commission ||
          0
        );

      const currentPoints =
        Number(
          pointsRow
            .current_points ||
          0
        );

      const payload = {
        memberId,

        rewardCredits:
          availableCommission,

        rewardCreditBalance:
          availableCommission,

        totalRewardCreditsEarned:
          Number(
            referralRow
              .total_earned ||
            0
          ),

        rewardCreditsUsed:
          Number(
            referralRow
              .total_paid ||
            0
          ),

        currentPoints,

        points:
          currentPoints,

        totalPointsEarned:
          Number(
            pointsRow
              .total_earned ||
            0
          ),

        pointsRedeemed:
          Number(
            pointsRow
              .total_redeemed ||
            0
          ),

        cashbackSaved:
          roundedCashback,

        totalCashback:
          roundedCashback,

        tier:
          memberRow
            .member_tier ||
          "Silver",

        lifetimeSpending:
          Number(
            memberRow
              .lifetime_spending ||
            0
          ),
      };

      console.log(
        "REWARDHUB SUPABASE READ SUCCESS:",
        {
          requestId,
          action,
          memberId,
          transactionCount:
            transactionRows.length,
        }
      );

      return NextResponse.json(
        {
          success: true,

          data: {
            message:
              "Member wallet summary loaded",

            data:
              payload,
          },

          requestId,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",

            Pragma:
              "no-cache",
          },
        }
      );
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "member_points"
        )
        .select(
          "member_id,current_points,total_earned,total_redeemed,updated_at"
        )
        .eq(
          "member_id",
          memberId
        )
        .maybeSingle();

    /*
     * Preserve migration safety.
     *
     * Current Apps Script behaviour is:
     * Supabase first -> Google Sheets fallback/self-heal.
     *
     * If direct PostgreSQL cannot provide a trustworthy row,
     * return null and let the existing Apps Script path run.
     */
    if (error) {
      console.warn(
        "REWARDHUB SUPABASE READ FALLBACK:",
        {
          requestId,
          action,
          memberId,
          reason:
            error.message,
        }
      );

      return null;
    }

    if (!data) {
      console.warn(
        "REWARDHUB SUPABASE READ EMPTY - FALLBACK:",
        {
          requestId,
          action,
          memberId,
        }
      );

      return null;
    }

    const pointRow = data as {
      member_id: string | null;
      current_points: number | string | null;
      total_earned: number | string | null;
      total_redeemed: number | string | null;
      updated_at: string | null;
    };

    const payload = {
      memberId:
        String(
          pointRow.member_id ||
          memberId
        ),

      currentPoints:
        Number(
          pointRow.current_points ||
          0
        ),

      totalEarned:
        Number(
          pointRow.total_earned ||
          0
        ),

      totalRedeemed:
        Number(
          pointRow.total_redeemed ||
          0
        ),

      updatedAt:
        pointRow.updated_at ||
        "",
    };

    console.log(
      "REWARDHUB SUPABASE READ SUCCESS:",
      {
        requestId,
        action,
        memberId,
      }
    );

    return NextResponse.json(
      {
        success: true,

        data: {
          message:
            "Member points loaded",

          data:
            payload,
        },

        requestId,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    /*
     * Connection/env/runtime failures also fall back to the
     * current Apps Script implementation during migration.
     */
    console.warn(
      "REWARDHUB SUPABASE DIRECT READ ERROR - FALLBACK:",
      {
        requestId,
        action,
        memberId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    return null;
  }
}


/**
 * ============================================================
 * PostgreSQL/Supabase direct-write migration layer
 * ============================================================
 *
 * IMPORTANT:
 * - Only explicitly migrated MUTATION actions are handled here.
 * - A migrated mutation MUST NOT fall back to Apps Script after
 *   a write attempt, because replaying it can create duplicates.
 */
async function tryHandleSupabaseMutation(
  action: string,
  body: JsonObject,
  requestId: string
): Promise<NextResponse | null> {
  if (
    action !==
    "requestMerchantSettlement"
  ) {
    return null;
  }

  const merchantId =
    typeof body.merchantId === "string"
      ? body.merchantId.trim()
      : "";

  if (!merchantId) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: "Missing merchantId",
        message: "Missing merchantId",
      },
      {
        status: 400,
      }
    );
  }

  const cleanText = (
    value: unknown
  ) =>
    String(value ?? "").trim();

  const round2 = (
    value: unknown
  ) => {
    const numberValue =
      Number(value || 0);

    return Math.round(
      (
        numberValue +
        Number.EPSILON
      ) * 100
    ) / 100;
  };

  const getKualaLumpurYearMonth = (
    date: Date
  ) => {
    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Kuala_Lumpur",
          year: "numeric",
          month: "2-digit",
        }
      ).formatToParts(date);

    const year =
      parts.find(
        (part) =>
          part.type === "year"
      )?.value || "";

    const month =
      parts.find(
        (part) =>
          part.type === "month"
      )?.value || "";

    return {
      year: Number(year),
      month: Number(month),
    };
  };

  try {
    const supabase =
      getSupabaseAdmin();

    /*
     * Settlement period = current calendar month
     * in Asia/Kuala_Lumpur.
     */
    const nowParts =
      getKualaLumpurYearMonth(
        new Date()
      );

    let settlementYear =
      nowParts.year;

    // Keep settlement creation on the same current month as the summary.
    let settlementMonthNumber =
      nowParts.month;

    if (
      settlementMonthNumber < 1
    ) {
      settlementMonthNumber = 12;
      settlementYear -= 1;
    }

    const settlementMonth =
      `${settlementYear}-${String(
        settlementMonthNumber
      ).padStart(2, "0")}`;

    let nextYear =
      settlementYear;

    let nextMonth =
      settlementMonthNumber + 1;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const periodStart =
      `${settlementMonth}-01T00:00:00+08:00`;

    const periodEnd =
      `${nextYear}-${String(
        nextMonth
      ).padStart(
        2,
        "0"
      )}-01T00:00:00+08:00`;

    /*
     * ----------------------------------------------------------
     * 1. Check merchant first.
     * ----------------------------------------------------------
     */
    const merchantResult =
      await supabase
        .from("merchants")
        .select(
          "merchant_id,business_name,display_name,bank_name,bank_account_name,bank_account_no,bank_qr_url,status"
        )
        .eq(
          "merchant_id",
          merchantId
        )
        .maybeSingle();

    if (merchantResult.error) {
      console.error(
        "REWARDHUB SUPABASE SETTLEMENT WRITE ERROR:",
        {
          requestId,
          action,
          merchantId,
          stage:
            "merchant-lookup",
          reason:
            merchantResult.error.message,
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            merchantResult.error.message,
          message:
            "Unable to load merchant for settlement.",
        },
        {
          status: 500,
        }
      );
    }

    if (!merchantResult.data) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            "Merchant not found",
          message:
            "Merchant not found",
        },
        {
          status: 404,
        }
      );
    }

    const merchant =
      merchantResult.data as Record<
        string,
        unknown
      >;

    /*
     * ----------------------------------------------------------
     * 2. Existing settlement batches for this month.
     *
     * Only PENDING / SUBMITTED / APPROVED blocks a new request.
     * PAID does NOT block a later incremental batch.
     * REJECTED is excluded from reserved totals.
     * ----------------------------------------------------------
     */
    const existingResult =
      await supabase
        .from("settlements")
        .select(
          "settlement_id,status,settlement_month,total_sales,total_cashback,total_reward_credits,total_voucher_discount,total_marketing_budget,amount_payable,created_at"
        )
        .eq(
          "merchant_id",
          merchantId
        )
        .eq(
          "settlement_month",
          `${settlementMonth}-01`
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (existingResult.error) {
      console.error(
        "REWARDHUB SUPABASE SETTLEMENT WRITE ERROR:",
        {
          requestId,
          action,
          merchantId,
          stage:
            "duplicate-check",
          reason:
            existingResult.error.message,
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            existingResult.error.message,
          message:
            "Unable to verify existing settlement.",
        },
        {
          status: 500,
        }
      );
    }

    const existingRows =
      existingResult.data || [];

    const existingOpen =
      existingRows.find(
        (row) =>
          [
            "PENDING",
            "SUBMITTED",
            "APPROVED",
          ].includes(
            cleanText(
              row.status
            ).toUpperCase()
          )
      );

    if (existingOpen) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            "Settlement already requested",
          message:
            "Please complete the current settlement before requesting a new settlement.",
          data: {
            settlementId:
              cleanText(
                existingOpen.settlement_id
              ),
            merchantId,
            month:
              settlementMonth,
            status:
              cleanText(
                existingOpen.status
              ),
            amountPayable:
              round2(
                existingOpen.amount_payable
              ),
          },
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * 3. Calculate settlement directly from merchant_transactions.
     * ----------------------------------------------------------
     *
     * IMPORTANT:
     * Keep requestMerchantSettlement on the same transaction source
     * and date window as getMerchantSettlementSummary.
     */
    type SettlementTransactionRow = {
      transaction_id: string | null;
      amount: number | string | null;
      cashback: number | string | null;
      reward_credits_used: number | string | null;
      voucher_discount: number | string | null;
      marketing_amount: number | string | null;
      status: string | null;
      created_at: string | null;
    };

    const periodStartUtc =
      new Date(
        periodStart
      ).toISOString();

    const periodEndUtc =
      new Date(
        periodEnd
      ).toISOString();

    const supabaseUrl =
      String(
        process.env.SUPABASE_URL ||
        ""
      ).trim();

    const supabaseServiceRoleKey =
      String(
        process.env
          .SUPABASE_SERVICE_ROLE_KEY ||
        ""
      ).trim();

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      console.error(
        "REWARDHUB SUPABASE SETTLEMENT WRITE ERROR:",
        {
          requestId,
          action,
          merchantId,
          settlementMonth,
          stage:
            "settlement-transactions-env",
          reason:
            "Supabase server credentials are missing.",
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            "Supabase server credentials are missing.",
          message:
            "Unable to calculate settlement.",
        },
        {
          status: 500,
        }
      );
    }

    const transactionUrl =
      new URL(
        `${supabaseUrl.replace(
          /\/$/,
          ""
        )}/rest/v1/merchant_transactions`
      );

    transactionUrl.searchParams.set(
      "select",
      [
        "transaction_id",
        "amount",
        "cashback",
        "reward_credits_used",
        "voucher_discount",
        "marketing_amount",
        "status",
        "created_at",
      ].join(",")
    );

    transactionUrl.searchParams.set(
      "merchant_id",
      `eq.${merchantId}`
    );

    /*
     * Fetch merchant transactions first, then apply the business
     * month in Node.js using Asia/Kuala_Lumpur. This mirrors the
     * summary path and avoids PostgREST timestamp-range mismatch.
     */
    transactionUrl.searchParams.set(
      "order",
      "created_at.asc"
    );

    transactionUrl.searchParams.set(
      "limit",
      "5000"
    );

    let transactionRows:
      SettlementTransactionRow[] =
        [];

    try {
      const transactionResponse =
        await fetch(
          transactionUrl.toString(),
          {
            method: "GET",
            headers: {
              apikey:
                supabaseServiceRoleKey,
              Authorization:
                `Bearer ${supabaseServiceRoleKey}`,
              Accept:
                "application/json",
            },
            cache: "no-store",
          }
        );

      const transactionText =
        await transactionResponse.text();

      let transactionJson:
        unknown = [];

      try {
        transactionJson =
          transactionText
            ? JSON.parse(
                transactionText
              )
            : [];
      } catch {
        throw new Error(
          "Settlement transaction query returned invalid JSON."
        );
      }

      if (
        !transactionResponse.ok
      ) {
        const errorMessage =
          transactionJson &&
          typeof transactionJson ===
            "object" &&
          "message" in
            transactionJson
            ? String(
                (
                  transactionJson as Record<
                    string,
                    unknown
                  >
                ).message ||
                  "PostgREST settlement transaction query failed."
              )
            : "PostgREST settlement transaction query failed.";

        throw new Error(
          errorMessage
        );
      }

      transactionRows =
        Array.isArray(
          transactionJson
        )
          ? (
              transactionJson as SettlementTransactionRow[]
            )
          : [];
    } catch (error) {
      console.error(
        "REWARDHUB SUPABASE SETTLEMENT WRITE ERROR:",
        {
          requestId,
          action,
          merchantId,
          settlementMonth,
          stage:
            "settlement-transactions-postgrest",
          reason:
            error instanceof Error
              ? error.message
              : String(
                  error ||
                    "Unknown PostgREST error"
                ),
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load settlement transactions.",
          message:
            "Unable to calculate settlement.",
        },
        {
          status: 500,
        }
      );
    }

    const settlementTransactions =
      transactionRows.filter(
        (row) => {
          if (
            cleanText(
              row.status
            ).toUpperCase() !==
            "COMPLETED"
          ) {
            return false;
          }

          const createdAt =
            cleanText(
              row.created_at
            );

          if (!createdAt) {
            return false;
          }

          const parsedDate =
            new Date(
              createdAt
            );

          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {
            return false;
          }

          const parts =
            new Intl.DateTimeFormat(
              "en-CA",
              {
                timeZone:
                  "Asia/Kuala_Lumpur",
                year:
                  "numeric",
                month:
                  "2-digit",
              }
            ).formatToParts(
              parsedDate
            );

          const year =
            parts.find(
              (part) =>
                part.type ===
                "year"
            )?.value || "";

          const month =
            parts.find(
              (part) =>
                part.type ===
                "month"
            )?.value || "";

          return (
            `${year}-${month}` ===
            settlementMonth
          );
        }
      );

    const transactionCount =
      settlementTransactions.length;

    let fullTotalSales = 0;
    let fullTotalCashback = 0;
    let fullTotalRewardCredits = 0;
    let fullTotalVoucherDiscount = 0;
    let fullTotalMarketingBudget = 0;

    settlementTransactions.forEach(
      (row) => {
        fullTotalSales += Number(
          row.amount || 0
        );

        fullTotalCashback += Number(
          row.cashback || 0
        );

        fullTotalRewardCredits += Number(
          row.reward_credits_used || 0
        );

        fullTotalVoucherDiscount += Number(
          row.voucher_discount || 0
        );

        fullTotalMarketingBudget += Number(
          row.marketing_amount || 0
        );
      }
    );

    fullTotalSales =
      round2(fullTotalSales);
    fullTotalCashback =
      round2(fullTotalCashback);
    fullTotalRewardCredits =
      round2(
        fullTotalRewardCredits
      );
    fullTotalVoucherDiscount =
      round2(
        fullTotalVoucherDiscount
      );
    fullTotalMarketingBudget =
      round2(
        fullTotalMarketingBudget
      );

    const reserved = {
      totalSales: 0,
      totalCashback: 0,
      totalRewardCredits: 0,
      totalVoucherDiscount: 0,
      totalMarketingBudget: 0,
    };

    existingRows.forEach(
      (row) => {
        const status =
          cleanText(
            row.status
          ).toUpperCase();

        if (
          ![
            "PENDING",
            "SUBMITTED",
            "APPROVED",
            "PAID",
          ].includes(status)
        ) {
          return;
        }

        reserved.totalSales +=
          Number(
            row.total_sales || 0
          );

        reserved.totalCashback +=
          Number(
            row.total_cashback || 0
          );

        reserved.totalRewardCredits +=
          Number(
            row.total_reward_credits || 0
          );

        reserved.totalVoucherDiscount +=
          Number(
            row.total_voucher_discount || 0
          );

        reserved.totalMarketingBudget +=
          Number(
            row.total_marketing_budget || 0
          );
      }
    );

    const totalSales =
      round2(
        Math.max(
          fullTotalSales -
            reserved.totalSales,
          0
        )
      );

    const totalCashback =
      round2(
        Math.max(
          fullTotalCashback -
            reserved.totalCashback,
          0
        )
      );

    const totalRewardCredits =
      round2(
        Math.max(
          fullTotalRewardCredits -
            reserved.totalRewardCredits,
          0
        )
      );

    const totalVoucherDiscount =
      round2(
        Math.max(
          fullTotalVoucherDiscount -
            reserved.totalVoucherDiscount,
          0
        )
      );

    const totalMarketingBudget =
      round2(
        Math.max(
          fullTotalMarketingBudget -
            reserved.totalMarketingBudget,
          0
        )
      );

    const merchantDue =
      round2(
        Math.max(
          totalMarketingBudget -
            totalCashback,
          0
        )
      );

    const rewardHubDue =
      round2(
        Math.max(
          totalRewardCredits,
          0
        ) +
          Math.max(
            totalVoucherDiscount,
            0
          )
      );

    const netAmount =
      round2(
        merchantDue -
          rewardHubDue
      );

    const settlementDirection =
      netAmount > 0
        ? "MERCHANT_TO_REWARDHUB"
        : netAmount < 0
          ? "REWARDHUB_TO_MERCHANT"
          : "NO_PAYMENT";

    const amountPayable =
      round2(
        Math.abs(
          netAmount
        )
      );

    console.log(
      "REWARDHUB SETTLEMENT REQUEST CALCULATION:",
      {
        requestId,
        merchantId,
        settlementMonth,
        periodStart,
        periodEnd,
        periodStartUtc,
        periodEndUtc,
        transactionCount,
        totalSales,
        totalCashback,
        totalRewardCredits,
        totalVoucherDiscount,
        totalMarketingBudget,
        merchantDue,
        rewardHubDue,
        netAmount,
        settlementDirection,
        amountPayable,
      }
    );

    if (
      transactionCount <= 0 ||
      totalSales <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            "No settlement transactions",
          message:
            "There are no new completed transactions available for settlement.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Create one settlement row directly in Supabase.
     * ----------------------------------------------------------
     */
    const settlementId = [
      "RHSET",
      settlementMonth.replace(
        "-",
        ""
      ),
      Date.now().toString(36)
        .toUpperCase(),
      Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase(),
    ].join("-");

    const now =
      new Date().toISOString();

    const merchantName =
      cleanText(
        merchant.display_name
      ) ||
      cleanText(
        merchant.business_name
      );

    const bankName =
      cleanText(
        merchant.bank_name
      );

    const bankAccountName =
      cleanText(
        merchant.bank_account_name
      );

    const bankAccount =
      cleanText(
        merchant.bank_account_no
      );

    const bankQrUrl =
      cleanText(
        merchant.bank_qr_url
      );

    const insertPayload = {
      settlement_id:
        settlementId,

      merchant_id:
        merchantId,

      settlement_month:
        `${settlementMonth}-01`,

      total_sales:
        totalSales,

      total_cashback:
        totalCashback,

      total_reward_credits:
        totalRewardCredits,

      total_voucher_discount:
        totalVoucherDiscount,

      total_marketing_budget:
        totalMarketingBudget,

      amount_payable:
        amountPayable,

      merchant_due:
        merchantDue,

      rewardhub_due:
        rewardHubDue,

      net_amount:
        netAmount,

      settlement_direction:
        settlementDirection,

      bank_name:
        bankName || null,

      bank_account:
        bankAccount || null,

      merchant_name:
        merchantName || null,

      bank_account_name:
        bankAccountName || null,

      bank_qr_url:
        bankQrUrl || null,

      status:
        "PENDING",

      payment_method:
        null,

      receipt_url:
        null,

      payment_note:
        null,

      reject_reason:
        null,

      approved_at:
        null,

      approved_by:
        null,

      rejected_at:
        null,

      rejected_by:
        null,

      paid_at:
        null,

      created_at:
        now,

      updated_at:
        now,
    };

    const insertResult =
      await supabase
        .from("settlements")
        .insert(
          insertPayload
        )
        .select(
          "settlement_id,merchant_id,settlement_month,total_sales,total_cashback,total_reward_credits,total_voucher_discount,total_marketing_budget,amount_payable,merchant_due,rewardhub_due,net_amount,settlement_direction,bank_name,bank_account,merchant_name,bank_account_name,bank_qr_url,status,payment_method,receipt_url,payment_note,reject_reason,approved_at,approved_by,rejected_at,rejected_by,paid_at,created_at,updated_at"
        )
        .single();

    if (insertResult.error) {
      console.error(
        "REWARDHUB SUPABASE SETTLEMENT WRITE ERROR:",
        {
          requestId,
          action,
          merchantId,
          settlementMonth,
          stage:
            "settlement-insert",
          reason:
            insertResult.error.message,
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error:
            insertResult.error.message,
          message:
            "Unable to create settlement request.",
        },
        {
          status: 500,
        }
      );
    }

    const row =
      insertResult.data as Record<
        string,
        unknown
      >;

    const payload = {
      settlementId:
        cleanText(
          row.settlement_id
        ),

      merchantId:
        cleanText(
          row.merchant_id
        ),

      month:
        cleanText(
          row.settlement_month
        ).slice(0, 7),

      totalSales:
        round2(
          row.total_sales
        ),

      totalCashback:
        round2(
          row.total_cashback
        ),

      totalRewardCredits:
        round2(
          row.total_reward_credits
        ),

      totalVoucherDiscount:
        round2(
          row.total_voucher_discount
        ),

      totalMarketingBudget:
        round2(
          row.total_marketing_budget
        ),

      merchantDue:
        round2(
          row.merchant_due
        ),

      rewardHubDue:
        round2(
          row.rewardhub_due
        ),

      netAmount:
        round2(
          row.net_amount
        ),

      settlementDirection:
        cleanText(
          row.settlement_direction
        ),

      amountPayable:
        round2(
          row.amount_payable
        ),

      bankName:
        cleanText(
          row.bank_name
        ),

      bankAccount:
        cleanText(
          row.bank_account
        ),

      bankAccountName:
        cleanText(
          row.bank_account_name
        ),

      bankQrUrl:
        cleanText(
          row.bank_qr_url
        ),

      merchantName:
        cleanText(
          row.merchant_name
        ),

      status:
        cleanText(
          row.status
        ),

      paymentMethod:
        cleanText(
          row.payment_method
        ),

      receiptUrl:
        cleanText(
          row.receipt_url
        ),

      paymentNote:
        cleanText(
          row.payment_note
        ),

      rejectReason:
        cleanText(
          row.reject_reason
        ),

      approvedAt:
        row.approved_at || "",

      approvedBy:
        cleanText(
          row.approved_by
        ),

      rejectedAt:
        row.rejected_at || "",

      rejectedBy:
        cleanText(
          row.rejected_by
        ),

      paidAt:
        row.paid_at || "",

      createdAt:
        row.created_at || "",

      updatedAt:
        row.updated_at || "",

      transactionCount,
    };

    console.log(
      "REWARDHUB SUPABASE WRITE SUCCESS:",
      {
        requestId,
        action,
        merchantId,
        settlementId,
        settlementMonth,
        transactionCount,
        amountPayable,
        settlementDirection,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          message:
            "Settlement request submitted",
          data:
            payload,
        },
        requestId,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "REWARDHUB SUPABASE DIRECT WRITE ERROR:",
      {
        requestId,
        action,
        merchantId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    /*
     * Do NOT return null here.
     * Returning null would send this mutation to Apps Script,
     * which could duplicate a settlement after an uncertain
     * Supabase write outcome.
     */
    return NextResponse.json(
      {
        success: false,
        requestId,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
        message:
          "Unable to submit settlement request.",
      },
      {
        status: 500,
      }
    );
  }
}


export async function POST(
  request: NextRequest
) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
          message:
            "The request body must be valid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isJsonObject(body)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request payload.",
          message:
            "The request payload must be a JSON object.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      typeof body.action === "string"
        ? body.action.trim()
        : "";

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing action.",
          message:
            "RewardHub API action is required.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * Give every local -> Apps Script request
     * a unique diagnostic identifier.
     *
     * Existing client-supplied requestId is preserved.
     */
    const requestId =
      typeof body.requestId === "string" &&
      body.requestId.trim()
        ? body.requestId.trim()
        : generateRequestId();

    const outgoingBody: JsonObject = {
      ...body,
      requestId,
    };

    const readOnly =
      isReadOnlyAction(action);

    console.log(
      "REWARDHUB REQUEST:",
      {
        requestId,
        action,
        readOnly,
      }
    );

    /*
     * ==========================================================
     * SUPABASE DIRECT-WRITE ROUTER
     * ==========================================================
     *
     * Migrated mutations are handled before the read router.
     * If handled here, they MUST NOT continue to Apps Script.
     */

    const supabaseMutationResponse =
      await tryHandleSupabaseMutation(
        action,
        outgoingBody,
        requestId
      );

    if (supabaseMutationResponse) {
      return supabaseMutationResponse;
    }


    /*
     * ==========================================================
     * SUPABASE DIRECT-READ ROUTER
     * ==========================================================
     */

    const supabaseResponse =
      await tryHandleSupabaseRead(
        action,
        outgoingBody,
        requestId
      );

    if (supabaseResponse) {
      return supabaseResponse;
    }


    /*
     * ==========================================================
     * APPS SCRIPT FALLBACK / UNMIGRATED ACTIONS
     * ==========================================================
     *
     * Validate Apps Script URL only after the Supabase direct
     * route had a chance to handle a migrated read action.
     */

    if (
      !API_URL ||
      !isValidAppsScriptUrl(
        API_URL
      )
    ) {
      console.error(
        "INVALID REWARDHUB APPS SCRIPT URL:",
        API_URL
      );

      return NextResponse.json(
        {
          success: false,
          requestId,

          error:
            "RewardHub backend URL is not configured correctly.",

          message:
            "Please set REWARDHUB_APPS_SCRIPT_URL to a valid Apps Script /exec deployment URL.",
        },
        {
          status: 500,
        }
      );
    }


    async function fetchAppsScript() {
      return fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",

          Accept:
            "application/json",

          "Cache-Control":
            "no-cache",
        },

        body:
          JSON.stringify(
            outgoingBody
          ),

        cache:
          "no-store",

        redirect:
          "follow",

        signal:
          AbortSignal.timeout(
            60000
          ),
      });
    }

    let upstreamResponse:
      Response;

    try {
      upstreamResponse =
        await fetchAppsScript();

      /**
       * ======================================================
       * CRITICAL SAFETY RULE
       * ======================================================
       *
       * NEVER automatically retry a mutation.
       *
       * A mutation may already have been executed by
       * Apps Script / PostgreSQL even if the final redirected
       * HTTP response is 404.
       *
       * Retrying mutations can cause:
       *
       * - duplicate payments
       * - duplicate card assignments
       * - duplicate settlements
       * - duplicated points
       * - duplicated commissions
       * - broken card lifecycle state
       *
       * Therefore only explicitly read-only actions
       * are eligible for one retry.
       */
      if (
        upstreamResponse.status === 404 &&
        readOnly
      ) {
        console.warn(
          "REWARDHUB READ RETRY:",
          {
            requestId,
            action,
            reason:
              "First Apps Script response returned 404.",
          }
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              800
            )
        );

        upstreamResponse =
          await fetchAppsScript();
      }
    } catch (error) {
      console.error(
        "REWARDHUB UPSTREAM FETCH ERROR:",
        {
          requestId,
          action,
          readOnly,
          error,
        }
      );

      const isTimeout =
        error instanceof Error &&
        (
          error.name ===
            "TimeoutError" ||
          error.name ===
            "AbortError"
        );

      return NextResponse.json(
        {
          success: false,
          requestId,

          error: isTimeout
            ? "RewardHub backend request timed out."
            : "Unable to connect to the RewardHub backend.",

          message:
            error instanceof Error
              ? error.message
              : "Apps Script request failed.",
        },
        {
          status: isTimeout
            ? 504
            : 502,
        }
      );
    }

    const rawText =
      await upstreamResponse.text();

    const cleanedText =
      removeJsonPrefix(rawText);

    if (!cleanedText) {
      console.error(
        "REWARDHUB EMPTY RESPONSE:",
        {
          requestId,
          action,
          readOnly,

          upstreamStatus:
            upstreamResponse.status,

          upstreamUrl:
            upstreamResponse.url,
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,

          error:
            "RewardHub backend returned an empty response.",

          message:
            `No response data was returned for action "${action}".`,
        },
        {
          status: 502,
        }
      );
    }

    let parsed: unknown;

    try {
      parsed =
        JSON.parse(
          cleanedText
        );
    } catch (error) {
      console.error(
        "REWARDHUB INVALID JSON RESPONSE:",
        {
          requestId,
          action,
          readOnly,

          upstreamStatus:
            upstreamResponse.status,

          upstreamContentType:
            upstreamResponse.headers.get(
              "content-type"
            ),

          upstreamUrl:
            upstreamResponse.url,

          preview:
            safeTextPreview(
              cleanedText
            ),

          error,
        }
      );

      const pageNotFound =
        upstreamResponse.status ===
          404 ||
        /page not found/i.test(
          cleanedText
        );

      return NextResponse.json(
        {
          success: false,
          requestId,

          error: pageNotFound
            ? "RewardHub Apps Script deployment was not found."
            : "RewardHub backend returned an invalid response.",

          message: pageNotFound
            ? readOnly
              ? "The configured Apps Script deployment could not be reached correctly."
              : "The backend returned 404. This mutation was NOT retried automatically to prevent duplicate writes."
            : "The Apps Script backend did not return valid JSON.",

          details:
            process.env.NODE_ENV ===
            "development"
              ? safeTextPreview(
                  cleanedText
                )
              : undefined,
        },
        {
          status: 502,
        }
      );
    }

    if (!isJsonObject(parsed)) {
      console.error(
        "REWARDHUB NON-OBJECT RESPONSE:",
        {
          requestId,
          action,
          parsed,
        }
      );

      return NextResponse.json(
        {
          success: false,
          requestId,

          error:
            "RewardHub backend returned an unexpected response.",

          message:
            "The backend response must be a JSON object.",
        },
        {
          status: 502,
        }
      );
    }

    const success =
      parsed.success !== false;

    if (
      !upstreamResponse.ok ||
      !success
    ) {
      const errorMessage =
        typeof parsed.error ===
        "string"
          ? parsed.error
          : typeof parsed.message ===
              "string"
            ? parsed.message
            : "RewardHub backend request failed.";

      console.error(
        "REWARDHUB BACKEND ERROR:",
        {
          requestId,
          action,
          readOnly,

          upstreamStatus:
            upstreamResponse.status,

          response:
            parsed,
        }
      );

      return NextResponse.json(
        {
          ...parsed,

          requestId,
          success: false,
          error:
            errorMessage,
        },
        {
          status:
            upstreamResponse.ok
              ? 400
              : upstreamResponse.status,
        }
      );
    }

    console.log(
      "REWARDHUB REQUEST SUCCESS:",
      {
        requestId,
        action,
        readOnly,

        upstreamStatus:
          upstreamResponse.status,
      }
    );

    return NextResponse.json(
      {
        ...parsed,
        requestId,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "LOCAL REWARDHUB API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Local RewardHub API error.",

        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}