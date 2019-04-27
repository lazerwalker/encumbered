import { State } from "./App";
import GridCalculator, { GamePosition, boundsCoordinates, TileType, playerScoreForCurrentRoom } from "./GridCalculator";
import _ from "lodash";
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
  const state = resolveItemCollisions({ ...oldState, player }, oldState)

  if (!avoidsWallCollisions(state)) {
    console.log("Wall?")
    return oldState
  }

  if (hasExitedRoom(state)) {
    state.exited = true
    state.score += playerScoreForCurrentRoom(state)
    return state
  }

  return state
}

function avoidsWallCollisions(state: State): boolean {
  let playerCoordinates: GamePosition[] = state.player.items.map(i => {
    return { x: i.x + state.player.x, y: i.y + state.player.y }
  })
  playerCoordinates.push({ x: state.player.x, y: state.player.y })

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

function resolveItemCollisions(state: State, oldState: State): State {
  let player = state.player
  let destroyedItems: Item[] = []
  let pickedUpItems: Item[] = []
  let destroyedHeldItems: Item[] = []

  // Player
  let i = _.find(state.items, i => i.x === player.x && i.y === player.y)
  if (i) {
    destroyedItems.push(i)
    pickedUpItems.push(pickUpItem(oldState.player, i))
  }

  player.items.forEach(heldItem => {
    let i = _.find(state.items, i => i.x === heldItem.x + player.x && i.y === heldItem.y + player.y)
    if (!i) { return }

    if (heldItem.type === TileType.ItemNormal) {
      console.log("Normal item!")
      // Just pick up the item
      destroyedItems.push(i)
      pickedUpItems.push(pickUpItem(oldState.player, i))
    } else if (heldItem.type === TileType.ItemPush) {
      console.log("Push item")
      // Push the item, but don't pick it up
      // warning: need make sure we CAN move it
      // Also, if this is the only action that takes place, we probably want to move the player
    } else if (heldItem.type === TileType.ItemSword) {
      console.log("Sword item")
      // Destroy the item
      destroyedItems.push(i)
    } if (heldItem.type === TileType.ItemFragile) {
      console.log("Fragile item")
      // Replace the held item with the new one 
      destroyedItems.push(i)

      destroyedHeldItems.push(heldItem)

      const newItem = { ...i, x: heldItem.x, y: heldItem.y }
      pickedUpItems.push(newItem)
    }
  })

  if (pickedUpItems.length > 0 || destroyedItems.length > 0) {
    player.x = oldState.player.x
    player.y = oldState.player.y

    const items = _.without(state.items, ...destroyedItems)
    player.items.push(...pickedUpItems)
    player.items = _.without(player.items, ...destroyedHeldItems)

    return { ...state, player, items }
  } else {
    return state
  }
}

function hasExitedRoom(state: State): boolean {
  const result = _.flatten(GridCalculator(state))
  return !_.find(result, t => t === TileType.Player || t === TileType.PlayerItem)
}

function pickUpItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x - player.x,
    y: item.y - player.y
  }
}

function dropItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x + player.x,
    y: item.y + player.y
  }
}