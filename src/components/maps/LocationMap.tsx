"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordinates, safeMapLink, type MapLocation } from "@/lib/map-data";
import "./map.css";

export default function LocationMap({ locations, missing = 0 }: { locations: MapLocation[]; missing?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, { scrollWheelZoom: false }).setView([20, 0], 2);
      map.current = instance;
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
      }).addTo(instance);
      tiles.on("tileerror", () => setError("Map tiles could not load. Check your connection and retry."));
      tiles.on("tileload", () => setError(""));
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(container.current);
      setReady(true);
    }).catch(() => setError("The map could not load. Please retry."));
    return () => { disposed = true; observer?.disconnect(); map.current?.remove(); map.current = null; };
  }, [retry]);

  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    let disposed = false;
    let group: Leaflet.LayerGroup | undefined;
    void import("leaflet").then((L) => {
      if (disposed) return;
      group = L.layerGroup().addTo(instance);
      const points: Leaflet.LatLngTuple[] = [];
      const grouped = new Map<string, MapLocation[]>();
      for (const location of locations) {
        if (!coordinates(location.lat, location.lng)) continue;
        const key = `${location.lat},${location.lng}`;
        grouped.set(key, [...(grouped.get(key) || []), location]);
      }
      for (const entries of grouped.values()) {
        const location = entries[0];
        const point = coordinates(location.lat, location.lng);
        if (!point) continue;
        points.push(point);
        const popup = document.createElement("div");
        const title = document.createElement("strong"); title.textContent = entries.map((entry) => entry.name).join(" · "); popup.append(title);
        const detail = document.createElement("p"); detail.textContent = location.description; popup.append(detail);
        const appendLink = (name: string, target: string) => {
          const url = safeMapLink(target); if (!url) return;
          const link = document.createElement("a"); link.textContent = name; link.href = url;
          link.style.display = "block"; link.style.marginTop = "8px";
          if (url.startsWith("http")) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
          popup.append(link);
        };
        for (const entry of entries) {
          for (const product of entry.products) appendLink(product.name, product.href);
          appendLink(`View ${entry.name}`, entry.href);
        }
        appendLink("Get directions", `https://www.google.com/maps/dir/?api=1&destination=${point[0]},${point[1]}`);
        const marker = L.marker(point, {
          title: entries.map((entry) => entry.name).join(", "),
          icon: L.divIcon({ className: "pet-map-marker", html: `<span class="pet-map-pulse"></span><span class="pet-map-dot">${entries.reduce((count, entry) => count + entry.products.length, 0) || "•"}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }),
        }).bindPopup(popup, { maxHeight: 240 }).addTo(group);
        marker.on("click", () => instance.flyTo(point, Math.max(instance.getZoom(), 12), { animate: !matchMedia("(prefers-reduced-motion: reduce)").matches }));
      }
      if (points.length) instance.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: 13 });
      else instance.setView([20, 0], 2);
    });
    return () => { disposed = true; group?.remove(); };
  }, [locations, ready, retry]);

  return <section className="mt-4 overflow-hidden rounded-3xl border border-paper-dim bg-surface" aria-label="Product and vendor locations">
    <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-navy">
      <p>{locations.length} mapped locations · Select a pulsing marker for products and directions</p>
      <button className="rounded-xl border border-paper-dim px-3 py-2" onClick={() => {
        if (!navigator.geolocation) { setError("Your browser does not support location access."); return; }
        navigator.geolocation.getCurrentPosition(({ coords }) => { map.current?.flyTo([coords.latitude, coords.longitude], 12); }, () => setError("Location unavailable. Allow location access or browse the map manually."), { timeout: 10000 });
      }}>Near me</button>
    </div>
    {error && <p role="alert" className="px-4 pb-3 text-sm text-coral">{error} <button className="underline" onClick={() => { setReady(false); setError(""); setRetry((n) => n + 1); }}>Retry</button></p>}
    <div className="relative">
      <div ref={container} className="isolate h-[30rem] w-full bg-sage-light" aria-label="Interactive street map" />
      {!ready && !error && <p role="status" className="absolute inset-0 grid place-items-center">Loading map…</p>}
    </div>
    {(missing > 0 || locations.length === 0) && <p className="p-4 text-sm text-navy/60">{missing > 0 ? `${missing} listings have no verified coordinates.` : "No locations match these filters."} Online products need a seller or pickup location before they can appear on the map.</p>}
  </section>;
}
