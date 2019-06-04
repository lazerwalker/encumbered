import { State } from "./State";

interface BaseAction {
  type: ActionType
  payload?: any
}

export type Action = BaseAction | ResetAction

export enum ActionType {
  MoveLeft = "left",
  MoveRight = "right",
  MoveUp = "up",
  MoveDown = "down",
  Wait = "wait",
  Release = "release",

  Reset = "reset"
}

export interface ResetAction {
  type: ActionType.Reset,
  payload: State
}