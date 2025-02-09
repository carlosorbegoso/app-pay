import {UserRole} from './user-role';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  token?: string;
}
