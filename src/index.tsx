import { OpenAPIHono } from '@hono/zod-openapi'
import { renderer } from './renderer'

const app = new OpenAPIHono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>)
})

export default app
