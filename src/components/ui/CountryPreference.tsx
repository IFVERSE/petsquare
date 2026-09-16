'use client';
import { useRouter } from 'next/navigation';
import { useCountry } from '@/lib/hooks/use-country';
import { europe } from '../../../shared/europe.js';

export default function CountryPreference() {
  const { country, setCountry } = useCountry();
  const router = useRouter();
  return <div className="rounded-2xl border border-sage/20 bg-sage/5 p-4 text-navy">
    <label className="flex flex-wrap items-center justify-between gap-3">
      <span><span className="block font-medium">{country ? 'Your location' : 'Where do you and your pet call home?'}</span><span className="text-sm text-navy/60">Choose a country to personalize vendors and trending deals.</span></span>
      <select aria-label="Preferred country" value={country || ''} onChange={event => { setCountry(event.target.value); router.refresh(); }} className="rounded-xl border border-paper-dim bg-surface px-4 py-3 text-sm">
        <option value="" disabled>Choose your country</option>
        <option value="all">All European countries</option>
        {Object.entries(europe).map(([code, [name]]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  </div>;
}
