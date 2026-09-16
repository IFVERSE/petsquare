import Image from "next/image";

/**
 * The official PetSquare logo mark (converted from the source artwork to an
 * embedded-raster SVG for standard, resolution-independent placement). Kept
 * at its original brand colors intentionally — like most product marks, it
 * doesn't recolor across theme modes, it just sits on whatever surface color
 * the active theme provides.
 */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/petsquare-icon.svg"
      alt="PetSquare"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      priority
    />
  );
}
