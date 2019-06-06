import { State } from "./State";
import _ from "lodash";
import { GamePosition } from "./renderGrid";
import { PlayerFactory } from "./Player";

// Move each held item 90 degrees clockwise
export function rotate(state: State): State {
  const newState = _.cloneDeep(state)

  const vectorMap: { [initialPosition: string]: GamePosition } = {
    "-1, 0": { x: 0, y: 1 },
    "0, 1": { x: 1, y: 0 },
    "1, 0": { x: 0, y: -1 },
    "0, -1": { x: -1, y: 0 }
  }

  newState.items
    .filter(i => i.held)
    .forEach(i => {
      const vector = {
        x: state.player.x - i.x,
        y: state.player.y - i.y
      }
      const newVector = vectorMap[`${vector.x}, ${vector.y}`]
      i.x = state.player.x - newVector.x
      i.y = state.player.y - newVector.y
    })

  return newState
}