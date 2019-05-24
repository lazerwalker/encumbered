import { Room, generateRoom, Direction, sideFromExit, KeyedPosition, keyedWrap } from "./Room";
import { GamePosition } from "./GridCalculator";

function roomKey(pos: GamePosition): string {
  return `${pos.x},${pos.y}`
}

/* For now, a dungeon is just a 3x3 grid, where every room connects to each other */
export interface Dungeon {
  // `coord` is of the form "x,y". e.g. "1,2"
  // As with within rooms, positions are zero-indexed, and with (0, 0) in the bottom-left 
  rooms: { [coord: string]: Room }
}

export function generateDungeon(): Dungeon {
  const rooms: { [coord: string]: Room } = {}

  const roomAt = (pos: GamePosition) => {
    return rooms[roomKey(pos)]
  }

  const tryToGenerateRoom = (pos: GamePosition): Room => {
    let entrances: KeyedPosition[] = []

    const check: [GamePosition, Direction][] =
      [
        [{ x: pos.x - 1, y: pos.y }, Direction.Right],
        [{ x: pos.x + 1, y: pos.y }, Direction.Left],
        [{ x: pos.x, y: pos.y - 1 }, Direction.Up],
        [{ x: pos.x, y: pos.y + 1 }, Direction.Down]
      ]

    check.forEach(([pos, direction]) => {
      const room = roomAt(pos)
      if (room) {
        const es = room.exits.filter(e => {
          return sideFromExit(e, 8) === direction
        }).map(keyedWrap)
        entrances.push(...es)
      }
    })


    let forbidden: Direction[] = []
    if (pos.x === 0) {
      forbidden.push(Direction.Left)
    }

    if (pos.x === 2) {
      forbidden.push(Direction.Right)
    }

    if (pos.y === 0) {
      forbidden.push(Direction.Down)
    }

    if (pos.y === 2) {
      forbidden.push(Direction.Up)
    }

    return generateRoom(pos, entrances, forbidden)
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const room = tryToGenerateRoom({ x: i, y: j })
      if (room) {
        rooms[roomKey(room.pos)] = room
      }
    }
  }

  return { rooms }
}

export function roomByTakingExit(dungeon: Dungeon, room: Room, exit: GamePosition): Room {
  const direction = sideFromExit(exit)
  console.log("DIRECTION", direction)
  let newPos = room.pos
  if (direction === Direction.Left) {
    newPos.x -= 1
  } else if (direction === Direction.Right) {
    newPos.x += 1
  } else if (direction === Direction.Up) {
    newPos.y += 1
  } else if (direction === Direction.Down) {
    newPos.y -= 1
  }

  console.log("Returning room at", newPos)
  return dungeonRoomAt(dungeon, newPos)
}

export function dungeonRoomAt(dungeon: Dungeon, pos: GamePosition): Room {
  console.log(dungeon.rooms)
  console.log(pos, roomKey(pos), dungeon.rooms[roomKey(pos)].pos, dungeon)
  return dungeon.rooms[roomKey(pos)]
}
