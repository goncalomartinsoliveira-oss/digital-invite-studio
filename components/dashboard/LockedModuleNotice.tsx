"use client";
import { useState } from "react";
import { Lock, Loader2, Tag } from "lucide-react";

interface LockedModuleNoticeProps {
  title: string;
  message: string;
  contactUrl?: string;
  contactLabel?: string;
  priceLabel?: string;
  buyLabel?: string;
  onBuy?: (couponCode?: string) => void;
  buying?: boolean;
  couponToggleLabel?: string;
  couponPlaceholder?: string;
}

export default function LockedModuleNotice({ title, message, contactUrl, contactLabel, priceLabel, buyLabel, onBuy, buying, couponToggleLabel, couponPlaceholder }: LockedModuleNoticeProps) {
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-brand/5 flex items-center justify-center text-brand mb-6">
        <Lock size={26} />
      </div>
      <h3 className="font-serif text-2xl text-ink mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm">{message}</p>

      <div className="mt-8 flex flex-col items-center gap-3">
        {onBuy && (
          <>
            <button
              onClick={() => onBuy(couponCode.trim() || undefined)}
              disabled={buying}
              className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60"
            >
              {buying ? <Loader2 size={15} className="animate-spin" /> : null}
              {buyLabel} {priceLabel && `— ${priceLabel}`}
            </button>
            {couponToggleLabel && (
              showCoupon ? (
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={couponPlaceholder}
                  className="text-[11px] text-center border border-gray-200 rounded-full px-4 py-2 tracking-widest uppercase outline-none focus:border-brand w-48"
                />
              ) : (
                <button
                  onClick={() => setShowCoupon(true)}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-brand transition-all"
                >
                  <Tag size={11} /> {couponToggleLabel}
                </button>
              )
            )}
          </>
        )}
        {contactUrl && contactLabel && (
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-all"
          >
            {contactLabel}
          </a>
        )}
      </div>
    </div>
  );
}
