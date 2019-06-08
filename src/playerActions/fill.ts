import { TileType } from "../renderGrid";
import { State } from "../State";

// Only causes enemy movement if player fills
export function fill(state: State): [State, boolean] {
  const potions = state.items.filter(i => i.held && i.type === TileType.Potion && i.charges < 2)
  for (let p = 0; p < potions.length; p++) {
    const potion = potions[p]
    const fountain = state.floorItems.find(i => {
      return i.x === potion.x
        && i.y === potion.y
        && i.health > 0
    })
    if (fountain) {
      potion.charges += 1
      fountain.health -= 1
      return [state, true]
    }
  }
  return [state, false]
}