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

export interface ProcessOptions {
  serverOptions?: ServerOptions;
  postgresOptions?: PostgresOptions;
}

export interface ServerOptions {
  port?: number;
  path?: string;
  healthcheckPath?: string;
}

export interface PostgresOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export { startProcess, stopProcess } from './process';
