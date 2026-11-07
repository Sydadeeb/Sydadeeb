import type { ProductId } from '@/lib/products';

/** Static art direction for devices without WebGL or with reduced motion. */
export function FallbackBackdrop() {
  return (
    <div className="fallback-bg" aria-hidden>
      <svg viewBox="0 0 400 360">
        <defs>
          <linearGradient id="brass" x1="0" x2="1">
            <stop offset="0" stopColor="#6b4a17" />
            <stop offset="0.35" stopColor="#e8c06a" />
            <stop offset="0.55" stopColor="#d6a84b" />
            <stop offset="1" stopColor="#5a3c10" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd88a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="96" rx="150" ry="70" fill="url(#glow)" />
        <path d="M118 108 Q200 92 282 108 L276 122 Q330 160 330 220 Q330 300 200 320 Q70 300 70 220 Q70 160 124 122 Z" fill="url(#brass)" />
        <ellipse cx="200" cy="108" rx="84" ry="14" fill="#ffcf70" opacity="0.9" />
        <path d="M80 200 Q200 230 320 200" stroke="#f4e2b0" strokeOpacity="0.35" strokeWidth="3" fill="none" />
        <path d="M76 236 Q200 270 324 236" stroke="#3a260a" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

const bake: Record<string, [string, string]> = {
  roat: ['#c58a3c', '#7a3e16'],
  biscuits: ['#e2ae5e', '#a8682c'],
  cookies: ['#b8783a', '#683616'],
};

export function ProductArt({ id }: { id: ProductId }) {
  if (id === 'hamper')
    return (
      <svg viewBox="0 0 200 160" aria-hidden>
        <rect x="30" y="66" width="140" height="64" rx="3" fill="#f4ebdd" />
        <rect x="30" y="66" width="140" height="4" fill="#d6a84b" />
        <circle cx="70" cy="62" r="18" fill="#c58a3c" />
        <circle cx="104" cy="60" r="16" fill="#b8783a" />
        <circle cx="134" cy="62" r="15" fill="#e2ae5e" />
        <rect x="26" y="30" width="148" height="14" rx="3" fill="#f4ebdd" transform="rotate(-12 26 44)" />
      </svg>
    );
  const [c, e] = bake[id];
  return (
    <svg viewBox="0 0 200 160" aria-hidden>
      <ellipse cx="100" cy="112" rx="88" ry="26" fill="#c9953a" />
      <ellipse cx="100" cy="108" rx="78" ry="21" fill="#a37628" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx="100" cy={96 - i * 14} rx="52" ry="15" fill={e} />
          <ellipse cx="100" cy={92 - i * 14} rx="50" ry="13" fill={c} />
        </g>
      ))}
    </svg>
  );
}
