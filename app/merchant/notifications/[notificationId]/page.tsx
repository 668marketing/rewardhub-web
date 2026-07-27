"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  getMerchantNotifications,
  markMerchantNotificationRead,
  type MerchantNotificationItem,
} from "@/lib/api";

type StoredMerchant = {
  merchantId?: string;
  MERCHANT_ID?: string;
  id?: string;
  profile?: StoredMerchant;
  merchant?: StoredMerchant;
  data?: StoredMerchant;
  user?: StoredMerchant;
};

function findMerchantId(
  value: unknown
): string {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const directId = String(
    record.merchantId ??
      record.MERCHANT_ID ??
      record.merchantID ??
      record.id ??
      ""
  ).trim();

  if (directId) {
    return directId;
  }

  const nestedKeys = [
    "profile",
    "merchant",
    "data",
    "user",
    "account",
    "result",
  ];

  for (const key of nestedKeys) {
    const nested =
      record[key];

    const found =
      findMerchantId(
        nested
      );

    if (found) {
      return found;
    }
  }

  return "";
}

function getMerchantIdFromStorage(): string {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  const keys = [
    "merchant",
    "merchantData",
    "merchantAuth",
    "merchantSession",
    "rewardhubMerchant",
    "rewardhub_merchant",
  ];

  for (const storage of [
    window.localStorage,
    window.sessionStorage,
  ]) {
    for (const key of keys) {
      try {
        const raw =
          storage.getItem(
            key
          );

        if (!raw) {
          continue;
        }

        const parsed =
          JSON.parse(raw);

        const merchantId =
          findMerchantId(
            parsed
          );

        if (merchantId) {
          return merchantId;
        }
      } catch {
        // Continue checking.
      }
    }
  }

  return "";
}

function unwrapData(
  result: unknown
): Record<
  string,
  unknown
> {
  if (
    !result ||
    typeof result !==
      "object"
  ) {
    return {};
  }

  const root =
    result as Record<
      string,
      unknown
    >;

  const first =
    root.data &&
    typeof root.data ===
      "object"
      ? (root.data as Record<
          string,
          unknown
        >)
      : root;

  return first.data &&
    typeof first.data ===
      "object"
    ? (first.data as Record<
        string,
        unknown
      >)
    : first;
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "";
  }

  const normalized =
    value.includes("T")
      ? value
      : value.replace(
          " ",
          "T"
        );

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      dateStyle: "full",
      timeStyle: "short",
    }
  ).format(date);
}

function dispatchNotificationUpdate() {
  window.dispatchEvent(
    new Event(
      "rewardhub-merchant-notifications-updated"
    )
  );
}

export default function MerchantNotificationDetailPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      notificationId: string;
    }>();

  const notificationId =
    decodeURIComponent(
      String(
        params?.notificationId ||
          ""
      )
    );

  const [
    notification,
    setNotification,
  ] = useState<
    MerchantNotificationItem | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      const merchantId =
        getMerchantIdFromStorage();

      if (!merchantId) {
        if (!cancelled) {
          setError(
            "Merchant session is unavailable. Please return to the dashboard and try again."
          );
          setLoading(false);
        }

        return;
      }

      if (!notificationId) {
        if (!cancelled) {
          setError(
            "Notification ID is missing."
          );
          setLoading(false);
        }

        return;
      }

      try {
        const result =
          await getMerchantNotifications(
            {
              merchantId,
              limit: 500,
            }
          );

        const data =
          unwrapData(result);

        const items =
          Array.isArray(
            data.items
          )
            ? (data.items as MerchantNotificationItem[])
            : [];

        const matched =
          items.find(
            (item) =>
              item.userNotificationId ===
              notificationId
          ) || null;

        if (!matched) {
          if (!cancelled) {
            setError(
              "Notification not found."
            );
          }

          return;
        }

        let updatedNotification =
          matched;

        if (!matched.isRead) {
          await markMerchantNotificationRead(
            {
              merchantId,
              userNotificationId:
                matched.userNotificationId,
            }
          );

          updatedNotification =
            {
              ...matched,
              status:
                "READ",
              isRead:
                true,
              readAt:
                new Date().toISOString(),
            };

          dispatchNotificationUpdate();
        }

        if (!cancelled) {
          setNotification(
            updatedNotification
          );
        }
      } catch (
        loadError
      ) {
        if (!cancelled) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load notification."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(
            false
          );
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [notificationId]);

  function goBack() {
    if (
      window.history.length >
      1
    ) {
      router.back();
      return;
    }

    router.push(
      "/merchant/notifications"
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto w-full max-w-4xl">
          <div className="h-96 animate-pulse rounded-[32px] bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (
    error ||
    !notification
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto w-full max-w-4xl">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <button
              type="button"
              onClick={
                goBack
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              ← Back
            </button>

            <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
              <div className="text-4xl">
                ⚠️
              </div>

              <h1 className="mt-4 text-2xl font-black text-slate-950">
                Unable to open notification
              </h1>

              <p className="mt-2 text-sm font-bold text-red-700">
                {error ||
                  "Notification not found."}
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const targetUrl =
    String(
      notification.targetUrl ||
        ""
    ).trim();

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={
            goBack
          }
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          ← Back to Notifications
        </button>

        <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                  Merchant Notification
                </p>

                <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl">
                  {
                    notification.title
                  }
                </h1>

                <p className="mt-4 text-sm font-bold text-slate-300">
                  {formatDateTime(
                    notification.createdAt
                  )}
                </p>
              </div>

              <span className="inline-flex w-fit shrink-0 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-black text-emerald-300 ring-1 ring-inset ring-emerald-300/20">
                READ
              </span>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {notification.imageUrl ? (
              <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                <img
                  src={
                    notification.imageUrl
                  }
                  alt=""
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            ) : null}

            <div className="rounded-3xl bg-slate-50 p-5 sm:p-7">
              <p className="whitespace-pre-line text-base font-medium leading-8 text-slate-700 sm:text-lg">
                {
                  notification.message
                }
              </p>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    goBack
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Notifications
                </button>

                {targetUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        targetUrl
                      )
                    }
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Open Related Page →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}