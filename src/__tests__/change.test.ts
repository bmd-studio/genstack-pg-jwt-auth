import jwt from 'jsonwebtoken';
import request from 'supertest';

import environment from '../environment';
import { setupTestApp, shutdownTestApp } from './setup/app';
import { identityUsername, identityPassword } from './fixtures/identity';
import { getHttpRequest } from './graphql-requests';

const {
  JWT_SECRET,
  JWT_IDENTITY_FIELD,
  POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME,
} = environment.env;

const performChange = async (accessToken: string, password: string): Promise<request.Response>  => {
  const httpRequest = getHttpRequest();
  httpRequest.send({
    query: `
      mutation($accessToken: String!, $password: String!) {
        changeCredentials(
          accessToken: $accessToken
          password: $password
        ) {
          identityId
          accessToken
        }
      }
    `,
    variables: {
      accessToken,
      password,
    },
  });

  return await httpRequest;
};

const performLogin = async (username: string, password: string): Promise<request.Response>  => {
  const httpRequest = getHttpRequest();
  httpRequest.send({
    query: `
      mutation($username: String!, $password: String!) {
        login(
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
  return response?.body?.data?.changeCredentials?.accessToken ?? response?.body?.data?.login?.accessToken;
};

describe('change', () => {
  beforeAll(async () => {
    await setupTestApp();
  });
  afterAll(async () => {
    await shutdownTestApp();
  });

  it('should not accept invalid access token', async () => {
    const newPassword = 'new-password';
    const response = await performChange('invalid-access-token', newPassword);
    const accessToken = getAccessToken(response);

    expect(accessToken).toBeFalsy();
  });   

  it('should accept valid access token', async () => {
    const newPassword = 'new-password';
    const loginResponse = await performLogin(identityUsername, identityPassword);
    const loginAccessToken = getAccessToken(loginResponse);

    const changeResponse = await performChange(loginAccessToken, newPassword);
    const changeStatus = changeResponse.status;
    const changeAccessToken = getAccessToken(changeResponse);

    expect(changeStatus).toBe(200);
    expect(changeAccessToken).toBeTruthy();

    const newLoginResponse = await performLogin(identityUsername, newPassword);
    const newLoginStatus = newLoginResponse.status;
    const newLoginAccessToken = getAccessToken(newLoginResponse);

    const decodedToken = jwt.verify(newLoginAccessToken, JWT_SECRET);
    const username = decodedToken?.[JWT_IDENTITY_FIELD]?.[POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME];

    expect(newLoginStatus).toBe(200);
    expect(username).toBe(identityUsername);
  });  
});