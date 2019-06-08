import { GamePosition } from "./renderGrid";
import { GameAnimation } from "./GameAnimation";

// Returns an animation representing a direction of attack
// Diagonals aren't supported. Prioritizes x-axis over y.
export function attackAnimation(from: GamePosition, to: GamePosition): GameAnimation | undefined {
  if (from.x > to.x) {
    return GameAnimation.AttackLeft
  } else if (from.x < to.x) {
    return GameAnimation.AttackRight
  } else if (from.y > to.y) {
    return GameAnimation.AttackDown
  } else if (from.y < to.y) {
    return GameAnimation.AttackUp
  }

  return undefined
}