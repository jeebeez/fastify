'use strict'

const { test } = require('node:test')
const Fastify = require('..')

test('compileSerializationSchema caches per httpStatus and contentType', async t => {
  const fastify = Fastify()
  const compiled = []

  fastify.setSerializerCompiler(({ httpStatus, contentType }) => {
    compiled.push({ httpStatus, contentType })
    return data => JSON.stringify({ httpStatus, contentType, data })
  })

  fastify.get('/', (_request, reply) => {
    const schema = { type: 'object' }
    const first = reply.compileSerializationSchema(schema, '200', 'application/json')
    const second = reply.compileSerializationSchema(schema, '201', 'application/vnd.example+json')

    t.assert.notStrictEqual(first, second)
    t.assert.strictEqual(reply.compileSerializationSchema(schema, '200', 'application/json'), first)
    t.assert.strictEqual(reply.compileSerializationSchema(schema, '201', 'application/vnd.example+json'), second)
    t.assert.strictEqual(reply.getSerializationFunction(schema), first)
    t.assert.deepStrictEqual(compiled, [
      { httpStatus: '200', contentType: 'application/json' },
      { httpStatus: '201', contentType: 'application/vnd.example+json' }
    ])
    t.assert.strictEqual(second({ value: 2 }), JSON.stringify({
      httpStatus: '201',
      contentType: 'application/vnd.example+json',
      data: { value: 2 }
    }))

    return { ok: true }
  })

  const res = await fastify.inject('/')
  t.assert.strictEqual(res.statusCode, 200)
})
