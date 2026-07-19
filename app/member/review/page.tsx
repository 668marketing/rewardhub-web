"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MemberLayout from "@/components/layout/MemberLayout";
import { addMerchantReview } from "@/lib/api";

export default function ReviewPage() {
  const router = useRouter();

  const [transactionId, setTransactionId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    setTransactionId(
      params.get("transactionId") || ""
    );

    setMerchantId(
      params.get("merchantId") || ""
    );

    setPageReady(true);
  }, []);

  async function submit() {
    if (!transactionId || !merchantId) {
      alert("Missing transaction details.");
      return;
    }

    const storedMember = JSON.parse(
      localStorage.getItem("member") || "{}"
    );

    const memberId =
      storedMember?.memberId ||
      storedMember?.MEMBER_ID ||
      "";

    if (!memberId) {
      alert("Please login again.");
      return;
    }

    if (rating < 1 || rating > 5) {
      alert("Please select a rating.");
      return;
    }

    const cleanComment = comment.trim();

    if (cleanComment.length > 1000) {
      alert(
        "Comment must not exceed 1000 characters."
      );
      return;
    }

    try {
      setLoading(true);

      await addMerchantReview({
        transactionId,
        memberId,
        merchantId,
        rating,
        comment: cleanComment
      });

      alert("Review submitted successfully");

      router.push(
        `/member/merchant/${merchantId}`
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to submit review."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!pageReady) {
    return (
      <MemberLayout>
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-center text-sm font-black text-slate-500">
          Loading review page...
        </main>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),#f8fafc] px-4 py-5 pb-32 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-2xl">
          <Link
            href="/member/transactions"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 no-underline shadow-sm sm:px-5 sm:py-3 sm:text-sm"
          >
            ← Back to History
          </Link>

          <div className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-xl sm:mt-6 sm:rounded-[2rem] sm:p-8 md:p-10">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl sm:h-16 sm:w-16 sm:rounded-3xl sm:text-3xl">
                ⭐
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-950 sm:mt-5 sm:text-4xl">
                Leave Review
              </h1>

              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm">
                Share your experience with this merchant.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 sm:mt-8 sm:rounded-3xl sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                Transaction ID
              </p>

              <p className="mt-2 break-all text-xs font-black text-slate-950 sm:text-sm">
                {transactionId || "-"}
              </p>
            </div>

            <div className="mt-7 sm:mt-8">
              <p className="text-center text-base font-black text-slate-950 sm:text-lg">
                Your Rating
              </p>

              <div className="mt-4 flex justify-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRating(star)
                      }
                      aria-label={`${star} star rating`}
                      className="text-3xl transition active:scale-90 sm:text-5xl"
                    >
                      {star <= rating
                        ? "⭐"
                        : "☆"}
                    </button>
                  )
                )}
              </div>

              <p className="mt-3 text-center text-xs font-bold text-slate-500 sm:text-sm">
                {rating} / 5 Stars
              </p>
            </div>

            <div className="mt-7 sm:mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-black text-slate-950 sm:text-lg">
                  Comment
                </p>

                <p className="text-[10px] font-bold text-slate-400 sm:text-xs">
                  {comment.length} / 1000
                </p>
              </div>

              <textarea
                value={comment}
                maxLength={1000}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                className="mt-3 min-h-32 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 sm:min-h-36 sm:rounded-3xl sm:p-5"
                placeholder="Write something about your experience..."
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={
                loading ||
                !transactionId ||
                !merchantId
              }
              className="mt-7 w-full rounded-xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:mt-8 sm:rounded-2xl sm:py-5"
            >
              {loading
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </div>
        </section>
      </main>
    </MemberLayout>
  );
}