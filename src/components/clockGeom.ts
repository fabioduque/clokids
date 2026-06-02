// Angle in degrees clockwise from 12 o'clock for a point (x,y) about center (cx,cy).
export function pointerToDegrees(x: number, y: number, cx: number, cy: number): number {
  const deg = (Math.atan2(x - cx, cy - y) * 180) / Math.PI
  return (deg + 360) % 360
}
