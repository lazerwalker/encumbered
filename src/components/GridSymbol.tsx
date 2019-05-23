import { RenderObject } from "../GridCalculator";
import * as React from 'react'

export default function (props: { obj: RenderObject }) {
  const { obj } = props
  return (
    <span
      className="symbol"
      dangerouslySetInnerHTML={{ __html: obj.tile }}
      key={obj.key}
      style={{
        top: `${5 + obj.y * 60}px`,
        left: `${5 + obj.x * 50}px`
      }} />
  )
}