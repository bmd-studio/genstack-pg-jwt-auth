import bcrypt from 'bcrypt';
import { v4 as uuidv4} from 'uuid';

import environment from '../../environment';

const {
  DATABASE_ID_COLUMN_NAME,
  POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME,
  POSTGRES_IDENTITY_SECRET_COLUMN_NAME,
  POSTGRES_IDENTITY_ROLES_COLUMN_NAME,
  POSTGRES_IDENTITY_ROLE_NAME,
} = environment.env;

export const identityId = uuidv4();
export const identityUsername = `tester`;
export const identityPassword = `password`;
export const identityRoles = [POSTGRES_IDENTITY_ROLE_NAME];

export default {
  [DATABASE_ID_COLUMN_NAME]: identityId,
  [POSTGRES_IDENTITY_IDENTIFICATION_COLUMN_NAME]: identityUsername,
  [POSTGRES_IDENTITY_SECRET_COLUMN_NAME]: bcrypt.hashSync(identityPassword, 10),
  [POSTGRES_IDENTITY_ROLES_COLUMN_NAME]: identityRoles,
};