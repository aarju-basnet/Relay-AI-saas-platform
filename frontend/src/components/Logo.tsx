export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className={`${boxSize} rounded-xl bg-gradient-to-br from-copper-bright to-copper flex items-center justify-center shadow-raised shrink-0`}
      >
        <RelayMark className="w-[58%] h-[58%] text-white" />
      </div>
      <span className={`${textSize} font-semibold text-ink tracking-tight`}>Relay</span>
    </div>
  );
}

/**
 * Custom mark: a signal hopping across three nodes, growing stronger and
 * more solid as it lands - literally what the product does (relays a
 * request across models until one answers). Not a stock icon.
 */
export function RelayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M4 17.5C4 17.5 7.2 8.5 12 12C16.8 15.5 20 6.5 20 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="4" cy="17.5" r="1.8" fill="currentColor" opacity="0.45" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" opacity="0.75" />
      <circle cx="20" cy="6.5" r="2.6" fill="currentColor" />
    </svg>
  );
}
