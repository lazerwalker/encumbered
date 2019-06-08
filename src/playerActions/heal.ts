import { State } from "../State";

import { TileType } from "../renderGrid";

export function heal(state: State): [State, boolean] {
  // TODO: This doesn't process enemy movement!
  console.log("Trying to heal", state.items)

  // TODO: Floor items need types!
  const fountain = state.floorItems.find(i => {
    return i.x === state.player.x
      && i.y === state.player.y
      && i.health > 0
  })

  if (fountain && fountain.health > 0) {
    fountain.health -= 1
    state.player.health += 1
    return [state, true]
  }

  const potion = state.items.find(i => i.held && i.type === TileType.Potion)
  if (potion && potion.charges > 0) {
    potion.charges -= 1
    state.player.health += 1

    return [state, true]
  }

  // No valid heal state, do nothing
  return [state, false]
}