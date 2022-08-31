import { Server } from 'http';
import express, { Express } from 'express';
import { ApolloServer } from 'apollo-server-express';

import { typeDefs, resolvers } from './graphql';
import environment from './environment';
import logger from './logger';
import { ServerOptions } from './index';

export let expressApp: Express;
let expressServer: Server;

export const initializeServer = async (options?: ServerOptions): Promise<void> => {
  // include the constants here to allow test environments to change it before connecting
  const {
    DEFAULT_HTTP_PORT,
    GRAPHQL_PATH,
  } = environment.env;
  const { port = DEFAULT_HTTP_PORT, path = GRAPHQL_PATH } = options ?? {};

  logger.info(`Starting server to listing on port ${port} at ${path}...`);
  expressApp = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  server.applyMiddleware({
    app: expressApp,
    path,
  });

  return new Promise((resolve) => {
    expressServer = expressApp.listen({
      port,
    }, () => {
      logger.info(`Server ready and listening on port ${port} at ${path}`);
      resolve();
    });
  });
};

export const shutdownServer = async(): Promise<void> => {
  expressServer?.close();
};
