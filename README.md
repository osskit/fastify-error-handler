# @osskit/fastify-error-handler

`@osskit/fastify-error-handler` is a reusable error handler for Fastify. It helps you manage error responses in a consistent and customizable manner, with built-in support for logging and filtering allowed error properties.

## Features

- Handles various error types and provides appropriate HTTP status codes.
- Logs errors with customizable logging function.
- Allows specifying which properties of the error object should be included in the response.
- Works seamlessly with Fastify's error handling mechanism.

## Installation

Install the package via npm:

```bash
npm install @osskit/fastify-error-handler
```

Or via yarn:

```bash
yarn add @osskit/fastify-error-handler
```

## Usage

### Basic Usage

```typescript
import fastify from 'fastify';
import { fastifyErrorHandler } from '@osskit/fastify-error-handler';

const server = fastify();

server.setErrorHandler(fastifyErrorHandler());

server.get('/', async () => {
  // Simulate an error
  throw new Error('Test error');
});

server.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
```

### Custom Logging and Allowed Properties

You can customize the error handler by providing a logging function and specifying which properties of the error object should be included in the response.

```typescript
import fastify from 'fastify';
import { fastifyErrorHandler } from '@osskit/fastify-error-handler';

const server = fastify();

const customLogger = ({ error, request, reply }) => {
  console.log('Custom log:', error);
};

const options = {
  log: customLogger,
  allowedProperties: ['detail', 'type']
};

server.setErrorHandler(fastifyErrorHandler(options));

server.get('/', async () => {
  const error = new Error('Test error');
  error.detail = 'Detailed error information';
  error.type = 'CustomError';
  throw error;
});

server.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
```

### Handling HTTP Errors

The error handler works well with HTTP errors created using libraries like `http-errors`.

```typescript
import fastify from 'fastify';
import createHttpError from 'http-errors';
import { fastifyErrorHandler } from '@osskit/fastify-error-handler';

const server = fastify();

server.setErrorHandler(fastifyErrorHandler());

server.get('/not-found', async () => {
  throw createHttpError(404, 'Resource not found');
});

server.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
```

## API

### fastifyErrorHandler(options?)

Returns a Fastify error handler function.

#### options

- `log` (optional): A function to log errors. Receives an object with `error`, `request`, and `reply` properties.
- `allowedProperties` (optional): An iterable of property names that are allowed to be included in the error response.

## License

This package is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.