import { State } from "./App";
import { playerItemCoordinates, GamePosition, itemCoordinates, coordinatesForItem, pickUpItem, dropItem } from "./GridCalculator";
import _ from "lodash";
import { stat } from "fs";
import { Item } from "./Player";

export type GameReducer = (state: State) => State

export function moveLeft(state: State): State {
  const newPlayer = { ...state.player, x: state.player.x - 1 }
  const newState = tryToPickUpItems({ ...state, player: newPlayer }, state)
  return stateIsValid(newState) ? newState : state
}
export function moveRight(state: State): State {
  const newPlayer = { ...state.player, x: state.player.x + 1 }
  const newState = tryToPickUpItems({ ...state, player: newPlayer }, state)
  return stateIsValid(newState) ? newState : state
}

export function moveUp(state: State): State {
  const newPlayer = { ...state.player, y: state.player.y + 1 }
  const newState = tryToPickUpItems({ ...state, player: newPlayer }, state)
  return stateIsValid(newState) ? newState : state
}

export function moveDown(state: State): State {
  const newPlayer = { ...state.player, y: state.player.y - 1 }
  const newState = tryToPickUpItems({ ...state, player: newPlayer }, state)
  return stateIsValid(newState) ? newState : state
}

export function release(state: State): State {
  let newItems: Item[] = [...state.items]
  let playerItems = state.player.items

  state.player.items.forEach(i => {
    let newItem = dropItem(state.player, i)
    newItems.push(newItem)
    playerItems = _.without(playerItems, i)
  })

  if (newItems.length > 0) {
    return {
      ...state,
      player: { ...state.player, items: playerItems },
      items: newItems
    }
  } else {
    return state
  }
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

function tryToPickUpItems(state: State, oldState: State): State {
  let playerCoordinates: GamePosition[] = [...playerItemCoordinates(state), { x: state.player.x, y: state.player.y }]

  let player = state.player
  let pickedUpItems: Item[] = []
  let items = state.items

  state.items.forEach(i => {
    let itemCoords = coordinatesForItem(i)
    if (_.intersectionWith(playerCoordinates, itemCoords, _.isEqual).length === 0) {
      return
    }

    items = _.without(items, i)
    pickedUpItems.push(pickUpItem(oldState.player, i))
  })

  if (pickedUpItems.length > 0) {
    player.x = oldState.player.x
    player.y = oldState.player.y
    player.items.push(...pickedUpItems)

    return { ...state, player, items }
  } else {
    return state
  }

}