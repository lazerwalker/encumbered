import { State } from "./State";
import GridCalculator, { GamePosition, boundsCoordinates, TileType } from "./GridCalculator";
import { Player, processPlayerMovement } from "./Player";
import { Item } from "./Item"

import _ from "lodash";
import { keyedWrap, keyedClamp } from "./Room";
import { roomByTakingExit, replaceRoom } from "./Dungeon";
import { moveEnemy } from "./Enemy";
import { ActionType, Action } from "./actions";

export type GameReducer = (state: State) => State

// TODO: Undo queue stores actions rather than function invocations
export function moveLeft(state: State): State {
  return processPlayerChange(state, { type: ActionType.MoveLeft })
}

export function moveRight(state: State): State {
  return processPlayerChange(state, { type: ActionType.MoveRight })
}

export function moveUp(state: State): State {
  return processPlayerChange(state, { type: ActionType.MoveUp })
}

export function moveDown(state: State): State {
  return processPlayerChange(state, { type: ActionType.MoveDown })

}

export function wait(state: State): State {
  return processPlayerChange(state, { type: ActionType.Wait })
}

export function release(state: State): State {
  const heldItems = state.items.filter(i => i.held)
  if (heldItems.length === 0) return state

  heldItems.forEach(i => i.held = false)

  return {
    ...state,
    items: _.cloneDeep(state.items)
  }
}

function processPlayerChange(state: State, action: Action): State {
  let newState = processPlayerMovement(state, action)
  newState = resolveItemCollisions(newState, state)

  if (!avoidsWallCollisions(state)) {
    return state
  }

  if (hasExitedRoom(state)) {
    // state.exited = true

    const playerPos = { ...state.player }

    const size = newState.size

    const clampedPlayer = keyedClamp(playerPos)

    const exits = newState.exits.filter(e => {
      if (e.x <= -1 || e.x >= size) {
        return (e.x === clampedPlayer.x)
      } else {
        return (e.y === clampedPlayer.y)
      }
    }).map(keyedClamp)

    const entrances = exits.map(keyedWrap)

    if (entrances.length === 0) {
      console.log("WHY NO ENTRANCES", newState.exits)
    }

    newState.dungeon = replaceRoom(newState.dungeon, newState.currentRoom)
    const room = roomByTakingExit(newState.dungeon, newState.currentRoom, exits[0])
    return {
      ...newState,
      ...room,
      currentRoom: room,
      player: { ...newState.player, ...keyedWrap(playerPos) }
    }
  }

  if (newState.player.x !== state.player.x || newState.player.y !== state.player.y) {
    newState = moveEnemies(newState)
  }

  return newState
}

function moveEnemies(state: State): State {
  let newState = _.cloneDeep(state)

  state.enemies.forEach(e => {
    newState = moveEnemy(newState, e)
  })

  return newState
}

function avoidsWallCollisions(state: State): boolean {
  let playerCoordinates: GamePosition[] = state.items
    .filter(i => i.held)
    .map(i => {
      return { x: i.x + state.player.x, y: i.y + state.player.y }
    })
  playerCoordinates.push({ x: state.player.x, y: state.player.y })

  // If any player bit is over an edge, collide
  let edgeTiles = boundsCoordinates(state)
  if (_.intersectionWith(playerCoordinates, edgeTiles, _.isEqual).length > 0) {
    return false
  }

  return true
}

function resolveItemCollisions(state: State, oldState: State): State {
  let player = state.player

  let enemies = _.cloneDeep(state.enemies)

  let destroyedItems: Item[] = []

  let stopMovement = false

  state.items.forEach(i => {
    if (i.held) {
      let bumpedIntoItem = _.find(state.items, j => j.x === i.x + player.x && j.y === i.y + player.y)
      if (bumpedIntoItem) {
        stopMovement = true

        // Uncomment these to reinstate katamari behavior
        // destroyedItems.push(i)
        // pickedUpItems.push(pickUpItem(oldState.player, i))
      }

      // Kill enemy!
      if (i.type === TileType.ItemSword) {
        let e = _.find(enemies, e => e.x === i.x + player.x && e.y === i.y + player.y)
        if (e) {
          destroyedItems.push(i)
          enemies = _.without(enemies, e)
          stopMovement = true
        }
      }
    } else {
      if (i.x === player.x && i.y === player.y) {
        i.held = true
      }
    }
  })

  // Let's treat the enemy as a block
  // That is, if the PLAYER (not their item) bumps into it, ignore
  let enemy = _.find(state.enemies, e => e.x === player.x && e.y === player.y)
  if (enemy) {
    stopMovement = true
  }

  if (stopMovement) {
    player.x = oldState.player.x
    player.y = oldState.player.y
  }

  let items = _.cloneDeep(_.without(state.items, ...destroyedItems))
  return { ...state, player, enemies, items }
}

function hasExitedRoom(state: State): boolean {
  const result = _.flatten(GridCalculator(state))
  const types = [
    TileType.Player,
    TileType.HeldItemNormal,
    TileType.HeldItemMoney,
    TileType.HeldItemSword,
    TileType.HeldItemPush,
    TileType.HeldItemBlock
  ]
  return !_.find(result, t => _.includes(types, t))
}