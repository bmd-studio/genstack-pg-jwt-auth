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

export { startProcess, stopProcess } from './process';
