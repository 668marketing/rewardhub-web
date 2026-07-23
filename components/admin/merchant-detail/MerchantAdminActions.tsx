import {
  Ban,
  BarChart3,
  Pencil,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import type {
  AdminMerchantDetail,
} from "@/lib/admin-merchant-detail";

type MerchantAdminActionsProps = {
  merchant: AdminMerchantDetail;
};

export default function MerchantAdminActions({
  merchant,
}: MerchantAdminActionsProps) {
  const isSuspended =
    merchant.status
      .toUpperCase() ===
    "SUSPENDED";

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">
            Admin Actions
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Merchant management
            controls
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ActionButton
          icon={Ban}
          label={
            isSuspended
              ? "Activate Merchant"
              : "Suspend Merchant"
          }
          disabled
          danger={!isSuspended}
        />

        <ActionButton
          icon={Pencil}
          label="Edit Profile"
          disabled
        />

        <ActionButton
          icon={BarChart3}
          label="Adjust Marketing Budget"
          disabled
        />

        <ActionButton
          icon={ReceiptText}
          label="View Transactions"
          disabled
        />
      </div>

      <p className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-200/70">
        Actions will be activated
        after the Overview tabs are
        completed.
      </p>
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  danger = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left text-sm font-medium transition",
        danger
          ? "border-red-400/15 bg-red-400/[0.05] text-red-300"
          : "border-white/[0.08] bg-slate-950/35 text-slate-300",
        disabled
          ? "cursor-not-allowed opacity-45"
          : "hover:bg-white/[0.06]",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}