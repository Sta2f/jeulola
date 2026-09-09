import { useId, type ReactNode } from 'react';

/** The cloud keeps its own proportions, even in a short landscape viewport. */
export function FairyGameButton({
  icon,
  children,
  tone,
  onClick,
  className = '',
}: {
  icon: ReactNode;
  children: string;
  tone: 'honey' | 'lilac' | 'rose' | 'sky' | 'mint';
  onClick: () => void;
  className?: string;
}) {
  const pearl = useId();
  return (
    <button
      type="button"
      className={`fairy-game fairy-game--${tone} ${className}`.trim()}
      onClick={onClick}
      aria-label={children}
    >
      <span className="fairy-game-float">
        <svg
          className="fairy-cloud"
          viewBox="0 0 240 140"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={pearl} x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0" stopColor="#fffef9" />
              <stop offset="0.55" stopColor="#fffdf9" />
              <stop offset="1" stopColor="var(--cloud-tint)" />
            </linearGradient>
          </defs>
          <path
            d="M52 124C27 124 9 110 9 91C9 74 20 62 36 57C30 39 42 22 62 22C74 4 101 5 116 22C137 5 164 12 175 33C196 28 215 42 216 61C231 65 237 77 235 93C233 114 214 124 191 124Z"
            fill={`url(#${pearl})`}
            stroke="#e8cb91"
            strokeWidth="1.5"
          />
          <path
            d="M24 94C25 110 39 117 55 117H189C207 117 221 111 225 100"
            fill="none"
            stroke="var(--cloud-rim)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.45"
          />
          <g
            className="fairy-cloud-stars"
            fill="#d8a245"
            stroke="#fff5d3"
            strokeWidth="1"
          >
            <path d="M191 17L194 25L203 28L194 31L191 40L188 31L179 28L188 25Z" />
            <path d="M31 109L33 114L39 116L33 118L31 124L29 118L24 116L29 114Z" />
          </g>
        </svg>
        <span className="fairy-game-content">
          <span className="fairy-game-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="fairy-game-label">{children}</span>
        </span>
      </span>
    </button>
  );
}
