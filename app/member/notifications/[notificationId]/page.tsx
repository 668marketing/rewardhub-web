"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import {
  getMemberNotifications,
  markMemberNotificationRead,
  type MemberNotificationItem,
} from "@/lib/api";

type StoredMember = {
  memberId?: string;
  MEMBER_ID?: string;
  id?: string;
  profile?: StoredMember;
  member?: StoredMember;
  data?: StoredMember;
};

type Translate = (key: string) => string;

function getMemberIdFromStorage() {
  if (typeof window === "undefined") return "";

  try {
    const raw = window.localStorage.getItem("member");

    if (!raw) return "";

    const parsed = JSON.parse(raw) as StoredMember;

    return String(
      parsed.memberId ??
        parsed.MEMBER_ID ??
        parsed.id ??
        parsed.profile?.memberId ??
        parsed.profile?.MEMBER_ID ??
        parsed.member?.memberId ??
        parsed.member?.MEMBER_ID ??
        parsed.data?.memberId ??
        parsed.data?.MEMBER_ID ??
        ""
    ).trim();
  } catch {
    return "";
  }
}

function unwrapData(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") {
    return {};
  }

  const root = result as Record<string, unknown>;

  const first =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  return first.data && typeof first.data === "object"
    ? (first.data as Record<string, unknown>)
    : first;
}

function getDateLocale(language: string) {
  if (language === "zh") return "zh-CN";
  if (language === "ms") return "ms-MY";
  return "en-MY";
}

function formatDateTime(
  value: string,
  language: string
) {
  if (!value) return "";

  const timestamp = new Date(
    value.includes("T")
      ? value
      : value.replace(" ", "T")
  ).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(
    getDateLocale(language),
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(timestamp));
}

function getVisual(
  notification: MemberNotificationItem | null,
  t: Translate
) {
  const source = [
    notification?.notificationId,
    notification?.title,
    notification?.targetUrl,
  ]
    .join(" ")
    .toUpperCase();

  if (source.includes("PAYMENT")) {
    return {
      icon: "✓",
      label: t(
        "memberNotificationDetail.notificationTypes.payment"
      ),
      cardClass:
        "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
      iconClass:
        "bg-emerald-600 text-white",
    };
  }

  if (
    source.includes("REFERRAL") ||
    source.includes("COMMISSION")
  ) {
    return {
      icon: "↗",
      label: t(
        "memberNotificationDetail.notificationTypes.reward"
      ),
      cardClass:
        "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
      iconClass:
        "bg-violet-600 text-white",
    };
  }

  if (
    source.includes("TIER") ||
    source.includes("UPGRADE")
  ) {
    return {
      icon: "★",
      label: t(
        "memberNotificationDetail.notificationTypes.membership"
      ),
      cardClass:
        "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
      iconClass:
        "bg-amber-500 text-white",
    };
  }

  return {
    icon: "i",
    label: "RewardHub",
    cardClass:
      "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    iconClass:
      "bg-slate-900 text-white",
  };
}

function dispatchNotificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event(
        "rewardhub-notifications-updated"
      )
    );
  }
}

export default function MemberNotificationDetailPage() {
  const params =
    useParams<{ notificationId: string }>();
  const router = useRouter();
  const { t, language } = useLanguage();

  const notificationId = useMemo(
    () =>
      decodeURIComponent(
        String(params.notificationId || "")
      ),
    [params.notificationId]
  );

  const [notification, setNotification] =
    useState<MemberNotificationItem | null>(
      null
    );
  const [memberId, setMemberId] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const loadNotification =
    useCallback(async () => {
      if (!memberId || !notificationId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result =
          await getMemberNotifications({
            memberId,
            limit: 500,
          });

        const data = unwrapData(result);

        const items = Array.isArray(
          data.items
        )
          ? (data.items as MemberNotificationItem[])
          : [];

        const matched =
          items.find(
            (item) =>
              item.userNotificationId ===
              notificationId
          ) || null;

        if (!matched) {
          setError(
            t(
              "memberNotificationDetail.notificationNotFound"
            )
          );
          return;
        }

        setNotification(matched);

        if (!matched.isRead) {
          await markMemberNotificationRead({
            memberId,
            userNotificationId:
              matched.userNotificationId,
          });

          setNotification({
            ...matched,
            status: "READ",
            isRead: true,
            readAt:
              new Date().toISOString(),
          });

          dispatchNotificationUpdate();
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t(
                "memberNotificationDetail.unableToLoad"
              )
        );
      } finally {
        setLoading(false);
      }
    }, [memberId, notificationId, t]);

  useEffect(() => {
    const storedMemberId =
      getMemberIdFromStorage();

    if (!storedMemberId) {
      setError(
        t(
          "memberNotificationDetail.sessionUnavailable"
        )
      );
      setLoading(false);
      return;
    }

    setMemberId(storedMemberId);
  }, [t]);

  useEffect(() => {
    void loadNotification();
  }, [loadNotification]);

  const visual = getVisual(
    notification,
    t
  );

  function openRelatedPage() {
    const targetUrl = String(
      notification?.targetUrl || ""
    ).trim();

    if (!targetUrl) return;

    if (/^https?:\/\//i.test(targetUrl)) {
      window.location.href = targetUrl;
      return;
    }

    router.push(
      targetUrl.startsWith("/")
        ? targetUrl
        : `/${targetUrl}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/member/notifications"
            )
          }
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span aria-hidden="true">←</span>

          {t(
            "memberNotificationDetail.notifications"
          )}
        </button>

        {loading ? (
          <div className="h-[480px] animate-pulse rounded-[32px] bg-white shadow-sm" />
        ) : error ? (
          <section className="rounded-[32px] border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">
              !
            </div>

            <h1 className="mt-4 text-2xl font-black text-slate-950">
              {t(
                "memberNotificationDetail.unableToOpen"
              )}
            </h1>

            <p className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          </section>
        ) : notification ? (
          <article
            className={`overflow-hidden rounded-[32px] border shadow-sm ${visual.cardClass}`}
          >
            <div className="p-6 sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-sm ${visual.iconClass}`}
                  >
                    {visual.icon}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      {visual.label}
                    </p>

                    <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      {notification.title}
                    </h1>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {formatDateTime(
                    notification.createdAt,
                    language
                  )}
                </span>
              </div>

              {notification.imageUrl ? (
                <div className="mt-7 overflow-hidden rounded-3xl border border-white/60 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      notification.imageUrl
                    }
                    alt=""
                    className="max-h-[420px] w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-7 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
                <p className="whitespace-pre-line text-[15px] font-medium leading-8 text-slate-700 sm:text-base">
                  {notification.message}
                </p>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/member/notifications"
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  {t(
                    "memberNotificationDetail.back"
                  )}
                </button>

                {notification.targetUrl ? (
                  <button
                    type="button"
                    onClick={
                      openRelatedPage
                    }
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    {t(
                      "memberNotificationDetail.openRelatedPage"
                    )}{" "}
                    →
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
