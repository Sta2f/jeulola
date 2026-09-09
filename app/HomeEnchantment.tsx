/** A small vector fairy: no video, canvas loop, or animated image downloads. */
export function HomeEnchantment() {
  return (
    <div className="enchantment-field" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={index}
          className="fairy-dust-flight"
          style={{ animationDelay: `${-4 + (index + 1) * 0.24}s` }}
        >
          <i
            style={{
              width: `${7 - index * 0.55}px`,
              height: `${7 - index * 0.55}px`,
              animationDelay: `${index * -0.3}s`,
            }}
          />
        </span>
      ))}
      <div className="fairy-flight">
        <div className="flying-fairy">
          <svg className="fairy-paint-defs" width="0" height="0">
            <defs>
              <linearGradient
                id="fairy-wing-pearl"
                x1="18"
                y1="24"
                x2="65"
                y2="88"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ffffff" />
                <stop offset=".5" stopColor="#e7f9ff" />
                <stop offset="1" stopColor="#dbbfff" />
              </linearGradient>
              <linearGradient
                id="fairy-petal-dress"
                x1="41"
                y1="62"
                x2="63"
                y2="102"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ffbbdf" />
                <stop offset=".5" stopColor="#e986c0" />
                <stop offset="1" stopColor="#a577d8" />
              </linearGradient>
              <linearGradient
                id="fairy-chestnut-hair"
                x1="31"
                y1="29"
                x2="64"
                y2="55"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#a96c3c" />
                <stop offset="1" stopColor="#67382f" />
              </linearGradient>
            </defs>
          </svg>
          <span className="fairy-wing fairy-wing-left">
            <svg viewBox="0 0 100 128" fill="none">
              <g
                fill="url(#fairy-wing-pearl)"
                stroke="#fffaf0"
                strokeWidth="1.3"
              >
                <path d="M45 69C24 65 5 44 12 27C16 17 39 29 46 56Z" />
                <path d="M44 64C28 57 13 68 18 81C23 91 38 83 45 72Z" />
                <path
                  d="M17 31Q35 45 44 65M21 77L43 66"
                  stroke="#c1a9eb"
                  opacity=".6"
                />
              </g>
            </svg>
          </span>
          <span className="fairy-wing fairy-wing-right">
            <svg viewBox="0 0 100 128" fill="none">
              <g
                fill="url(#fairy-wing-pearl)"
                stroke="#fffaf0"
                strokeWidth="1.3"
              >
                <path d="M53 67C73 60 86 36 75 25C65 17 52 40 51 58Z" />
                <path d="M54 64C71 58 81 70 74 81C68 90 55 80 51 73Z" />
                <path
                  d="M72 30Q59 49 53 66M71 77L54 67"
                  stroke="#c1a9eb"
                  opacity=".6"
                />
              </g>
            </svg>
          </span>
          <span className="fairy-body">
            <svg viewBox="0 0 100 128" fill="none">
              <g strokeLinecap="round">
                <path
                  d="M44 94L40 108L33 113M54 94L58 108L64 108"
                  stroke="#f2bfa3"
                  strokeWidth="5"
                />
                <path
                  d="M32 114L37 111M63 109L67 109"
                  stroke="#a075d1"
                  strokeWidth="5"
                />
              </g>
              <path
                d="M42 65Q34 76 27 71M55 65L66 69L76 58"
                stroke="#f5c6a9"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M43 59L55 59L57 78L68 96Q58 102 50 97Q40 105 28 96L40 77Z"
                fill="url(#fairy-petal-dress)"
                stroke="#fff0db"
                strokeWidth="1.2"
              />
              <path
                d="M48 77L41 98M52 77L60 97"
                stroke="#ffe1f1"
                strokeWidth="1.5"
                opacity=".8"
              />
              <path d="M41 76Q49 80 57 76" stroke="#f8dd88" strokeWidth="3" />
              <circle cx="49" cy="78" r="2.5" fill="#fff8d5" />
              <path d="M47 54V62" stroke="#f5c6a9" strokeWidth="6" />
              <circle cx="43" cy="23" r="10" fill="url(#fairy-chestnut-hair)" />
              <path
                d="M30 47Q25 24 45 26Q67 24 66 48L61 59L33 57Z"
                fill="url(#fairy-chestnut-hair)"
              />
              <ellipse cx="48" cy="44" rx="15" ry="17" fill="#fbd2b4" />
              <path
                d="M32 41Q32 26 47 28Q61 27 64 43Q52 39 49 32Q45 42 32 41Z"
                fill="url(#fairy-chestnut-hair)"
              />
              <ellipse cx="43" cy="46" rx="2" ry="2.7" fill="#50302f" />
              <ellipse cx="55" cy="46" rx="2" ry="2.7" fill="#50302f" />
              <circle cx="43.5" cy="45" r=".7" fill="white" />
              <circle cx="55.5" cy="45" r=".7" fill="white" />
              <ellipse
                cx="38"
                cy="50"
                rx="3"
                ry="1.5"
                fill="#ee9f9e"
                opacity=".7"
              />
              <ellipse
                cx="59"
                cy="50"
                rx="3"
                ry="1.5"
                fill="#ee9f9e"
                opacity=".7"
              />
              <path
                d="M45 53Q49 56 53 52"
                stroke="#ac5d65"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path d="M35 29Q46 24 58 31" stroke="#f9d575" strokeWidth="2.5" />
              <path
                d="M46 20L48 25L53 27L48 29L46 34L44 29L39 27L44 25Z"
                fill="#fff0a9"
              />
              <g className="fairy-wand">
                <path
                  d="M75 60L85 39"
                  stroke="#f2cb72"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M87 28L89 34L96 35L91 40L92 46L86 43L80 46L81 39L76 35L83 34Z"
                  fill="#fff4af"
                  stroke="#fffdf1"
                  strokeWidth="1.2"
                />
                <circle
                  className="fairy-wand-glow"
                  cx="86"
                  cy="37"
                  r="12"
                  fill="#fff6b7"
                  opacity=".2"
                />
              </g>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
