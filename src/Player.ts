import { State } from "./State";
import { Action, ActionType } from "./actions";
import _ from "lodash";

export interface Player {
  x: number
  y: number

  key: string
}

export function processPlayerMovement(state: State, action: Action): State {
  const newState = _.cloneDeep(state)

  if (action.type === ActionType.MoveLeft) {
    newState.player.x -= 1
  } else if (action.type === ActionType.MoveRight) {
    newState.player.x += 1
  } else if (action.type === ActionType.MoveUp) {
    newState.player.y += 1
  } else if (action.type === ActionType.MoveDown) {
    newState.player.y -= 1
  }

  return newState
}