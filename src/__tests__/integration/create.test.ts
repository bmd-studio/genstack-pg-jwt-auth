import jwt from 'jsonwebtoken';
import request from 'supertest';

import environment from '../../environment';
import { setupTestApp, shutdownTestApp } from '../setup/app';
import { identityUsername, identityPassword } from '../fixtures/identity';
import { getHttpRequest } from './graphql-requests';

const {
  JWT_SECRET,
  JWT_IDENTITY_FIELD,
  POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME,
} = environment.env;

const performCreate = async (username: string, password: string): Promise<request.Response>  => {
  const httpRequest = getHttpRequest();
  httpRequest.send({
    query: `
      mutation($username: String!, $password: String!) {
        createIdentity(
          username: $username
          password: $password
        ) {
          identityId
          accessToken
        }
      }
    `,
    variables: {
      username,
      password,
    },
  });

  return await httpRequest;
};

const getAccessToken = (response: request.Response): string => {
  return response?.body?.data?.createIdentity?.accessToken;
};

describe('create', () => {
  beforeAll(async () => {
    await setupTestApp();
  });
  afterAll(async () => {
    await shutdownTestApp();
  });

  // it('temporary delay to keep test server open', async() => {
  //   expect.assertions(1);
    
  //   await new Promise<void>((resolve) => {
  //     setTimeout(() => {
  //       resolve();
  //     }, 100000);
  //   })
  // }, 100000);

  it('should not accept duplicate username', async () => {
    const response = await performCreate(identityUsername, identityPassword);
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeFalsy();
  });

  it('should accept valid credentials', async () => {
    const secondIdentityUsername = `${identityUsername}-2`;
    const response = await performCreate(secondIdentityUsername, identityPassword);
    const status = response.status;
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeTruthy();

    const decodedToken = jwt.verify(accessToken, JWT_SECRET);
    const username = decodedToken?.[JWT_IDENTITY_FIELD]?.[POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME];

    expect(status).toBe(200);
    expect(username).toBe(secondIdentityUsername);
  });  
});