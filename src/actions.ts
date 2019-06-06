import { State } from "./State";

// TODO: This doesn't give me the type-safety I want, 
// but for a jam I'm too lazy to set up proper typed actons
interface BaseAction {
  type: ActionType
  payload?: undefined
}

export type Action = BaseAction | ResetAction

export enum ActionType {
  MoveLeft = "left",
  MoveRight = "right",
  MoveUp = "up",
  MoveDown = "down",
  Wait = "wait",
  Release = "release",

  Reset = "reset",

  Heal = "heal",
  Rotate = "rotate"
}

export interface ResetAction {
  type: ActionType.Reset,
  payload: State
}