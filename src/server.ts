import fastify from 'fastify'

const app = fastify()

app.get('/', () => {
  return 'NLW Journey'
})

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 Server is running at http://localhost:3333/')
})
