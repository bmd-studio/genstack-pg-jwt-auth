import { connectDatabase } from './database';
import { initializeServer } from './server';
import logger from './logger';

export interface LoginPayload {
  identityId: string|null;
  role: string|null;
  accessToken: string|null;
}

export interface LogoutPayload {
  isLoggedOut: boolean;
}

export interface Identity {
  id: string;
  roles: string[];
  [key: string]: any;
}

export interface Credentials {
  username: string;
  password: string;
  accessToken?: string;
}

export const main = async (): Promise<void> => {

  // wait until the database is fully connected
  await connectDatabase();

  // initialize the server to listen on the specified port
  await initializeServer();
};

main().then(() => {
  logger.info(`🚀 Ready to receive authentication requests.`);
}).catch((error) => {
  logger.error(`An unknown error occurred:`);
  logger.error(error);
  process.exit(1); 
});