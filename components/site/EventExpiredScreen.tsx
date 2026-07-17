import { CalendarOff } from "lucide-react";

interface EventExpiredScreenProps {
  title: string;
  desc: string;
  footerText?: string;
  brandName?: string;
}

export default function EventExpiredScreen({ title, desc, footerText, brandName }: EventExpiredScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-cream flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-6">
        <CalendarOff size={28} />
      </div>
      <h1 className="font-serif text-3xl text-ink mb-3">{title}</h1>
      <p className="text-gray-500 text-sm max-w-md leading-relaxed">{desc}</p>
      {footerText && brandName && (
        <p className="mt-10 text-[10px] uppercase tracking-widest text-gray-300">{footerText} {brandName}</p>
      )}
    </div>
  );
}
