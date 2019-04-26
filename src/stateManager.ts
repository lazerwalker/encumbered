import { State } from "./App";
import GridCalculator, { playerItemCoordinates, GamePosition, itemCoordinates, coordinatesForItem, pickUpItem, dropItem, boundsCoordinates, TileType } from "./GridCalculator";
import _ from "lodash";
import { stat } from "fs";
import { Item, Player } from "./Player";

export type GameReducer = (state: State) => State

export function moveLeft(state: State): State {
  const player = { ...state.player, x: state.player.x - 1 }
  return processPlayerChange(player, state)
}
export function moveRight(state: State): State {
  const player = { ...state.player, x: state.player.x + 1 }
  return processPlayerChange(player, state)
}

export function moveUp(state: State): State {
  const player = { ...state.player, y: state.player.y + 1 }
  return processPlayerChange(player, state)
}

export function moveDown(state: State): State {
  const player = { ...state.player, y: state.player.y - 1 }
  return processPlayerChange(player, state)
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

function processPlayerChange(player: Player, oldState: State): State {
  const state = tryToPickUpItems({ ...oldState, player }, oldState)

  if (!stateIsValid(state)) {
    return oldState
  }

  if (hasExitedRoom(state)) {
    state.exited = true
    return state
  }

  return state
}

function stateIsValid(state: State): boolean {
  let playerCoordinates: GamePosition[] = [...playerItemCoordinates(state), { x: state.player.x, y: state.player.y }]

  // If any player bit intersects with a wall, collide
  if (_.intersectionWith(playerCoordinates, state.walls, _.isEqual).length > 0) {
    return false
  }

  // If any player bit is over an edge, collide
  let edgeTiles = boundsCoordinates(state)
  if (_.intersectionWith(playerCoordinates, edgeTiles, _.isEqual).length > 0) {
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

function hasExitedRoom(state: State): boolean {
  const result = _.flatten(GridCalculator(state))
  return !_.find(result, t => t === TileType.Player || t === TileType.PlayerItem)
}