import {
  BarChart3,
  Bell,
  Boxes,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  WalletCards,
} from "lucide-react";

export type MerchantDetailTab =
  | "overview"
  | "transactions"
  | "marketing"
  | "settlements"
  | "products"
  | "reviews"
  | "push-devices";

type MerchantDetailTabsProps = {
  activeTab: MerchantDetailTab;

  onChange: (
    tab: MerchantDetailTab
  ) => void;

  counts?: {
    transactions?: number;
    settlements?: number;
    products?: number;
    reviews?: number;
    pushDevices?: number;
  };
};

type MerchantTabItem = {
  id: MerchantDetailTab;
  label: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  countKey?:
    | "transactions"
    | "settlements"
    | "products"
    | "reviews"
    | "pushDevices";
};

const tabs: MerchantTabItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: ReceiptText,
    countKey: "transactions",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: BarChart3,
  },
  {
    id: "settlements",
    label: "Settlements",
    icon: WalletCards,
    countKey: "settlements",
  },
  {
    id: "products",
    label: "Products",
    icon: Boxes,
    countKey: "products",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: MessageSquareText,
    countKey: "reviews",
  },
  {
    id: "push-devices",
    label: "Push Devices",
    icon: Bell,
    countKey: "pushDevices",
  },
];

export default function MerchantDetailTabs({
  activeTab,
  onChange,
  counts = {},
}: MerchantDetailTabsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/50">
      <div className="overflow-x-auto p-2">
        <div className="flex min-w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            const isActive =
              activeTab === tab.id;

            const count =
              tab.countKey
                ? counts[tab.countKey]
                : undefined;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  onChange(tab.id)
                }
                className={[
                  "flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                  isActive
                    ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/10"
                    : "text-slate-500 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>
                  {tab.label}
                </span>

                {typeof count ===
                "number" ? (
                  <span
                    className={[
                      "min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold",
                      isActive
                        ? "bg-slate-950/15 text-slate-900"
                        : "bg-white/[0.055] text-slate-600",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}