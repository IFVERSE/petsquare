export default function LeashDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`relative h-10 w-full overflow-hidden ${flip ? "rotate-180" : ""}`} aria-hidden>
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="leash-divider h-full w-full"
      >
        <path
          d="M0,20 C240,60 480,-10 720,25 C960,60 1200,-5 1440,25"
          fill="none"
          stroke="var(--color-tangerine)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 14"
        />
      </svg>
    </div>
  );
}
