import { Room, generateRoom, Direction, sideFromExit } from "./Room";
import { GamePosition } from "./GridCalculator";

function roomKey(pos: GamePosition): string {

  return `${pos.x},${pos.y}`
}
/* For now, a dungeon is just a 3x3 grid, where every room connects to each other */
class Dungeon {
  // `coord` is of the form "x,y". e.g. "1,2"
  // As with within rooms, positions are zero-indexed, and with (0, 0) in the bottom-left 
  rooms: { [coord: string]: Room }

  constructor() {
    this.rooms = {}

    const first = generateRoom({ x: 0, y: 0 })
    this.rooms[roomKey({ x: 0, y: 0 })] = first

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {

      }
    }
  }

  roomAt(pos: GamePosition) {
    return this.rooms[roomKey(pos)]
  }

  tryToGenerateRoom(pos: GamePosition): Room {
    let entrances: GamePosition[] = []

    const check: [GamePosition, Direction][] =
      [
        [{ x: pos.x - 1, y: pos.y }, Direction.Right],
        [{ x: pos.x + 1, y: pos.y }, Direction.Left],
        [{ x: pos.x, y: pos.y - 1 }, Direction.Up],
        [{ x: pos.x, y: pos.y + 1 }, Direction.Down]
      ]

    check.forEach(([pos, direction]) => {
      const room = this.roomAt(pos)
      if (room) {
        entrances.push(...room.exits.filter(e => {
          return sideFromExit(e, 8) == direction
        }))
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

  roomByTakingExit(room: Room, exit: GamePosition[]): Room {
    return this.rooms["foo"]
  }
}

