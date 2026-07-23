import {
  Construction,
} from "lucide-react";

type MerchantTabPlaceholderProps = {
  title: string;
  description: string;
};

export default function MerchantTabPlaceholder({
  title,
  description,
}: MerchantTabPlaceholderProps) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-slate-900/50 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
        <Construction className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}