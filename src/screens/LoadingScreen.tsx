import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../db/store';

interface Chapter {
  id: number;
  text: string;
  type: 'DATE' | 'BODY' | 'SUBTITLE' | 'QUOTE' | 'REVEAL';
  time: number;
}

const chapters: Chapter[] = [
  { id: 1, text: "August 14, 1947. Midnight.", type: 'DATE', time: 400 },
  { id: 2, text: "As India prepared to claim her freedom, a question stirred among her accountants —", type: 'BODY', time: 2200 },
  { id: 3, text: "Who would guard the numbers of a free nation?", type: 'QUOTE', time: 4500 },
  { id: 4, text: "July 1, 1949.", type: 'DATE', time: 7000 },
  { id: 5, text: "The Chartered Accountants Act was passed. The Institute of Chartered Accountants of India was born.", type: 'BODY', time: 8700 },
  { id: 6, text: "A profession codified. A mandate written in law.", type: 'SUBTITLE', time: 10600 },
  { id: 7, text: "Seventy-seven years later —", type: 'DATE', time: 12600 },
  { id: 8, text: "3.5 lakh chartered accountants. Crores of audit files. All documented by hand.", type: 'BODY', time: 14200 },
  { id: 9, text: "Working papers in manila folders. Evidence on Excel sheets. Observations in email threads.", type: 'SUBTITLE', time: 16000 },
  { id: 10, text: "One question haunted every engagement —", type: 'BODY', time: 18400 },
  { id: 11, text: '"Did I miss something?"', type: 'QUOTE', time: 20000 },
  { id: 12, text: "Today, that changes.", type: 'REVEAL', time: 22200 },
];

export const LoadingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [activeChapters, setActiveChapters] = useState<number[]>([]);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeAll, setFadeAll] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    chapters.forEach((chapter) => {
      const timer = setTimeout(() => {
        setActiveChapters((prev) => [...prev, chapter.id]);
      }, chapter.time);
      timers.push(timer);
    });

    // Logo reveal
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 25400);
    timers.push(logoTimer);

    // Fade out
    const fadeTimer = setTimeout(() => {
      setFadeAll(true);
    }, 29000);
    timers.push(fadeTimer);

    // Complete and redirect
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 30000);
    timers.push(completeTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const onComplete = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const getChapterStyle = (type: Chapter['type'], index: number) => {
    const base: React.CSSProperties = {
      '--enter-delay': `${index * 0.06}s`,
    } as React.CSSProperties;

    switch (type) {
      case 'DATE':
        return { className: 'text-[11px] font-news font-bold tracking-[0.18em] uppercase text-accent-red mt-8 mb-2', style: base };
      case 'BODY':
        return { className: 'text-[15px] font-news text-white/60 max-w-[520px] leading-relaxed my-2 tracking-[0.01em]', style: base };
      case 'SUBTITLE':
        return { className: 'text-[13px] font-news text-white/30 max-w-[520px] leading-relaxed my-1 tracking-[0.01em]', style: base };
      case 'QUOTE':
        return { className: 'text-[clamp(28px,4vw,40px)] bebas-display text-white leading-none my-5 border-l-2 border-accent-red pl-5 py-1 tracking-[0.02em]', style: base };
      case 'REVEAL':
        return { className: 'text-[18px] font-news font-bold text-white tracking-[0.06em] mt-10 mb-4 uppercase', style: base };
      default:
        return { className: '', style: base };
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center transition-opacity duration-1000 ${
        fadeAll ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Skip Button — PIL ghost button style */}
      {!showLogo && (
        <button
          onClick={onComplete}
          className="absolute top-8 right-8 text-[11px] font-news font-bold text-white/25 hover:text-white/60 transition-colors duration-200 uppercase tracking-[0.14em] border border-white/8 px-4 py-2 rounded-[2px] hover:border-white/20 cursor-pointer"
        >
          Skip Story
        </button>
      )}

      {/* Chapters */}
      <div className="flex flex-col items-center text-center px-6 max-h-[70vh] overflow-y-auto space-y-0">
        {chapters.map((ch) => {
          const isVisible = activeChapters.includes(ch.id);
          if (!isVisible) return null;

          const visibleIndex = activeChapters.indexOf(ch.id);
          const totalVisible = activeChapters.length;
          const isOld = totalVisible - visibleIndex > 4;
          const { className, style } = getChapterStyle(ch.type, visibleIndex);

          return (
            <div
              key={ch.id}
              className="ui-enter-stagger"
              style={{
                ...style,
                opacity: isOld ? 0.12 : undefined,
                transition: isOld ? 'opacity 1.2s ease-out' : undefined,
              }}
            >
              <p className={className}>{ch.text}</p>
            </div>
          );
        })}
      </div>

      {/* Logo Entrance — PIL hero-title-enter animation */}
      {showLogo && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
          <div className="text-center hero-title-enter">
            <h1 className="text-[clamp(60px,11vw,120px)] bebas-display leading-none text-white flex items-baseline justify-center tracking-[0.04em]">
              WPO
              <span className="text-accent-red">.INC</span>
            </h1>
            <p className="font-news text-[12px] font-bold tracking-[0.22em] text-white/25 uppercase mt-5 ui-enter-stagger" style={{ '--enter-delay': '0.3s' } as React.CSSProperties}>
              Audit Documentation Operating System
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
