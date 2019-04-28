import { State } from "./App";
import GridCalculator, { GamePosition, boundsCoordinates, TileType } from "./GridCalculator";
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

  // Check if the player is holding any Block tiles
  let blockTiles = state.player.items
    .filter(i => i.type === TileType.ItemBlock)
    .map(i => ({ x: i.x + state.player.x, y: i.y + state.player.y }))

  for (let heldItem of blockTiles) {
    let blocker = state.items.find(i => i.x === heldItem.x && i.y === heldItem.y)
    if (blocker) {
      return false
    }
  }

  return true
}

function resolveItemCollisions(state: State, oldState: State): State {
  let player = state.player
  let destroyedItems: Item[] = []
  let pickedUpItems: Item[] = []
  let destroyedHeldItems: Item[] = []
  let blocksToPush: [Item, GamePosition][] = []

  let stopMovement = false

  // Player
  let i = _.find(state.items, i => i.x === player.x && i.y === player.y)
  if (i) {
    destroyedItems.push(i)
    pickedUpItems.push(pickUpItem(oldState.player, i))
    stopMovement = true
  }

  player.items.forEach(heldItem => {
    let i = _.find(state.items, i => i.x === heldItem.x + player.x && i.y === heldItem.y + player.y)
    if (!i) { return }

    if (heldItem.type === TileType.ItemNormal) {
      // Just pick up the item
      stopMovement = true
      destroyedItems.push(i)
      pickedUpItems.push(pickUpItem(oldState.player, i))
    } else if (heldItem.type === TileType.ItemPush) {
      // Push the item, but don't pick it up
      // warning: need make sure we CAN move it
      // Also, if this is the only action that takes place, we probably want to move the player

      const vector = { x: state.player.x - oldState.player.x, y: state.player.y - oldState.player.y }
      blocksToPush.push([i, vector])
    } else if (heldItem.type === TileType.ItemSword) {
      // Destroy the item
      stopMovement = true
      destroyedItems.push(i)
    } else if (heldItem.type === TileType.ItemMoney) {
      // Replace the held item with the new one 
      stopMovement = true

      destroyedItems.push(i)
      destroyedHeldItems.push(heldItem)

      const newItem = { ...i, x: heldItem.x, y: heldItem.y }
      pickedUpItems.push(newItem)
    } else if (heldItem.type === TileType.ItemBlock) {
      // Handled in collision detection
    }
  })

  let items = state.items

  if (stopMovement) {
    player.x = oldState.player.x
    player.y = oldState.player.y
  } else if (blocksToPush.length > 0) {
    // TODO: I'm not sure if this logic should live here.
    // The check at the end to stop movement particularly smells like this belongs somewhere else.
    let pushedBlocksToDelete: Item[] = []
    let pushedBlocksToAdd: Item[] = []
    const badCoordinates = [...boundsCoordinates(state), ...state.walls]

    const move = (i: Item, vector: GamePosition): boolean => {
      const newPosition = { x: i.x + vector.x, y: i.y + vector.y }
      if (badCoordinates.find(c => c.x === newPosition.x && c.y === newPosition.y)) {
        return false
      }

      let shouldPush = true

      const existingItem = state.items.find(i => i.x === newPosition.x && i.y === newPosition.y)
      if (existingItem) {
        shouldPush = move(existingItem, vector)
      }

      if (shouldPush) {
        pushedBlocksToDelete.push(i)
        pushedBlocksToAdd.push({ ...i, x: i.x + vector.x, y: i.y + vector.y })
      }

      return shouldPush
    }

    blocksToPush.forEach(result => {
      move(...result)
    })

    items = _.without(items, ...pushedBlocksToDelete)
    items.push(...pushedBlocksToAdd)

    if (pushedBlocksToDelete.length === 0) {
      // We shouldn't move!
      player.x = oldState.player.x
      player.y = oldState.player.y
    }
  }

  items = _.without(items, ...destroyedItems)
  player.items.push(...pickedUpItems)
  player.items = _.without(player.items, ...destroyedHeldItems)

  return { ...state, player, items }
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