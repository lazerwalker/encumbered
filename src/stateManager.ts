import { State } from "./App";
import { playerItemCoordinates, GamePosition } from "./GridCalculator";
import _ from "lodash";
import { stat } from "fs";

export type GameReducer = (state: State) => State

export function moveLeft(state: State): State {
  const newPlayer = { ...state.player, x: state.player.x - 1 }
  const newState = { ...state, player: newPlayer }
  return stateIsValid(newState) ? newState : state
}
export function moveRight(state: State): State {
  const newPlayer = { ...state.player, x: state.player.x + 1 }
  const newState = { ...state, player: newPlayer }
  return stateIsValid(newState) ? newState : state
}

export function moveUp(state: State): State {
  const newPlayer = { ...state.player, y: state.player.y + 1 }
  const newState = { ...state, player: newPlayer }
  return stateIsValid(newState) ? newState : state
}

export function moveDown(state: State): State {
  const newPlayer = { ...state.player, y: state.player.y - 1 }
  const newState = { ...state, player: newPlayer }
  return stateIsValid(newState) ? newState : state
}

export function release(state: State): State {
  return state
}

function stateIsValid(state: State): boolean {
  let playerCoordinates: GamePosition[] = [...playerItemCoordinates(state), { x: state.player.x, y: state.player.y }]

  // If any player bit intersects with a wall, collide
  if (_.intersectionWith(playerCoordinates, state.walls, _.isEqual).length > 0) {
    return false
  }

  // If any player bit is over an edge, collide
  if (_.find(playerCoordinates, c => {
    return c.x < 0 ||
      c.x >= state.size ||
      c.y < 0 ||
      c.y >= state.size
  })) {
    return false
  }

  return true
}