import request from 'supertest';

import { app } from '../server';
import environment from '../environment';

const {
  GRAPHQL_PATH,
} = environment.env;

export const getHttpRequest = (): request.Test => {
  const httpRequest = request(app).post(GRAPHQL_PATH);
  httpRequest.set('Accept', 'application/json');

  return httpRequest;
};