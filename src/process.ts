import { ProcessOptions } from './index';
import { connectDatabase, disconnectDatabase } from './database';
import { initializeServer, shutdownServer } from './server';

/**
 * Connect to the database and start the GraphQL server.
 */
export const startProcess = async (options?: ProcessOptions): Promise<void> => {
  const { postgresOptions, serverOptions } = options ?? {};

  // wait until the database is fully connected
  await connectDatabase(postgresOptions);

  // initialize the server to listen on the specified port
  await initializeServer(serverOptions);
};

/**
 * Disconnect from the database and stop the GraphQL server.
 */
export const stopProcess = async(): Promise<void> => {
  await shutdownServer();
  await disconnectDatabase();
};
