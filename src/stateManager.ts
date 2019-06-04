import { State } from "./State";
import GridCalculator, { GamePosition, boundsCoordinates, TileType } from "./GridCalculator";
import { Item } from "./Item"

import _ from "lodash";
import { keyedWrap, keyedClamp } from "./Room";
import { roomByTakingExit, replaceRoom } from "./Dungeon";
import { moveEnemy } from "./Enemy";
import { ActionType, Action } from "./actions";

function movementVector(action: Action): GamePosition {
  let vector: GamePosition = { x: 0, y: 0 }
  if (action.type === ActionType.MoveLeft) {
    vector.x = -1
  } else if (action.type === ActionType.MoveRight) {
    vector.x = 1
  } else if (action.type === ActionType.MoveUp) {
    vector.y = 1
  } else if (action.type === ActionType.MoveDown) {
    vector.y = -1
  }

  return vector
}

export function reducer(state: State, action: Action): State {
  if (action.type === ActionType.Release) {
    return release(state)
  } else if (action.type === ActionType.Wait) {
    console.log("TODO: WAIT")
    return state
  } else { // For now, this is just movement
    const vector = movementVector(action)

    // Move the player and their held items
    let newState = _.cloneDeep(state)


    if (!avoidsWallCollisions(vector, state)) {
      return state
    }

    newState.player.x += vector.x
    newState.player.y += vector.y

    newState = resolveItemCollisions(vector, newState, state)

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
}

function release(state: State): State {
  const heldItems = state.items.filter(i => i.held)
  if (heldItems.length === 0) return state

  heldItems.forEach(i => i.held = false)

  return {
    ...state,
    items: _.cloneDeep(state.items)
  }
}

function moveEnemies(state: State): State {
  let newState = _.cloneDeep(state)

  state.enemies.forEach(e => {
    newState = moveEnemy(newState, e)
  })

  return newState
}

function avoidsWallCollisions(vector: GamePosition, state: State): boolean {
  let playerCoordinates: GamePosition[] = state.items
    .filter(i => i.held)
    .map(i => {
      return { x: i.x, y: i.y }
    })
    .concat({ x: state.player.x, y: state.player.y })
    .map(i => {
      return { x: i.x + vector.x, y: i.y + vector.y }
    })

  console.log("COORDINAWTES", JSON.stringify(playerCoordinates, null, 2))
  // If any player bit is over an edge, collide
  let edgeTiles = boundsCoordinates(state)
  if (_.intersectionWith(playerCoordinates, edgeTiles, _.isEqual).length > 0) {
    return false
  }

  return true
}

function resolveItemCollisions(movementVector: GamePosition, state: State, oldState: State): State {
  // TODO: I'm not yet actually moving the held items
  // Need to think through (and probably totally rewrite?) that flows
  let player = state.player

  let enemies = _.cloneDeep(state.enemies)

  let destroyedItems: Item[] = []

  let stopMovement = false

  let oldPositions: { [key: string]: GamePosition } = {}

  state.items.forEach(i => {
    if (i.held) {
      let bumpedIntoItem = _.find(state.items, j => i.key !== j.key && j.x === i.x && j.y === i.y)
      if (bumpedIntoItem) {
        console.log("bumped into item!")
        stopMovement = true
      } else {
        oldPositions[i.key] = { x: i.x, y: i.y }
        i.x += movementVector.x
        i.y += movementVector.y
      }

      // Kill enemy!
      if (i.type === TileType.ItemSword) {
        let e = _.find(enemies, e => e.x === i.x && e.y === i.y)
        if (e) {
          destroyedItems.push(i)
          enemies = _.without(enemies, e)
          stopMovement = true
        }
      }
    } else {
      if (i.x === player.x && i.y === player.y) {
        console.log("Unheld bump?")
        i.held = true
        stopMovement = true
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
    console.log("Stop movement!")
    player.x = oldState.player.x
    player.y = oldState.player.y

    state.items.forEach(i => {
      if (oldPositions[i.key]) {
        i.x = oldPositions[i.key].x
        i.y = oldPositions[i.key].y
      }
    })
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