'use client';
/* eslint-disable @next/next/no-img-element -- Vendor hosts vary; load directly with browser error fallback. */
import { useState } from 'react';

import { vendorCategories } from '../../../shared/europe.js';

export default function VendorImagery({ images = [], category, name }: { images?: string[]; category: string; name: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const valid = images.filter(url => /^https?:\/\//i.test(url) && !failed.includes(url));
  const fallback = !valid.length;
  const stock = `/images/categories/${Object.hasOwn(vendorCategories, category) ? category : 'retailer'}.jpg`;
  const src = valid[selected % Math.max(valid.length, 1)] || stock;
  return <div className="relative h-52 overflow-hidden bg-paper-dim">
    <img src={src} alt={fallback ? `Illustrative ${category} photo` : `${name} products or services`} loading="lazy" referrerPolicy="no-referrer" onError={() => { if (!failed.includes(src)) setFailed(previous => [...previous, src]); }} className={`h-full w-full object-cover ${fallback ? 'vendor-photo-drift' : ''}`} />
    <span className="absolute bottom-3 left-3 rounded-full bg-abyss/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">{fallback ? 'Illustrative photo' : 'From vendor website'}</span>
    {valid.length > 1 && <button type="button" aria-label={`Next photo for ${name}`} onClick={() => setSelected(value => value + 1)} className="absolute bottom-3 right-3 rounded-full bg-abyss/90 px-3 py-1 text-xs text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{selected % valid.length + 1} / {valid.length} →</button>}
  </div>;
}
