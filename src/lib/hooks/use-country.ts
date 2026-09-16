'use client';
import { useSyncExternalStore } from 'react';
import { europe } from '../../../shared/europe.js';

function subscribe(callback: () => void) {
  window.addEventListener('petsquare-country', callback);
  return () => window.removeEventListener('petsquare-country', callback);
}
function snapshot() {
  const value = document.cookie.split('; ').find(c => c.startsWith('petsquare-country='))?.split('=')[1] ?? '';
  return value === 'all' || Object.hasOwn(europe, value) ? value : '';
}
export function useCountry() {
  const country = useSyncExternalStore(subscribe, snapshot, () => '');
  function setCountry(value: string) {
    if (value !== 'all' && !Object.hasOwn(europe, value)) return;
    document.cookie = `petsquare-country=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event('petsquare-country'));
  }
  return { country, setCountry };
}
