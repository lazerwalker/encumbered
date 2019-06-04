import { State } from "./State";
import { Action, ActionType } from "./actions";
import _ from "lodash";

export interface Player {
  x: number
  y: number

  key: string
}