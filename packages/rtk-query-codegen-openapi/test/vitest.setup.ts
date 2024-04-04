import nodeFetch from 'node-fetch';
import { format } from 'prettier';
import { server } from './mocks/server';

vi.stubGlobal('fetch', nodeFetch);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// expect.addSnapshotSerializer({
//   test: (val) => typeof val === 'string',
//   print: (val) => {
//     return val as string;
//   },
// });

// expect.addSnapshotSerializer({
//   // async serialize(val) {
//   //   return await format(val, {
//   //     parser: 'typescript',
//   //     endOfLine: 'auto',
//   //     printWidth: 120,
//   //     semi: true,
//   //     singleQuote: true,
//   //     trailingComma: 'es5',
//   //   });
//   // },
//   test: (val) => /injectEndpoints/.test(val),
// });
