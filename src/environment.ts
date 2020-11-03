export default {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get env() {
    return {
      APP_PREFIX: 'pg-jwt-auth', 
      DEBUG: 'pg-jwt-auth:*',

      DEFAULT_HTTP_PORT: 4000,

      BCRYPT_SALT_ROUNDS: '10',
      
      POSTGRES_HOST_NAME: 'postgresql',
      POSTGRES_PORT: '5432',
      POSTGRES_DATABASE_NAME: 'project',
      POSTGRES_ADMIN_ROLE_NAME: 'admin',
      POSTGRES_ADMIN_SECRET: 'password',
      POSTGRES_IDENTITY_ROLE_NAME: 'identity',

      POSTGRES_IDENTITY_TABLE_NAME: 'identities',
      POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME: 'username',
      POSTGRES_IDENTITY_SECRET_COLUMN_NAME: 'password',
      POSTGRES_IDENTITY_ROLES_COLUMN_NAME: 'roles',
      POSTGRES_HIDDEN_COLUMN_NAMES: 'password,secret',

      DATABASE_ID_COLUMN_NAME: 'id',

      JWT_AUTH_LOGIN_MUTATION_NAME: 'login',
      JWT_AUTH_LOGOUT_MUTATION_NAME: 'logout',
      JWT_AUTH_CREATE_IDENTITY_MUTATION_NAME: 'createIdentity',
      JWT_AUTH_CHANGE_CREDENTIALS_MUTATION_NAME: 'changeCredentials',

      GRAPHQL_PATH: '/graphql',
      
      ACCESS_TOKEN_KEY: 'accessToken',

      JWT_IDENTITY_FIELD: 'identity',
      JWT_IDENTITY_ID_FIELD: 'identity_id',
      JWT_ROLE_FIELD: 'identity_role',
      JWT_ALGORITHM: 'HS256',
      JWT_EXPIRES_IN: `${24 * 60 * 60}`,
      JWT_ISSUER: 'unknown',
      JWT_SECRET: 'unknown',
      JWT_CLOCK_TOLERANCE: '5',

      ...process.env,
    };
  }
};