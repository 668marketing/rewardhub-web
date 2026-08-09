"use client";

import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  formatNotificationRelativeTime,
  getAdminNotificationInbox,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminInboxNotificationItem,
} from "@/lib/admin-notifications";

type AdminNotificationDropdownProps = {
  open: boolean;
  onClose: () => void;
};

const INBOX_LIMIT =
  8;

const AUTO_REFRESH_MS =
  3_000;


function playAdminNotificationSound() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?:
            typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext =
      new AudioContextClass();

    const playTone = (
      frequency: number,
      startOffset: number,
      duration: number
    ) => {
      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type =
        "sine";

      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime +
          startOffset
      );

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime +
          startOffset
      );

      gain.gain.exponentialRampToValueAtTime(
        0.16,
        audioContext.currentTime +
          startOffset +
          0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          startOffset +
          duration
      );

      oscillator.connect(
        gain
      );

      gain.connect(
        audioContext.destination
      );

      oscillator.start(
        audioContext.currentTime +
          startOffset
      );

      oscillator.stop(
        audioContext.currentTime +
          startOffset +
          duration
      );
    };

    if (
      audioContext.state ===
      "suspended"
    ) {
      void audioContext.resume();
    }

    playTone(
      880,
      0,
      0.16
    );

    playTone(
      1175,
      0.18,
      0.22
    );

    window.setTimeout(
      () => {
        void audioContext.close();
      },
      700
    );
  } catch (
    soundError
  ) {
    console.warn(
      "Unable to play administrator notification sound:",
      soundError
    );
  }
}

export default function AdminNotificationDropdown({
  open,
  onClose,
}: AdminNotificationDropdownProps) {
  const router =
    useRouter();

  const panelRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const abortControllerRef =
    useRef<AbortController | null>(
      null
    );

  const previousUnreadCountRef =
    useRef(0);

  const hasLoadedInboxRef =
    useRef(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    markingAllRead,
    setMarkingAllRead,
  ] =
    useState(false);

  const [
    activeNotificationId,
    setActiveNotificationId,
  ] =
    useState("");

  const [
    notifications,
    setNotifications,
  ] =
    useState<AdminInboxNotificationItem[]>(
      []
    );

  const [
    serverUnreadCount,
    setServerUnreadCount,
  ] =
    useState(0);

  const [
    error,
    setError,
  ] =
    useState("");

  const unreadCount =
    useMemo(
      () => {
        const visibleUnread =
          notifications.filter(
            (
              notification
            ) =>
              !notification.isRead
          ).length;

        return Math.max(
          serverUnreadCount,
          visibleUnread
        );
      },
      [
        notifications,
        serverUnreadCount,
      ]
    );

  const loadNotifications =
    useCallback(
      async (
        options?: {
          silent?: boolean;
          playSoundOnIncrease?: boolean;
        }
      ) => {
        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const silent =
          Boolean(
            options?.silent
          );

        try {
          if (
            silent
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            ""
          );

          const inbox =
            await getAdminNotificationInbox({
              limit:
                INBOX_LIMIT,

              unreadOnly:
                false,

              signal:
                controller.signal,
            });

          const nextUnreadCount =
            Math.max(
              0,
              Number(
                inbox.unreadCount ||
                0
              )
            );

          const shouldPlaySound =
            Boolean(
              options
                ?.playSoundOnIncrease
            ) &&
            hasLoadedInboxRef.current &&
            nextUnreadCount >
              previousUnreadCountRef.current;

          setNotifications(
            inbox.items
          );

          setServerUnreadCount(
            nextUnreadCount
          );

          previousUnreadCountRef.current =
            nextUnreadCount;

          hasLoadedInboxRef.current =
            true;

          window.dispatchEvent(
            new CustomEvent(
              "rewardhub-admin-notification-count",
              {
                detail: {
                  unreadCount:
                    nextUnreadCount,
                },
              }
            )
          );

          if (
            shouldPlaySound
          ) {
            playAdminNotificationSound();
          }
        } catch (
          loadError
        ) {
          if (
            loadError instanceof
              DOMException &&
            loadError.name ===
              "AbortError"
          ) {
            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load administrator notifications."
          );
        } finally {
          if (
            abortControllerRef.current ===
            controller
          ) {
            abortControllerRef.current =
              null;

            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      []
    );

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    if (
      open
    ) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    open,
    onClose,
  ]);

  useEffect(() => {
    void loadNotifications({
      silent:
        !open,
      playSoundOnIncrease:
        true,
    });

    const timer =
      window.setInterval(
        () => {
          void loadNotifications({
            silent:
              true,
            playSoundOnIncrease:
              true,
          });
        },
        AUTO_REFRESH_MS
      );

    function handleWindowFocus() {
      void loadNotifications({
        silent:
          true,
        playSoundOnIncrease:
          true,
      });
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadNotifications({
          silent:
            true,
          playSoundOnIncrease:
            true,
        });
      }
    }

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(
        timer
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      abortControllerRef.current?.abort();
    };
  }, [
    loadNotifications,
    open,
  ]);

  async function handleRefresh() {
    if (
      refreshing ||
      loading
    ) {
      return;
    }

    await loadNotifications({
      silent:
        true,
    });
  }

  async function handleMarkAllRead() {
    if (
      markingAllRead ||
      unreadCount ===
        0
    ) {
      return;
    }

    try {
      setMarkingAllRead(
        true
      );

      setError(
        ""
      );

      await markAllAdminNotificationsRead();

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              notification
            ) => ({
              ...notification,
              isRead:
                true,
              status:
                "READ",
              readAt:
                notification.readAt ||
                new Date().toISOString(),
            })
          )
      );

      setServerUnreadCount(
        0
      );

      previousUnreadCountRef.current =
        0;

      window.dispatchEvent(
        new CustomEvent(
          "rewardhub-admin-notification-count",
          {
            detail: {
              unreadCount:
                0,
            },
          }
        )
      );
    } catch (
      markAllError
    ) {
      setError(
        markAllError instanceof
          Error
          ? markAllError.message
          : "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAllRead(
        false
      );
    }
  }

  async function handleOpenNotification(
    notification: AdminInboxNotificationItem
  ) {
    if (
      activeNotificationId
    ) {
      return;
    }

    try {
      setActiveNotificationId(
        notification.notificationId
      );

      setError(
        ""
      );

      if (
        !notification.isRead
      ) {
        await markAdminNotificationRead(
          notification.notificationId
        );

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.notificationId ===
                notification.notificationId
                  ? {
                      ...item,
                      isRead:
                        true,
                      status:
                        "READ",
                      readAt:
                        item.readAt ||
                        new Date().toISOString(),
                    }
                  : item
            )
        );

        const nextUnreadCount =
          Math.max(
            serverUnreadCount -
              1,
            0
          );

        setServerUnreadCount(
          nextUnreadCount
        );

        previousUnreadCountRef.current =
          nextUnreadCount;

        window.dispatchEvent(
          new CustomEvent(
            "rewardhub-admin-notification-count",
            {
              detail: {
                unreadCount:
                  nextUnreadCount,
              },
            }
          )
        );
      }

      if (
        notification.actionUrl
      ) {
        onClose();

        router.push(
          notification.actionUrl
        );
      }
    } catch (
      openError
    ) {
      setError(
        openError instanceof
          Error
          ? openError.message
          : "Unable to open notification."
      );
    } finally {
      setActiveNotificationId(
        ""
      );
    }
  }

  if (
    !open
  ) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={
          onClose
        }
        className="fixed inset-0 z-40 cursor-default bg-slate-950/20 backdrop-blur-[1px]"
      />

      <div
        ref={
          panelRef
        }
        className="fixed right-4 top-[90px] z-50 w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-3xl border border-white/[0.09] bg-slate-900 shadow-2xl shadow-black/50 sm:right-6 lg:right-8"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Notifications
                </h2>

                {unreadCount >
                0 ? (
                  <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    {unreadCount >
                    99
                      ? "99+"
                      : unreadCount}
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 text-xs text-slate-500">
                Latest administrator activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Refresh notifications"
              disabled={
                refreshing ||
                loading
              }
              onClick={() => {
                void handleRefresh();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  refreshing
                    ? "animate-spin"
                    : "",
                ].join(" ")}
              />
            </button>

            <button
              type="button"
              aria-label="Close notifications"
              onClick={
                onClose
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <p className="text-xs text-slate-500">
            {unreadCount >
            0
              ? `${unreadCount} unread notification(s)`
              : "You are all caught up"}
          </p>

          <button
            type="button"
            disabled={
              unreadCount ===
                0 ||
              markingAllRead
            }
            onClick={() => {
              void handleMarkAllRead();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200 disabled:cursor-not-allowed disabled:text-slate-700"
          >
            {markingAllRead ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}

            {markingAllRead
              ? "Marking…"
              : "Mark all read"}
          </button>
        </div>

        {error ? (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error}
            </span>
          </div>
        ) : null}

        <div className="max-h-[520px] overflow-y-auto">
          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />

              <p className="mt-4 text-sm font-medium text-white">
                Loading notifications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Retrieving the latest administrator activity.
              </p>
            </div>
          ) : notifications.length ===
            0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-500">
                <Inbox className="h-6 w-6" />
              </div>

              <p className="mt-5 text-sm font-semibold text-white">
                No notifications yet
              </p>

              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                New merchant applications, settlements, security alerts and system updates will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {notifications.map(
                (
                  notification
                ) => {
                  const opening =
                    activeNotificationId ===
                    notification.notificationId;

                  return (
                    <button
                      key={
                        notification.notificationId
                      }
                      type="button"
                      disabled={
                        Boolean(
                          activeNotificationId
                        )
                      }
                      onClick={() => {
                        void handleOpenNotification(
                          notification
                        );
                      }}
                      className={[
                        "group flex w-full items-start gap-3 px-5 py-4 text-left transition disabled:cursor-wait",
                        notification.isRead
                          ? "bg-transparent hover:bg-white/[0.035]"
                          : "bg-emerald-400/[0.035] hover:bg-emerald-400/[0.06]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                          notification.isRead
                            ? "border-white/[0.07] bg-white/[0.03] text-slate-500"
                            : "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
                        ].join(" ")}
                      >
                        {opening ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-white">
                            {notification.title}
                          </p>

                          {!notification.isRead ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                          ) : null}
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                            <Clock3 className="h-3 w-3" />

                            {formatNotificationRelativeTime(
                              notification.createdAt
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 transition group-hover:text-emerald-300">
                            {opening
                              ? "Opening"
                              : "Open"}

                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.07] p-3">
          <button
            type="button"
            onClick={() => {
              onClose();

              router.push(
                "/admin/notifications"
              );
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] text-sm font-semibold text-slate-300 transition hover:bg-white/[0.065] hover:text-white"
          >
            View all notifications
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}