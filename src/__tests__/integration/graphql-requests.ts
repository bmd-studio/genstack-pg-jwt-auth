import request from 'supertest';

import environment from '../../environment';

const {
  GRAPHQL_PATH,
} = environment.env;

export const getHttpRequest = (): request.Test => {
  const app = require('../../server').expressApp;
  const httpRequest = request(app).post(GRAPHQL_PATH);
  httpRequest.set('Accept', 'application/json');

  return httpRequest;
};
