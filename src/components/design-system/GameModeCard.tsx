'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Heart, Layers } from 'lucide-react';
import { sounds } from '@/lib/sound/webAudio';

export interface GameModeCardProps {
  href: string;
  title: string;
  badge: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaText: string;
  variant: 'party' | 'couple' | 'doraemon';
}

export const GameModeCard: React.FC<GameModeCardProps> = ({
  href,
  title,
  badge,
  description,
  imageSrc,
  imageAlt,
  ctaText,
  variant,
}) => {
  const styles = {
    party: {
      border: 'border-amber-500/30 hover:border-amber-400/80',
      shadow: 'hover:shadow-gold-glow',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      button: 'bg-amber-400 text-stone-950 hover:bg-amber-300',
      icon: <Users className="w-4 h-4 text-amber-400" />,
    },
    couple: {
      border: 'border-rose-500/30 hover:border-rose-400/80',
      shadow: 'hover:shadow-rose-glow',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      button: 'bg-rose-500 text-white hover:bg-rose-400',
      icon: <Heart className="w-4 h-4 text-rose-400 fill-current" />,
    },
    doraemon: {
      border: 'border-sky-500/30 hover:border-sky-400/80',
      shadow: 'hover:shadow-blue-glow',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      button: 'bg-sky-400 text-stone-950 hover:bg-sky-300',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
    },
  }[variant];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        onClick={() => sounds.playClick()}
        className={`group block rounded-3xl bg-zinc-900/90 border-2 ${styles.border} ${styles.shadow} p-4 sm:p-5 transition-all duration-300 shadow-tactile-rest relative overflow-hidden flex flex-col justify-between h-full`}
      >
        {/* Top Image Composition */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-zinc-950 border border-white/10 shadow-inner">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            priority={variant === 'party'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

          {/* Badge pill */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-md">
            <span className={styles.badge}>{badge}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
              {title}
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 mt-1 leading-snug line-clamp-2">
              {description}
            </p>
          </div>

          {/* Large CTA Button */}
          <div className="pt-3">
            <div
              className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-md transition-all ${styles.button}`}
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
