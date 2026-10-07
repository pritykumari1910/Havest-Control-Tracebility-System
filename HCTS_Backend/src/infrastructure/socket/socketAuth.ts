import type { Socket } from 'socket.io';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../../config/config.ts';
import { tokenTypes } from '../../config/tokens.ts';
import authRepository from '../../api/auth/auth.repository.ts';
import type { AuthContext, UserPortal } from '../../api/auth/auth.types.ts';

type SocketAuthPayload = JwtPayload & {
  sub: string;
  email: string;
  roleIds: string[];
  userportal: UserPortal;
  type: (typeof tokenTypes)[keyof typeof tokenTypes];
};

export type SocketUser = {
  userId: string;
  email: string;
  roleIds: string[];
  roles: AuthContext['roles'];
  permissions: AuthContext['permissions'];
  userportal: UserPortal;
};

const getCookieToken = (cookieHeader: string | undefined, cookieName: string): string | undefined => {
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

const getSocketToken = (socket: Socket): string | undefined => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim().replace(/^Bearer\s+/i, '');
  }

  const authorization = socket.handshake.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '').trim();
  }

  return getCookieToken(socket.handshake.headers.cookie, 'accessToken');
};

const verifyAccessToken = (token: string): SocketAuthPayload => {
  const payload = jwt.verify(token, config.jwt.secret) as SocketAuthPayload;

  if (payload.type !== tokenTypes.ACCESS || !payload.sub) {
    throw new Error('Invalid credentials');
  }

  return payload;
};

export const authenticateSocket = async (socket: Socket): Promise<SocketUser> => {
  const accessToken = getSocketToken(socket);
  if (!accessToken) {
    throw new Error('Invalid credentials');
  }

  const payload = verifyAccessToken(accessToken);
  const [storedToken, user] = await Promise.all([
    authRepository.findTokenByValue(accessToken, tokenTypes.ACCESS),
    authRepository.findActiveById(payload.sub),
  ]);

  if (!storedToken || !user) {
    throw new Error('Invalid credentials');
  }

  if (user.forceLogoutAt && payload.iat && payload.iat <= Math.floor(user.forceLogoutAt.getTime() / 1000)) {
    throw new Error('Invalid credentials');
  }

  const authContext = await authRepository.getAuthContextByRoleIds(user.roleIds);

  return {
    userId: payload.sub,
    email: payload.email,
    roleIds: payload.roleIds,
    roles: authContext.roles,
    permissions: authContext.permissions,
    userportal: payload.userportal,
  };
};
