export default function Logo({ size=22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="6" cy="7" r="2.2" fill="var(--pc-primary)"/>
        <circle cx="10.5" cy="5.5" r="2" fill="var(--pc-primary)"/>
        <circle cx="14.5" cy="6.2" r="1.9" fill="var(--pc-primary)"/>
        <circle cx="18" cy="8" r="1.8" fill="var(--pc-primary)"/>
        <path d="M6 12c2.5-2.1 6.8-2.1 9.3 0 1.9 1.6 1.6 4.6-1.2 5.7-2.9 1.2-7.9.9-9.2-1.4-1-1.7.1-3.5 1.1-4.3z"
          fill="var(--pc-primary)"/>
      </svg>
      <span className="text-lg font-extrabold tracking-tight" style={{color:'var(--pc-deep)'}}>PetConnect</span>
    </div>
  );
}
