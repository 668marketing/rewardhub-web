"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  getAdminSession,
  loginAdmin,
} from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberMe, setRememberMe] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        const result =
          await getAdminSession();

        if (
          active &&
          result.authenticated
        ) {
          router.replace(
            "/admin/dashboard"
          );
          return;
        }
      } catch {
        // No valid session.
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your admin email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await loginAdmin({
        email: normalizedEmail,
        password,
        rememberMe,
      });

      router.replace(
        "/admin/dashboard"
      );

      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="text-sm text-slate-400">
            Checking admin session…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_36%)]" />

      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full border border-emerald-400/10" />
      <div className="absolute bottom-[-180px] right-[-100px] h-96 w-96 rounded-full border border-blue-400/10" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between px-12 py-12 lg:flex xl:px-20 xl:py-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="text-lg font-semibold text-white">
                RewardHub
              </p>

              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Administration
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              <LockKeyhole className="h-4 w-4" />
              Secure administration portal
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Manage the entire
              <span className="block text-emerald-400">
                RewardHub network.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
              Review members, merchants,
              transactions, settlements,
              marketing budgets and platform
              operations from one secure
              workspace.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} RewardHub.
            Authorized personnel only.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold text-white">
                  RewardHub
                </p>

                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Admin Portal
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Admin access
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Welcome back
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Sign in with your authorized
                  RewardHub administrator account.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="admin@rewardhub.my"
                      disabled={loading}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      id="admin-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password"
                      disabled={loading}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300 disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(
                          event.target.checked
                        )
                      }
                      disabled={loading}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-500 accent-emerald-500"
                    />

                    Remember me
                  </label>

                  <span className="text-xs text-slate-600">
                    Secure session
                  </span>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Sign in to Admin Portal
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="text-center text-xs leading-5 text-slate-600">
                  Access is monitored and important
                  administrative actions are recorded
                  in the RewardHub audit log.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}