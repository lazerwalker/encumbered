import { TileType } from "./renderGrid";
import { Enemy } from "./Enemy";
import { Exit } from "./Exit";
import { Item } from "./Item";
import { Dungeon } from "./Dungeon";
import { Room } from "./Room";
import { GameObject } from "./GameObject";

export interface State {
  player: GameObject

  hp: number
  maxHP: number

  exited: boolean
  gameOver: boolean

  // TODO: Refactor these out
  dungeon: Dungeon
  currentRoom: Room

  enemies: Enemy[]
  items: Item[]
  exits: Exit[]

  size: number

  selectedEditorButton?: TileType
}