export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "w-12 h-12" : "w-16 h-16";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="inline-flex items-center gap-2.5">
      <RelayMark className={`${dimension} shrink-0`} />
      <span className={`${textSize} font-semibold text-ink tracking-tight`}>Relay</span>
    </div>
  );
}

/**
 * Standalone mark - a single filled torch/flame shape, no container,
 * no wordmark needed to read it. A torch passed hand to hand is
 * literally what a relay is. Uses currentColor + text-copper so it
 * always matches Relay's signature color (forest green) defined once
 * in index.css, rather than a separately hardcoded hex that could
 * drift out of sync if the brand color changes again later.
 */
export function RelayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-copper ${className ?? ""}`}>
      <path
        d="M45 8 C62 28 68 45 62 60 C58 72 47 80 45 88 C43 80 32 72 28 60 C22 45 28 28 45 8 Z"
        fill="currentColor"
      />
      <path
        d="M42 20 C50 32 53 42 50 52 C48 60 43 66 42 72 C41 66 36 60 34 52 C31 42 34 32 42 20 Z"
        fill="white"
        opacity="0.35"
      />
    </svg>
  );
}