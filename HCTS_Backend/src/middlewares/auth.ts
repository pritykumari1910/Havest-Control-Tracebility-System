import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config/config.ts';
import { tokenTypes } from '../config/tokens.ts';
import authRepository from '../api/auth/auth.repository.ts';
import type { AuthContext, AuthPermission, AuthRole, UserPortal } from '../api/auth/auth.types.ts';

type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  roleIds: string[];
  roles?: AuthRole[];
  permissions?: AuthPermission[];
  userportal: UserPortal;
  type: (typeof tokenTypes)[keyof typeof tokenTypes];
};

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roleIds: string[];
    roles: AuthRole[];
    permissions: AuthPermission[];
    userportal: UserPortal;
  };
}

const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DISABLED: 'Account disabled',
  FORBIDDEN: 'You do not have permission to perform this action',
} as const;

const getBearerToken = (req: Request): string | undefined => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }

  return authorization.replace('Bearer ', '').trim();
};

const getCookieToken = (req: Request, cookieName: string): string | undefined => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((cookieMap, cookie) => {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) {
      return cookieMap;
    }

    const key = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    cookieMap[key] = decodeURIComponent(value);
    return cookieMap;
  }, {});

  return cookies[cookieName];
};

const getAccessToken = (req: Request): string | undefined => {
  return getBearerToken(req) || getCookieToken(req, 'accessToken');
};

const sendAuthError = (res: Response, statusCode: number, message: string): void => {
  res.status(statusCode).json({
    success: false,
    message,
    responseObject: null,
    statusCode,
  });
};

const verifyToken = (token: string, type: AuthTokenPayload['type']): AuthTokenPayload => {
  const payload = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;

  if (payload.type !== type || !payload.sub) {
    throw new Error(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  return payload;
};

const attachUser = (req: AuthRequest, payload: AuthTokenPayload, authContext: AuthContext): void => {
  req.user = {
    userId: payload.sub,
    email: payload.email,
    roleIds: payload.roleIds,
    roles: authContext.roles,
    permissions: authContext.permissions,
    userportal: payload.userportal,
  };
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    sendAuthError(res, httpStatus.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    return;
  }

  try {
    const payload = verifyToken(accessToken, tokenTypes.ACCESS);
    const storedToken = await authRepository.findTokenByValue(accessToken, tokenTypes.ACCESS);
    const user = await authRepository.findActiveById(payload.sub);

    if (!storedToken) {
      sendAuthError(res, httpStatus.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
      return;
    }

    if (!user) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_DISABLED);
      return;
    }

    if (user.forceLogoutAt && payload.iat && payload.iat <= Math.floor(user.forceLogoutAt.getTime() / 1000)) {
      sendAuthError(res, httpStatus.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
      return;
    }

    const authContext = await authRepository.getAuthContextByRoleIds(user.roleIds);

    attachUser(req, payload, authContext);
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      sendAuthError(res, httpStatus.UNAUTHORIZED, 'Token expired');
      return;
    }
    sendAuthError(res, httpStatus.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }
};

export const requirePermission = (permissionIdentifier: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const hasPermission = req.user?.permissions.some((permission) => permission.permissionIdentifier === permissionIdentifier);

    if (!hasPermission) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
      return;
    }

    next();
  };
};

export const requireSystemAdminRole = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isSystemAdmin = req.user?.roles.some((role) => role.name === 'System Administrator');

    if (!isSystemAdmin) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
      return;
    }

    next();
  };
};

export const requireGeographicManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Operations Director', 'Field Engineer'].includes(role.name)
    );

    if (!isAuthorized) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
      return;
    }

    next();
  };
};

export const requireCrewManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Farm Manager', 'Manijero / Crew Supervisor'].includes(role.name)
    );

    if (!isAuthorized) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
      return;
    }

    next();
  };
};

export const requireFieldManagementRoles = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const isAuthorized = req.user?.roles.some((role) =>
      ['System Administrator', 'Field Engineer', 'Farm Manager'].includes(role.name)
    );

    if (!isAuthorized) {
      sendAuthError(res, httpStatus.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
      return;
    }

    next();
  };
};