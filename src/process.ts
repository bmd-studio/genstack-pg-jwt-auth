import { connectDatabase, disconnectDatabase } from './database';
import { initializeServer, shutdownServer } from './server';

/**
 * Connect to the database and start the GraphQL server.
 */
export const startProcess = async (): Promise<void> => {

  // wait until the database is fully connected
  await connectDatabase();

  // initialize the server to listen on the specified port
  await initializeServer();
};

/**
 * Disconnect from the database and stop the GraphQL server.
 */
export const stopProcess = async(): Promise<void> => {
  await shutdownServer();
  await disconnectDatabase();
};
