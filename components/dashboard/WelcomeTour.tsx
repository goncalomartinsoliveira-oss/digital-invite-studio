"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, LayoutGrid, Unlock, Share2, X, ArrowRight } from "lucide-react";

export interface WelcomeTourDict {
  skip: string;
  next: string;
  start: string;
  steps: { title: string; desc: string }[];
}

interface WelcomeTourProps {
  dict: WelcomeTourDict;
  onClose: () => void;
}

const ICONS = [Sparkles, LayoutGrid, Unlock, Share2];

export default function WelcomeTour({ dict, onClose }: WelcomeTourProps) {
  const [step, setStep] = useState(0);
  const isLast = step === dict.steps.length - 1;
  const Icon = ICONS[step] ?? Sparkles;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition-colors"
            aria-label={dict.skip}
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-brand/5 border border-gold-soft/60 flex items-center justify-center text-brand mx-auto mb-8">
                <Icon size={28} />
              </div>
              <h3 className="font-serif text-2xl text-ink mb-3">{dict.steps[step].title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">{dict.steps[step].desc}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 mt-10 mb-8">
            {dict.steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              {dict.skip}
            </button>
            <button
              onClick={() => (isLast ? onClose() : setStep(s => s + 1))}
              className="inline-flex items-center gap-2 bg-brand text-white px-7 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95"
            >
              {isLast ? dict.start : dict.next} <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
