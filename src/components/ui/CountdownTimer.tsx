"use client";

import { useEffect, useState } from "react";

function format(msLeft: number) {
  if (!Number.isFinite(msLeft)) return "End time unconfirmed";
  if (msLeft <= 0) return "Offer ended — check vendor website";
  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Ends in ${days}d ${hours}h`;
  return `Ends in ${hours}h ${minutes}m`;
}

export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState('Checking deadline…');

  useEffect(() => {
    const update = () => setLabel(format(new Date(endsAt).getTime() - Date.now()));
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [endsAt]);

  return (
    <span className="font-data text-xs font-medium text-coral">
      {label}
    </span>
  );
}
