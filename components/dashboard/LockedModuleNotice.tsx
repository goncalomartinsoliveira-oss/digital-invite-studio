import { Lock } from "lucide-react";

interface LockedModuleNoticeProps {
  title: string;
  message: string;
  contactUrl?: string;
  contactLabel?: string;
}

export default function LockedModuleNotice({ title, message, contactUrl, contactLabel }: LockedModuleNoticeProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-brand/5 flex items-center justify-center text-brand mb-6">
        <Lock size={26} />
      </div>
      <h3 className="font-serif text-2xl text-ink mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm">{message}</p>
      {contactUrl && contactLabel && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all"
        >
          {contactLabel}
        </a>
      )}
    </div>
  );
}
