import { useMemo } from 'react'
import { skyAt } from '../lib/sky'

export interface SkyBackgroundProps {
  /** Minutes from midnight that the sky should portray. */
  total: number
}

// A small, fixed constellation. Hand-placed (not random) so the field is stable
// across renders and the layout never "twinkles" position. Sizes vary for depth.
const STARS = [
  [6, 12, 2], [14, 22, 1.5], [22, 8, 2.5], [31, 18, 1.5], [38, 30, 2],
  [47, 10, 1.5], [55, 24, 2.5], [63, 14, 1.5], [71, 28, 2], [79, 9, 2.5],
  [87, 20, 1.5], [93, 33, 2], [10, 38, 1.5], [27, 42, 2], [44, 38, 1.5],
  [60, 44, 2], [76, 40, 1.5], [90, 46, 2], [3, 26, 1.5], [50, 34, 2],
  [18, 6, 1.5], [35, 5, 2], [68, 6, 1.5], [83, 4, 2], [97, 14, 1.5],
] as const

export function SkyBackground({ total }: SkyBackgroundProps) {
  const sky = useMemo(() => skyAt(total), [total])
  const { stops, sun, moon, starOpacity } = sky

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
      style={{
        background: `linear-gradient(to bottom, ${stops[0]} 0%, ${stops[1]} 52%, ${stops[2]} 100%)`,
      }}
    >
      {/* Stars — fade in through dusk into night. No CSS transition: skyAt()
          already produces continuous values every frame (drag, live ticking),
          so the data itself is the animation. A transition here would restart
          its easing on every retarget and make the layer lag the gradient. */}
      <div className="absolute inset-0" style={{ opacity: starOpacity }}>
        {STARS.map(([x, y, r], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: r,
              height: r,
              // Gentle twinkle, staggered so they don't pulse in unison.
              animation: `twinkle ${2.4 + (i % 5) * 0.6}s ease-in-out ${(i % 7) * 0.4}s infinite`,
              boxShadow: '0 0 6px 1px rgba(255,255,255,0.7)',
            }}
          />
        ))}
      </div>

      {/* The moon — a soft pale disc with a faint halo. */}
      {moon && (
        <Orb
          x={moon.x}
          y={moon.y}
          size={56 + moon.altitude * 18}
          core="radial-gradient(circle at 38% 32%, #FFFDF6 0%, #F3EFDD 58%, #DCD6BE 100%)"
          glow="rgba(238,236,214,0.55)"
        />
      )}

      {/* The sun — a warm glowing disc; bigger + brighter at its peak. */}
      {sun && (
        <Orb
          x={sun.x}
          y={sun.y}
          size={64 + sun.altitude * 34}
          core="radial-gradient(circle at 40% 36%, #FFF7D6 0%, #FFD15A 46%, #FCA928 100%)"
          glow={`rgba(255,196,80,${0.35 + sun.altitude * 0.4})`}
        />
      )}

      {/* A soft haze along the horizon ties the world to the content above it. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: `linear-gradient(to top, ${stops[2]}, transparent)` }}
      />
    </div>
  )
}

function Orb({
  x,
  y,
  size,
  core,
  glow,
}: {
  x: number
  y: number
  size: number
  core: string
  glow: string
}) {
  return (
    // No CSS transition: the position comes from skyAt() which is continuous —
    // during a hand drag it updates every frame, and a transition would keep
    // restarting its easing (sun frozen while dragging, then jumping at the
    // end) while the gradient (background-image, not animatable) tracked live.
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: core,
        boxShadow: `0 0 ${size * 0.9}px ${size * 0.5}px ${glow}`,
      }}
    />
  )
}
