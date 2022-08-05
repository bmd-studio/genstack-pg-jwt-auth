import { Server } from 'http';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import { typeDefs, resolvers } from './graphql';
import environment from './environment';
import logger from './logger';

const {
  GRAPHQL_PATH,
} = environment.env;

export const app = express();
export const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.applyMiddleware({
  app,
  path: GRAPHQL_PATH,
});

let expressServer: Server;

export const initializeServer = async (): Promise<void> => {
  // include the constants here to allow test environments to change it before connecting
  const {
    DEFAULT_HTTP_PORT,
  } = environment.env;

  return new Promise((resolve) => {
    expressServer = app.listen({
      port: DEFAULT_HTTP_PORT,
    }, () => {
      logger.info(`Server ready and listening on port ${DEFAULT_HTTP_PORT} at ${GRAPHQL_PATH}`);
      resolve();
    });
  });
};

export const shutdownServer = async(): Promise<void> => {
  expressServer?.close();
};
