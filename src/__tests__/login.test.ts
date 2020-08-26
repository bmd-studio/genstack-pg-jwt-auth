import jwt from 'jsonwebtoken';
import request from 'supertest';
import crypto from 'crypto';
import HttpStatus from 'http-status-codes';

import environment from '../environment';
import { setupTestApp, shutdownTestApp } from './setup/app';
import identityFixture, { identityUsername, identityPassword } from './fixtures/identity';
import { getHttpRequest } from './graphql-requests';

const {
  JWT_SECRET,
  DATABASE_ID_COLUMN_NAME,
  JWT_IDENTITY_ID_FIELD,
} = environment.env;

const performLogin = async (username: string, password: string, role: string|undefined = undefined): Promise<request.Response>  => {
  const httpRequest = getHttpRequest();
  httpRequest.send({
    query: `
      mutation($username: String!, $password: String!, $role: String) {
        login(
          username: $username
          password: $password
          role: $role
        ) {
          identityId
          accessToken
        }
      }
    `,
    variables: {
      username,
      password,
      role,
    },
  });

  return await httpRequest;
};

const getAccessToken = (response: request.Response): string => {
  return response?.body?.data?.login?.accessToken;
};

describe('login', () => {
  beforeAll(async () => {
    await setupTestApp();
  });
  afterAll(async () => {
    await shutdownTestApp();
  });

  it('should not accept invalid username', async () => {
    const response = await performLogin('invalid-username', identityPassword);
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeFalsy();
  }); 

  it('should not accept invalid password', async () => {
    const response = await performLogin(identityUsername, 'invalid-password');
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeFalsy();
  });  
  
  it('should not accept invalid role', async () => {
    const response = await performLogin(identityUsername, identityPassword, 'invalid-role');
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeFalsy();
  });     

  it('should not accept too large payload', async () => {
    const largePayload = crypto.randomBytes(100000).toString('hex');
    const response = await performLogin(largePayload, largePayload, largePayload);

    expect(response.status).toBe(HttpStatus.REQUEST_TOO_LONG);
  });

  it('should accept valid credentials', async () => {
    const response = await performLogin(identityUsername, identityPassword);
    const status = response.status;
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeTruthy();

    const decodedToken = jwt.verify(accessToken, JWT_SECRET);
    const identityId = decodedToken?.[JWT_IDENTITY_ID_FIELD];

    expect(status).toBe(200);
    expect(identityId).toBe(identityFixture?.[DATABASE_ID_COLUMN_NAME]);
  });  
});