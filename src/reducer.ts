import { State } from "./State";
import { GamePosition, boundsCoordinates, TileType } from "./renderGrid";
import { Item } from "./Item"

import _ from "lodash";
import { keyedWrap, keyedClamp } from "./Room";
import { roomByTakingExit, replaceRoom } from "./Dungeon";
import { moveEnemy } from "./Enemy";
import { ActionType, Action, ResetAction } from "./actions";
import { rotate } from "./rotate";


export function reducer(state: State, action: Action): State {
  if (action.type === ActionType.Reset) {
    return (action as ResetAction).payload
  } else if (action.type === ActionType.Release) {
    return release(state)
  } else if (action.type === ActionType.Rotate) {
    return rotate(state)
  } else if (action.type === ActionType.Wait) {
    return moveEnemies(state)
  } else if (action.type === ActionType.Heal) {
    console.log("Trying to heal", state.items)
    const potion = state.items.find(i => i.held && i.type === TileType.Potion)
    console.log(potion)
    if (!potion) return state
    console.log("Checking charges")
    // TODO: Animation or something?
    if (potion.charges < 1) return state
    console.log("Do the thing")
    // Sigh, this really begs for lenses
    const newState = _.cloneDeep(state)
    const thePotion = newState.items.find(i => i.key === potion.key)!

    thePotion.charges -= 1
    newState.hp += 1

    return newState
  } else { // For now, this is just movement
    const vector = movementVector(action)

    let newState = _.cloneDeep(state)

    // If the player/their items would collide with the wall, we can exit immediately
    if (collidesWithWall(vector, state)) {
      return state
    }

    // Try to move player/items, 
    // picking up other items + attacking enemies as appropriate
    newState = resolveMovement(vector, newState, state)

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

function moveEnemies(state: State): State {
  let newState = _.cloneDeep(state)

  state.enemies.forEach(e => {
    console.log(`Moving enemy with key ${e.key}`)
    newState = moveEnemy(newState, e)
  })

  return newState
}

function collidesWithWall(vector: GamePosition, state: State): boolean {
  let playerCoordinates: GamePosition[] = state.items
    .filter(i => i.held)
    .map(i => {
      return { x: i.x, y: i.y }
    })
    .concat({ x: state.player.x, y: state.player.y })
    .map(i => {
      return { x: i.x + vector.x, y: i.y + vector.y }
    })

  // If any player bit is over an edge, collide
  let edgeTiles = boundsCoordinates(state)
  if (_.intersectionWith(playerCoordinates, edgeTiles, _.isEqual).length > 0) {
    return true
  }

  return false
}

function resolveMovement(movementVector: GamePosition, state: State, oldState: State): State {
  // TODO: I'm not yet actually moving the held items
  // Need to think through (and probably totally rewrite?) that flows
  const newState = _.cloneDeep(state)
  let player = newState.player

  player.x += movementVector.x
  player.y += movementVector.y

  let destroyedItems: Item[] = []

  let stopMovement = false

  let oldPositions: { [key: string]: GamePosition } = {}

  newState.items.forEach(i => {
    if (i.held) {
      oldPositions[i.key] = { x: i.x, y: i.y }
      i.x += movementVector.x
      i.y += movementVector.y

      // Check for enemy collisions
      let e = _.find(newState.enemies, e => e.x === i.x && e.y === i.y)
      if (e) {
        if (i.type === TileType.Sword) {
          newState.enemies = _.without(newState.enemies, e)
          stopMovement = true
        } else {
          destroyedItems.push(i)
          e.stunned = true
          e.stunnedThisTurn = true
          stopMovement = true
        }

        return
      }

      let bumpedIntoItem = _.find([...newState.items, ...newState.enemies], j => {
        return i.key !== j.key
          && j.x === i.x
          && j.y === i.y
      })

      if (bumpedIntoItem) {
        stopMovement = true
        i.x = oldPositions[i.key].x
        i.y = oldPositions[i.key].y
      }
    } else {
      if (i.x === player.x && i.y === player.y) {
        i.held = true
        stopMovement = true
      }
    }
  })

  // If the player bumps into an enemy, ignore that movement
  let enemy = _.find(newState.enemies, e => e.x === player.x && e.y === player.y)
  if (enemy) {
    stopMovement = true
    newState.hp -= 1
    if (newState.hp <= 0) {
      newState.gameOver = true
    }

    enemy.stunned = true
    enemy.stunnedThisTurn = true
  }

  if (stopMovement) {
    // TODO: Use the same keyed dict for player instead of oldState?
    player.x = oldState.player.x
    player.y = oldState.player.y

    newState.items.forEach(i => {
      if (oldPositions[i.key]) {
        i.x = oldPositions[i.key].x
        i.y = oldPositions[i.key].y
      }
    })
  }

  newState.items = _.without(newState.items, ...destroyedItems)
  return newState
}

// A player has exited the room when both them and their held objects are not visible on-screen
// Even though the bounds of the normal map are (0, size - 1), positions -1 and size are the walls/doors,
// so we need to make sure the objects are even beyond those
function hasExitedRoom(state: State): boolean {
  let playerObjects: GamePosition[] = [...state.items.filter(i => i.held), state.player]

  return !_.find(playerObjects, o => {
    return o.x >= -1
      && o.x <= state.size
      && o.y >= -1
      && o.y <= state.size
  })
}