'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { normalizeProduct, type Product } from '@/lib/products/model';

const key = 'petsquare-product-shortlist-v1';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback); window.addEventListener('product-shortlist', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('product-shortlist', callback); };
}
function snapshot() { try { return localStorage.getItem(key) || '[]'; } catch { return '[]'; } }
export default function useProductShortlist() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const [storageError, setError] = useState('');
  const saved = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, 100).flatMap(row => {
        if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !['vendor', 'zooplus'].includes(row.source)) return [];
        const item = normalizeProduct(row.id, { ...row, original_price: row.originalPrice }, row.checkedAt, row.source, 0);
        return item ? [{ ...item, id: row.id }] : [];
      });
    } catch { return []; }
  }, [raw]);
  function toggle(product: Product) {
    const exists = saved.some(item => item.id === product.id);
    if (!exists && saved.length >= 100) { setError('Your shortlist is full. Remove an item before saving another.'); return; }
    try {
      localStorage.setItem(key, JSON.stringify(exists ? saved.filter(item => item.id !== product.id) : [...saved, product]));
      window.dispatchEvent(new Event('product-shortlist')); setError('');
    } catch { setError('This browser could not save your shortlist. Please allow local storage and try again.'); }
  }
  return { saved, toggle, storageError };
}
