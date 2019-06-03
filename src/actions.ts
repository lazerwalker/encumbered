export interface Action {
  type: ActionType
  payload?: any
}

export enum ActionType {
  MoveLeft = "left",
  MoveRight = "right",
  MoveUp = "up",
  MoveDown = "down",
  Wait = "wait"
}