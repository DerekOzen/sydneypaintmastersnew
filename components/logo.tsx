export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden>
        <circle cx="15" cy="20" r="11" stroke="#1f7ec4" strokeWidth="4" />
        <path d="M25 12a11 11 0 1 0 0 16" stroke="#14a79a" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>
        Your<span className="text-teal">Brand</span>
      </span>
    </span>
  );
}
