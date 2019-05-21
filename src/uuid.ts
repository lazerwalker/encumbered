let counter = 0
export default function (): string {
  const result = `${counter}`
  counter += 1
  return result
}