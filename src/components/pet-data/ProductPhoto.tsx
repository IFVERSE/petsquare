'use client';
/* eslint-disable @next/next/no-img-element -- Vendor images load directly, with a bundled fallback. */
import { useState } from 'react';
export default function ProductPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState('');
  const fallback = !src || src === failed;
  return <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
    <img src={fallback ? '/images/categories/retailer.jpg' : src} alt={fallback ? 'Illustrative pet food photo; product image unavailable' : name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${fallback ? 'object-cover' : 'object-contain p-5'}`} />
    {fallback && <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] text-navy/60">Illustrative photo</span>}
  </div>;
}
