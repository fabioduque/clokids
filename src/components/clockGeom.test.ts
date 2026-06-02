import { describe, it, expect } from 'vitest'
import { pointerToDegrees } from './clockGeom'

describe('pointerToDegrees', () => {
  it('converts an svg coordinate to a 0..360 clock angle from 12 o\'clock', () => {
    expect(pointerToDegrees(100, 0, 100, 100)).toBeCloseTo(0, 5)   // straight up
    expect(pointerToDegrees(200, 100, 100, 100)).toBeCloseTo(90, 5) // right -> 3 o'clock
    expect(pointerToDegrees(100, 200, 100, 100)).toBeCloseTo(180, 5)// down -> 6
  })
})
