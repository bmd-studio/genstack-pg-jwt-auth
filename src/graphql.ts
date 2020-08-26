import { includes, merge } from 'lodash';
import jwt, { Algorithm } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { gql } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';

import { LoginPayload, LogoutPayload, Identity, Credentials } from './index';
import { getIdentity, createIdentity, changePassword, formatIdentity } from './database';
import environment from './environment';
import logger from './logger';

const {
  DATABASE_ID_COLUMN_NAME,
  POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME,
  POSTGRES_IDENTITY_SECRET_COLUMN_NAME,
  POSTGRES_IDENTITY_ROLES_COLUMN_NAME,
  POSTGRES_IDENTITY_ROLE_NAME,
  
  POSTGRAPHILE_ACCESS_TOKEN_KEY,

  JWT_IDENTITY_FIELD,
  JWT_IDENTITY_ID_FIELD,
  JWT_ROLE_FIELD,
  JWT_ALGORITHM,

  JWT_EXPIRES_IN,
  JWT_ISSUER,

  JWT_SECRET,

  JWT_CLOCK_TOLERANCE,
} = environment.env;

const invalidLoginPayload: LoginPayload = {
  identityId: null,
  role: null,
  accessToken: null,
};

export const getCredentials = (args: any): Credentials => {
  return {
    username: args?.[POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME],
    password: args?.[POSTGRES_IDENTITY_SECRET_COLUMN_NAME],
    accessToken: args?.[POSTGRAPHILE_ACCESS_TOKEN_KEY],
  };
};

export const verifyRole = async (identity: Identity, role: string): Promise<boolean> => {
  const isValidRole = includes(identity?.[POSTGRES_IDENTITY_ROLES_COLUMN_NAME], role);

  return isValidRole;
};

export const verifyPassword = async (identity: Identity, password: string): Promise<boolean> => {
  const hashedPassword: string = identity?.[POSTGRES_IDENTITY_SECRET_COLUMN_NAME];
  const isValidPassword: boolean = await bcrypt.compare(password, hashedPassword);

  return isValidPassword;
};

export const createAccessToken = async (identity: Identity, role: string): Promise<string> => {
  const accessToken: string = jwt.sign({
    [JWT_IDENTITY_FIELD]: formatIdentity(identity),
    [JWT_IDENTITY_ID_FIELD]: identity[DATABASE_ID_COLUMN_NAME],
    [JWT_ROLE_FIELD]: role,
  }, JWT_SECRET, {
    // convert to integer to avoid any string parsing as ms
    expiresIn: parseInt(String(JWT_EXPIRES_IN)),
    issuer: JWT_ISSUER,
    keyid: uuidv4(),
    algorithm: JWT_ALGORITHM as Algorithm,
  });

  return accessToken;
};

export const typeDefs = gql`

  type Query {
    _: Boolean
  }

  # Login payload
  type LoginPayload {
    identityId: String
    role: String
    accessToken: String
  }

  # Logout payload
  type LogoutPayload {
    isLoggedOut: Boolean
  }

  type Mutation {
    login(
      ${POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME}: String! 
      ${POSTGRES_IDENTITY_SECRET_COLUMN_NAME}: String!
      role: String
    ): LoginPayload
    logout: LogoutPayload
    createIdentity(
      ${POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME}: String! 
      ${POSTGRES_IDENTITY_SECRET_COLUMN_NAME}: String!  
    ): LoginPayload
    changeCredentials(
      ${POSTGRES_IDENTITY_SECRET_COLUMN_NAME}: String!
      accessToken: String!
    ): LoginPayload
  }
`;

const login = async (_parent: any, args: any): Promise<LoginPayload> => {
  const { username, password } = getCredentials(args);
  const role: string = args?.role ?? POSTGRES_IDENTITY_ROLE_NAME;
  const identity: Identity = await getIdentity(username);

  // guard: check if the identity could be found
  if (!identity) {
    logger.error(`The identity for username '${username}' was not found.`);
    return invalidLoginPayload;
  }

  const isValidRole: boolean = await verifyRole(identity, role);

  // guard: check if the role is valid
  if (!isValidRole) {
    logger.error(`The role '${role}' for username '${username}' was not allowed.`);
    return invalidLoginPayload;
  }

  const isValidPassword: boolean = await verifyPassword(identity, password);

  // guard: check if the password is valid
  if (!isValidPassword) {
    logger.error(`The password for username '${username}' was not valid.`);
    return invalidLoginPayload;
  }
  
  logger.info(`Successfully verified login request for username '${username}'.`);

  return {
    identityId: identity[DATABASE_ID_COLUMN_NAME],
    role: role,
    accessToken: await createAccessToken(identity, role),
  };
};

export const resolvers = {
  Query: {
  },
  Mutation: {
    login: login,
    logout: async (): Promise<LogoutPayload> => {
      return {
        isLoggedOut: false,
      };
    },
    createIdentity: async (_parent: any, args: any): Promise<LoginPayload> => {
      const { username, password } = getCredentials(args);
      const identity = await createIdentity(username, password);

      // guard: make sure the identity is valid
      if (!identity) {
        logger.error('An error occurred when creating a new identity.');
        return invalidLoginPayload;
      }

      return login(_parent, args);
    },
    changeCredentials: async (_parent: any, args: any): Promise<LoginPayload> => {
      const { password, accessToken } = getCredentials(args);

      // guard: make sure the token is valid
      if (!accessToken) {
        return invalidLoginPayload;
      }

      const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET, {
        clockTolerance: parseInt(JWT_CLOCK_TOLERANCE),
      });
      const identity: Identity = decodedAccessToken?.[JWT_IDENTITY_FIELD];
      const username: string = identity?.[POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME];
      const updatedIdentity: Identity = await changePassword(username, password);

      if (!updatedIdentity) {
        logger.error(`An error occurred when updating the credentials for username ${username}!`);
        return invalidLoginPayload;
      }

      logger.info(`Successfully updated the credentials for username ${username}!`);

      return login(_parent, merge(args, {
        username,
      }));
    },
  },
};
