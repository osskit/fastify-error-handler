import { describe, it, expect, vi } from 'vitest';
import fastify from 'fastify';
import createHttpError from 'http-errors';
import { fastifyErrorHandler } from '../src/index.js';

describe('fastifyErrorHandler', () => {
  describe('exports', () => {
    it('should expose a fastifyErrorHandler function', () => {
      expect(typeof fastifyErrorHandler).toBe('function');
    });
  });

  describe('integration tests', () => {
    it.each([
      { name: 'normal error', error: new Error('test error'), statusCode: 500, message: 'Internal Server Error' },
      { name: 'empty error', error: {}, statusCode: 500, message: 'Internal Server Error' },
      { name: 'null error', error: null, statusCode: 500, message: 'Internal Server Error' },
      { name: 'undefined error', error: undefined, statusCode: 500, message: 'Internal Server Error' },
      { name: 'string error', error: 'test error', statusCode: 500, message: 'Internal Server Error' },
      { name: 'number error', error: 500, statusCode: 500, message: 'Internal Server Error' },
      { name: '404 error', error: { statusCode: 404 }, statusCode: 404, message: 'Not Found' },
      { name: '400 error', error: { statusCode: 400 }, statusCode: 400, message: 'Bad Request' },
      { name: 'http error', error: createHttpError(418), statusCode: 418, message: "I'm a Teapot" },
      { name: 'http error with message', error: createHttpError(418, 'I am a teapot'), statusCode: 418, message: 'I am a teapot' },
      {
        name: 'http error with message and props',
        error: createHttpError(418, 'I am a teapot', { test: 'test' }),
        statusCode: 418,
        message: 'I am a teapot',
        props: { test: 'test' },
        allowedProperties: ['test'],
      },
      {
        name: 'http error with message and disallowed props',
        error: createHttpError(418, 'I am a teapot', { test: 'test', statusCode: 420 }),
        statusCode: 418,
        message: 'I am a teapot',
        props: {},
        allowedProperties: ['test', 'statusCode'],
      },
      {
        name: '500 error with message and allowed props',
        error: { statusCode: 500, message: 'test', test: 'test' },
        statusCode: 500,
        message: 'Internal Server Error',
        allowedProperties: ['test'],
      },
    ])(`should handle %s`, async ({ error, statusCode, message, props, allowedProperties }) => {
      const log = vi.fn();
      const server = fastify();
      server.setErrorHandler(fastifyErrorHandler({ log, allowedProperties }));
      server.get('/', async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw error;
      });
      const response = await server.inject('/');
      expect(response.statusCode).toBe(statusCode);
      expect(response.json()).toMatchObject({
        status: statusCode,
        message,
        ...props,
      });
      expect(log).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith({
        error,
        request: expect.any(Object),
        reply: expect.any(Object),
      });
    });

    it('validation error', async () => {
      const log = vi.fn();
      const server = fastify();
      server.setErrorHandler(fastifyErrorHandler({ log }));
      server.post(
        '/',
        { schema: { body: { type: 'object', properties: { number: { type: 'number' }, string: { type: 'string' } } } } },
        async () => 'ok',
      );
      const response = await server.inject({
        method: 'POST',
        url: '/',
        body: JSON.stringify({ number: 5, string: { a: 4 } }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        status: 400,
        message: 'body/string must be string',
      });
      expect(log).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith({
        error: expect.objectContaining({
          statusCode: 400,
          code: 'FST_ERR_VALIDATION',
          validationContext: 'body',
        }),
        request: expect.any(Object),
        reply: expect.any(Object),
      });
    });
  });
});
