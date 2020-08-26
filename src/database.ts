import _ from 'lodash';
import pg from 'pg';
import bcrypt from 'bcrypt';

import { Identity } from './index';
import environment from './environment';
import logger from './logger';

const {
  BCRYPT_SALT_ROUNDS,

  POSTGRES_IDENTITY_TABLE_NAME,
  POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME,
  POSTGRES_IDENTITY_SECRET_COLUMN_NAME ,  
  POSTGRES_HIDDEN_COLUMN_NAMES,
} = environment.env;

let pgClient: pg.Client;

export const getClient = (): pg.Client => {
  return pgClient;
};

export const formatIdentity = (identity: Identity): Identity => {
  const hiddenColumnNames = _.concat(
    _.split(POSTGRES_HIDDEN_COLUMN_NAMES, ','), 
    [POSTGRES_IDENTITY_SECRET_COLUMN_NAME]
  );

  // remove hidden fields
  _.map(hiddenColumnNames, (hiddenColumnName: string) => {
    delete identity?.[hiddenColumnName];
  });  

  return identity;
};

export const queryIdentityTable = async (query: string, variables?: string[]): Promise<Identity> => {
  const identityResult = await pgClient.query(query, variables); 
  const identity: Identity = identityResult?.rows?.[0] as Identity;
  return identity;
};

export const getIdentity = async (username: string): Promise<Identity> => {
  return await queryIdentityTable(`
    SELECT 
      * 
    FROM 
      ${POSTGRES_IDENTITY_TABLE_NAME}
    WHERE 
      ${POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME} = $1
    LIMIT 1
  `, [username]);
};

export const createIdentity = async (username: string, password: string): Promise<Identity> => {
  const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT_ROUNDS));

  return await queryIdentityTable(`
    INSERT INTO 
      ${POSTGRES_IDENTITY_TABLE_NAME}
      (${POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME}, ${POSTGRES_IDENTITY_SECRET_COLUMN_NAME})
    VALUES 
      ($1, $2)
    RETURNING 
      *
  `, [username, hashedPassword]); 
};

export const changePassword = async (username: string, password: string): Promise<Identity> => {
  const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT_ROUNDS));

  return queryIdentityTable(`
    UPDATE 
      ${POSTGRES_IDENTITY_TABLE_NAME}
    SET 
      ${POSTGRES_IDENTITY_SECRET_COLUMN_NAME} = $1
    WHERE 
      ${POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME} = $2
    RETURNING 
      *
  `, [hashedPassword, username]); 
};

export const connectDatabase = async (): Promise<void> => {
  // include the constants here to allow test environments to change it before connecting
  const {
    APP_PREFIX, 
    POSTGRES_HOST_NAME,
    POSTGRES_PORT,
    POSTGRES_DATABASE_NAME,
    POSTGRES_ADMIN_ROLE_NAME,
    POSTGRES_ADMIN_SECRET,
  } = environment.env;

  pgClient = new pg.Client({
    host: POSTGRES_HOST_NAME,
    port: parseInt(POSTGRES_PORT),
    database: POSTGRES_DATABASE_NAME,
    user: `${APP_PREFIX}_${POSTGRES_ADMIN_ROLE_NAME}`,
    password: POSTGRES_ADMIN_SECRET,
  });

  return new Promise((resolve, reject) => {
    pgClient.connect((error: any) => {

      // guard: check for connection error
      if (error) {
        logger.error(`An error occurred when connecting to the database...`);
        logger.error(error);
        reject(error);
        return;
      }
      
      logger.info(`Successfully connected to the database!`);
      resolve();
    });
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  await pgClient?.end();
};