import type { Schema } from "../../data/resource"

export const handler: Schema["sayHello"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`
  const { name } = event.arguments
  // return typed from `.returns()
  console.log(JSON.stringify({
    level: 'INFO',
    message: 'sayHello function invoked',
    name,
    timestamp: new Date().toISOString()
  }))

  return `Hello, ${name}!`
}