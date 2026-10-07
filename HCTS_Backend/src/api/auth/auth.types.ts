import type { Document, Types } from 'mongoose';

export type UserPortal = 'web' | 'app' | 'both';

export interface AuthPermission {
  id: string;
  permissionName: string;
  permissionIdentifier: string;
}

export interface AuthRole {
  id: string;
  name: string;
  roleType: UserPortal;
  isSystem: boolean;
  isActive: boolean;
  permissions: AuthPermission[];
}

export interface AuthContext {
  roles: AuthRole[];
  permissions: AuthPermission[];
}

export interface AuthUserDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  roleIds: Types.ObjectId[];
  userportal: UserPortal;
  isActive: boolean;
  deletedAt?: Date | null;
  lastLoginAt?: Date | null;
  forceLogoutAt?: Date | null;
}

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userportal: UserPortal;
  roleIds?: string[];
}

export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  userportal: UserPortal;
  roleIds?: string[];
}

export interface UpdateUserBody {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  roleIds?: string[];
  userportal?: UserPortal;
}

export interface UserListFilters {
  roleId?: string;
  roleName?: string;
  isActive?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}

export interface AuthResponseObject {
  user: Omit<AuthUserDocument, 'password'> | Record<string, unknown>;
  tokens: AuthTokens;
}
