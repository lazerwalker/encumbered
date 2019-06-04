import _ from "lodash";

export interface Player {
  x: number
  y: number

  key: string

  // A single (non-HTML) character for now, will swap out with an image
  tile: "@"
}