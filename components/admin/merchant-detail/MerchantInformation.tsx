import {
  Building2,
  Landmark,
  MapPin,
} from "lucide-react";

import type {
  AdminMerchantDetail,
} from "@/lib/admin-merchant-detail";

type MerchantInformationProps = {
  merchant: AdminMerchantDetail;
};

export default function MerchantInformation({
  merchant,
}: MerchantInformationProps) {
  return (
    <div className="space-y-5">
      <InformationSection
        icon={Building2}
        title="Basic Information"
      >
        <InformationGrid
          items={[
            {
              label: "Merchant Name",
              value:
                merchant.merchantName,
            },
            {
              label: "Legal Name",
              value:
                merchant.legalName,
            },
            {
              label: "Display Name",
              value:
                merchant.displayName,
            },
            {
              label: "Category",
              value:
                merchant.category,
            },
            {
              label: "Contact Person",
              value:
                merchant.contactPerson,
            },
            {
              label: "Email",
              value:
                merchant.email,
            },
            {
              label: "Phone",
              value:
                merchant.phone,
            },
            {
              label: "Website",
              value:
                merchant.website,
            },
            {
              label: "SSM Number",
              value:
                merchant.ssmNumber,
            },
            {
              label: "Last Login",
              value:
                formatDateTime(
                  merchant.lastLoginAt
                ),
            },
          ]}
        />

        {merchant.description ? (
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-600">
              Description
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
              {merchant.description}
            </p>
          </div>
        ) : null}
      </InformationSection>

      <InformationSection
        icon={MapPin}
        title="Business Address"
      >
        <InformationGrid
          items={[
            {
              label: "Address Line 1",
              value:
                merchant.addressLine1,
            },
            {
              label: "Address Line 2",
              value:
                merchant.addressLine2,
            },
            {
              label: "City",
              value:
                merchant.city,
            },
            {
              label: "State",
              value:
                merchant.state,
            },
            {
              label: "Postcode",
              value:
                merchant.postcode,
            },
            {
              label: "Country",
              value:
                merchant.country,
            },
          ]}
        />
      </InformationSection>

      <InformationSection
        icon={Landmark}
        title="Bank Information"
      >
        <InformationGrid
          items={[
            {
              label: "Bank Name",
              value:
                merchant.bankName,
            },
            {
              label:
                "Bank Account Name",
              value:
                merchant.bankAccountName,
            },
            {
              label:
                "Bank Account Number",
              value:
                maskBankAccount(
                  merchant.bankAccountNumber
                ),
            },
          ]}
        />
      </InformationSection>
    </div>
  );
}

function InformationSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>

        <h2 className="text-base font-semibold text-white">
          {title}
        </h2>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

function InformationGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
            {item.label}
          </p>

          <p className="mt-2 break-words text-sm leading-6 text-slate-300">
            {item.value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function maskBankAccount(
  value: string
) {
  const account = String(
    value || ""
  ).trim();

  if (!account) {
    return "";
  }

  if (account.length <= 4) {
    return account;
  }

  return `${"•".repeat(
    Math.min(
      account.length - 4,
      8
    )
  )}${account.slice(-4)}`;
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-MY",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}