import _ from 'lodash';
import { GenericContainer, Network, StartedNetwork, StartedTestContainer, Wait } from 'testcontainers';
import getPort from 'get-port';

import { connectDatabase, disconnectDatabase, getClient } from '../../database';
import { initializeServer, shutdownServer } from '../../server';
import environment, { isTestingContainer } from '../../environment';
import templateIdentity from '../fixtures/identity';

const POSTGRES_INTERNAL_PORT = 5432;
const HTTP_INTERNAL_PORT = 4000;

const POSTGRES_DOCKER_IMAGE = 'postgres:13.2-alpine';
const PG_JWT_AUTH_DOCKER_IMAGE = 'ghcr.io/bmd-studio/genstack-pg-jwt-auth:latest';

const APP_PREFIX = 'test';
const POSTGRES_HOST_NAME = '0.0.0.0';
const POSTGRES_DATABASE_NAME = 'test';
const POSTGRES_ADMIN_ROLE_NAME = `admin`;
const POSTGRES_ADMIN_SECRET = 'password';
const POSTGRES_USER = `${APP_PREFIX}_${POSTGRES_ADMIN_ROLE_NAME}`;

let network: StartedNetwork;
let pgContainer: StartedTestContainer; 
let pgJwtAuthContainer: StartedTestContainer;

const setupSupportingContainers = async(): Promise<void> => {
  network = await new Network()
    .start();

  pgContainer = await new GenericContainer(POSTGRES_DOCKER_IMAGE)
    .withNetworkMode(network.getName())
    .withExposedPorts(POSTGRES_INTERNAL_PORT)
    .withEnv('POSTGRES_USER', POSTGRES_USER)
    .withEnv('POSTGRES_PASSWORD', POSTGRES_ADMIN_SECRET)
    .withEnv('POSTGRES_DB', POSTGRES_DATABASE_NAME)
    .start();
};

const setupTestContainer = async(): Promise<void> => {
  pgJwtAuthContainer = await new GenericContainer(PG_JWT_AUTH_DOCKER_IMAGE)
    .withNetworkMode(network.getName())
    .withExposedPorts(HTTP_INTERNAL_PORT)
    .withEnv('APP_PREFIX', APP_PREFIX)
    .withEnv('DEFAULT_HTTP_PORT', String(HTTP_INTERNAL_PORT))
    .withEnv('POSTGRES_HOST_NAME', pgContainer?.getIpAddress(network.getName()))
    .withEnv('POSTGRES_ADMIN_ROLE_NAME', POSTGRES_ADMIN_ROLE_NAME)
    .withEnv('POSTGRES_ADMIN_SECRET', POSTGRES_ADMIN_SECRET)
    .withEnv('POSTGRES_DATABASE_NAME', POSTGRES_DATABASE_NAME)    
    .start();
};

const shutdownContainers = async(): Promise<void> => {
  await pgContainer?.stop();
  await pgJwtAuthContainer?.stop();
};

const setupEnv = async (): Promise<void> => {
  const httpPort = pgJwtAuthContainer?.getMappedPort(HTTP_INTERNAL_PORT)?.toString() ?? await getPort();

  _.assignIn(process.env, {
    APP_PREFIX,
    DEFAULT_HTTP_PORT: httpPort,
    POSTGRES_HOST_NAME,
    POSTGRES_PORT: pgContainer.getMappedPort(POSTGRES_INTERNAL_PORT).toString(),
    POSTGRES_DATABASE_NAME, 
    POSTGRES_ADMIN_ROLE_NAME,
    POSTGRES_ADMIN_SECRET,
  });
};

const setupDatabase = async (): Promise<void> => {
  const pgClient = getClient();
  const {
    DATABASE_ID_COLUMN_NAME: idColumn,
    POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME: usernameColumn,
    POSTGRES_IDENTITY_SECRET_COLUMN_NAME: passwordColumn,
    POSTGRES_IDENTITY_ROLES_COLUMN_NAME: rolesColumn,
    POSTGRES_IDENTITY_TABLE_NAME: tableName,
    POSTGRES_IDENTITY_ROLE_NAME: roleName,
  } = environment.env;
  await pgClient.query(`
    CREATE EXTENSION "uuid-ossp";

    CREATE TABLE ${tableName} (
      ${idColumn} uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      ${usernameColumn} text UNIQUE,
      ${passwordColumn} text,
      ${rolesColumn} json DEFAULT json_build_array('${roleName}')
    );
  `);

  await pgClient.query(`
    INSERT INTO ${tableName} (${idColumn}, ${usernameColumn}, ${passwordColumn})
    VALUES ($1, $2, $3)
  `, [templateIdentity[idColumn], templateIdentity[usernameColumn], templateIdentity[passwordColumn]]);
};

export const setupTestApp = async (): Promise<void> => {
  await setupSupportingContainers();
  await setupEnv();
  await connectDatabase();
  await setupDatabase();
  
  if (isTestingContainer()) {
    await setupTestContainer();
  } else {
    await initializeServer();
  }
};

export const shutdownTestApp = async (): Promise<void> => {
  await shutdownServer();
  await disconnectDatabase();
  await shutdownContainers();
};