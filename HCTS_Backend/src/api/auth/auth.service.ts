import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../../config/config.ts';
import { tokenTypes } from '../../config/tokens.ts';
import emailService from '../../services/email.service.ts';
import ServiceResponseBase from '../../utils/ServiceResponse.ts';
import authRepository from './auth.repository.ts';
import { RoleModel, User } from '../../models/index.ts';
import type {
  AuthContext,
  AuthResponseObject,
  AuthTokens,
  AuthUserDocument,
  CreateUserBody,
  RegisterBody,
  UpdateUserBody,
  UserListFilters,
  UserPortal,
} from './auth.types.ts';

const ServiceResponse = ServiceResponseBase;

const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'User registered successfully',
  USER_CREATE_SUCCESS: 'User created successfully',
  USER_UPDATE_SUCCESS: 'User updated successfully',
  USER_FETCH_SUCCESS: 'User fetched successfully',
  USERS_FETCH_SUCCESS: 'Users fetched successfully',
  USER_ACTIVATE_SUCCESS: 'User activated successfully',
  USER_DEACTIVATE_SUCCESS: 'User deactivated successfully',
  USER_FORCE_LOGOUT_SUCCESS: 'User logged out from all devices successfully',
  LOGIN_SUCCESS: 'Login successful',
  EMAIL_ALREADY_EXISTS: 'Email already taken',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DISABLED: 'Account disabled',
  OTP_SENT: 'Password reset OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  INVALID_OTP: 'Invalid or expired OTP',
  PASSWORD_RESET_LINK_SENT: 'Password reset link sent successfully',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  USER_NOT_FOUND: 'User not found',
  INVALID_ROLES: 'One or more roles are invalid',
  OLD_PASSWORD_INVALID: 'Old password is invalid',
  SAME_PASSWORD: 'New password cannot be same as old password',
  PASSWORD_CONFIRMATION_MISMATCH: 'New password and confirm password do not match',
  PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
  LOGOUT_SUCCESS: 'Logout successful',
} as const;

class AuthService {
  constructor(private readonly repository = authRepository) {}

  private sanitizeUser(user: AuthUserDocument) {
    const userObject = user.toObject ? user.toObject() : { ...user };
    const { password, __v, ...safeUser } = userObject;

    return safeUser;
  }

  private async buildUserAuthContext(user: AuthUserDocument): Promise<AuthContext> {
    return this.repository.getAuthContextByRoleIds(user.roleIds);
  }

  private buildUserResponse(user: AuthUserDocument, authContext: AuthContext) {
    return {
      ...this.sanitizeUser(user),
      roles: authContext.roles,
      permissions: authContext.permissions,
    };
  }

  private generateSystemPassword(): string {
    const randomPart = Math.random().toString(36).slice(2, 10);
    const numericPart = String(Math.floor(1000 + Math.random() * 9000));

    return `Hcts@${randomPart}${numericPart}`;
  }

  private generateAccessToken(user: AuthUserDocument) {
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const payload = {
      sub: user.id,
      email: user.email,
      roleIds: user.roleIds.map((roleId) => String(roleId)),
      userportal: user.userportal,
      type: tokenTypes.ACCESS,
      iat: moment().unix(),
      exp: expires.unix(),
    };

    return {
      token: jwt.sign(payload, config.jwt.secret),
      expires,
    };
  }

  private generatePasswordResetToken(user: AuthUserDocument) {
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const payload = {
      sub: user.id,
      email: user.email,
      userportal: user.userportal,
      type: 'reset-password',
      iat: moment().unix(),
      exp: expires.unix(),
    };

    return {
      token: jwt.sign(payload, config.jwt.secret),
      expires,
    };
  }

  private getPortalBaseUrl(userportal: UserPortal): string {
    return userportal === 'app' ? config.app.mobileBaseUrl : config.app.frontendBaseUrl;
  }

  private async generateTokenPair(user: AuthUserDocument, authContext: AuthContext): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshPayload = {
      sub: user.id,
      email: user.email,
      roleIds: user.roleIds.map((roleId) => String(roleId)),
      userportal: user.userportal,
      type: tokenTypes.REFRESH,
      iat: moment().unix(),
      exp: refreshExpires.unix(),
    };
    const refreshToken = jwt.sign(refreshPayload, config.jwt.secret);

    await this.repository.saveToken(accessToken.token, user.id, accessToken.expires, tokenTypes.ACCESS);
    await this.repository.saveRefreshToken(refreshToken, user.id, refreshExpires);

    return {
      accessToken: accessToken.token,
      refreshToken,
      expiresIn: accessToken.expires.diff(moment(), 'seconds'),
      accessTokenExpires: accessToken.expires.toDate(),
      refreshTokenExpires: refreshExpires.toDate(),
    };
  }

  private async deriveUserPortal(roleIds?: string[], userportal?: UserPortal): Promise<UserPortal> {
    if (!roleIds || roleIds.length === 0) {
      return userportal || 'both';
    }

    const roles = await RoleModel.find({ _id: { $in: roleIds } });
    const roleTypes = new Set(roles.map((r) => r.roleType));

    if (roleTypes.has('web') && roleTypes.has('app')) {
      return 'both';
    }
    if (roleTypes.has('app')) {
      return 'app';
    }
    if (roleTypes.has('web')) {
      return 'web';
    }
    return userportal || 'both';
  }

  async register(userBody: RegisterBody) {
    const email = userBody.email.toLowerCase();
    const exists = await this.repository.countByEmail(email);

    if (exists) {
      return ServiceResponse.failure(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, null, httpStatus.BAD_REQUEST);
    }

    const userportal = await this.deriveUserPortal(userBody.roleIds, userBody.userportal);
    const password = this.generateSystemPassword();
    const user = await this.repository.createUser({
      ...userBody,
      userportal,
      email,
      password,
    });
    const authContext = await this.buildUserAuthContext(user);
    const tokens = await this.generateTokenPair(user, authContext);
    await emailService.sendWelcomeEmail(`${user.firstName} ${user.lastName}`, user.email, password);

    return ServiceResponse.success(
      AUTH_MESSAGES.REGISTER_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
        tokens,
      },
      httpStatus.CREATED
    );
  }

  async login(email: string, password: string, userportal: UserPortal) {
    const user = await this.repository.findByEmailAndPortal(email, userportal);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    if (!user.isActive || user.deletedAt) {
      return ServiceResponse.failure(AUTH_MESSAGES.ACCOUNT_DISABLED, null, httpStatus.FORBIDDEN);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    const authContext = await this.buildUserAuthContext(user);
    const tokens = await this.generateTokenPair(user, authContext);
    await this.repository.updateLastLogin(user.id);

    return ServiceResponse.success(
      AUTH_MESSAGES.LOGIN_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
        tokens,
      },
      httpStatus.OK
    );
  }

  async addUser(userBody: CreateUserBody) {
    const email = userBody.email.toLowerCase();
    const exists = await this.repository.countByEmail(email);

    if (exists) {
      return ServiceResponse.failure(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS, null, httpStatus.BAD_REQUEST);
    }

    const userportal = await this.deriveUserPortal(userBody.roleIds, userBody.userportal);
    const password = userBody.password || this.generateSystemPassword();
    const user = await this.repository.createUser({
      ...userBody,
      userportal,
      email,
      password,
    });
    const authContext = await this.buildUserAuthContext(user);

    return ServiceResponse.success(
      AUTH_MESSAGES.USER_CREATE_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
      },
      httpStatus.CREATED
    );
  }

  private async validateRoles(roleIds: string[] = []) {
    if (!roleIds.length) {
      return true;
    }

    const authContext = await this.repository.getAuthContextByRoleIds(roleIds);
    return authContext.roles.length === roleIds.length;
  }

  private async validateRolesAndPortal(_roleIds?: string[], _userportal?: string, _userId?: string) {
    // Both web and app roles can now be assigned to a single user account
    return null;
  }

  async updateUser(userId: string, payload: UpdateUserBody) {
    const existingUser = await this.repository.findById(userId);
    if (!existingUser) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const isValidRoles = await this.validateRoles(payload.roleIds);

    if (!isValidRoles) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_ROLES, null, httpStatus.BAD_REQUEST);
    }

    const finalRoleIds = payload.roleIds || existingUser.roleIds.map((id) => id.toString());
    const userportal = await this.deriveUserPortal(finalRoleIds, payload.userportal || existingUser.userportal);

    const user = await this.repository.updateUser(userId, {
      ...payload,
      userportal,
    });

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const authContext = await this.buildUserAuthContext(user);

    return ServiceResponse.success(
      AUTH_MESSAGES.USER_UPDATE_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
      },
      httpStatus.OK
    );
  }

  async getUserById(userId: string) {
    const user = await this.repository.findById(userId);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const authContext = await this.buildUserAuthContext(user);

    return ServiceResponse.success(
      AUTH_MESSAGES.USER_FETCH_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
      },
      httpStatus.OK
    );
  }

  async getCurrentUser(userId?: string) {
    if (!userId) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    return this.getUserById(userId);
  }

  async updateCurrentUser(userId: string | undefined, payload: Pick<UpdateUserBody, 'firstName' | 'lastName' | 'phoneNumber'>) {
    if (!userId) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    return this.updateUser(userId, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
    });
  }

  async getAllUsers(filters: UserListFilters) {
    const { users, total } = await this.repository.getAllUsers(filters);
    const userResponses = await Promise.all(
      users.map(async (user) => {
        const authContext = await this.buildUserAuthContext(user);
        return this.buildUserResponse(user, authContext);
      })
    );

    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 10;

    return ServiceResponse.success(
      AUTH_MESSAGES.USERS_FETCH_SUCCESS,
      {
        users: userResponses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      httpStatus.OK
    );
  }

  async updateUserActiveStatus(userId: string, isActive: boolean) {
    const user = await this.repository.updateUserActiveStatus(userId, isActive);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (!isActive) {
      await this.repository.deleteTokensForUser(userId);
    }

    const authContext = await this.buildUserAuthContext(user);

    return ServiceResponse.success(
      isActive ? AUTH_MESSAGES.USER_ACTIVATE_SUCCESS : AUTH_MESSAGES.USER_DEACTIVATE_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
      },
      httpStatus.OK
    );
  }

  async forceLogoutUser(userId: string) {
    const user = await this.repository.forceLogoutUser(userId);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    await this.repository.deleteTokensForUser(userId);

    const authContext = await this.buildUserAuthContext(user);

    return ServiceResponse.success(
      AUTH_MESSAGES.USER_FORCE_LOGOUT_SUCCESS,
      {
        user: this.buildUserResponse(user, authContext),
      },
      httpStatus.OK
    );
  }

  async sendPasswordOtp(email: string, userportal: UserPortal = 'web') {
    const user = await this.repository.findByEmailAndPortal(email, userportal);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = moment().add(10, 'minutes').toDate();

    await this.repository.createPasswordOtp(user.email, userportal, otp, expiresAt);
    await emailService.sendOtpEmail(user.email, otp);

    return ServiceResponse.success(AUTH_MESSAGES.OTP_SENT, null, httpStatus.OK);
  }

  async verifyOtp(email: string, userportal: UserPortal = 'web', otp?: string) {
    if (!otp) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_OTP, null, httpStatus.BAD_REQUEST);
    }

    const isVerified = await this.repository.verifyPasswordOtp(email, userportal, otp);

    if (!isVerified) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_OTP, null, httpStatus.UNAUTHORIZED);
    }

    return ServiceResponse.success(AUTH_MESSAGES.OTP_VERIFIED, null, httpStatus.OK);
  }

  async forgotPassword(email: string, userportal: UserPortal = 'web') {
    const user = await this.repository.findByEmailAndPortal(email, userportal);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const targetPortal = userportal || (user.userportal === 'app' ? 'app' : 'web');
    const { token } = this.generatePasswordResetToken(user);
    const resetLink = `${this.getPortalBaseUrl(targetPortal)}/reset-password?token=${encodeURIComponent(token)}`;

    await emailService.sendPasswordResetEmail(user.email, resetLink, config.jwt.resetPasswordExpirationMinutes);

    return ServiceResponse.success(AUTH_MESSAGES.PASSWORD_RESET_LINK_SENT, null, httpStatus.OK);
  }

  async resetPassword(token?: string, newPassword?: string) {
    if (!token || !newPassword) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_RESET_TOKEN, null, httpStatus.BAD_REQUEST);
    }

    let payload: { sub: string; email: string; userportal: UserPortal; type?: string };

    try {
      payload = jwt.verify(token, config.jwt.secret) as { sub: string; email: string; userportal: UserPortal; type?: string };
    } catch {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_RESET_TOKEN, null, httpStatus.UNAUTHORIZED);
    }

    if (payload.type !== 'reset-password' || !payload.sub || !payload.email) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_RESET_TOKEN, null, httpStatus.UNAUTHORIZED);
    }

    const user = await this.repository.findByEmailAndPortal(payload.email, payload.userportal);

    if (!user || String(user.id) !== payload.sub) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_RESET_TOKEN, null, httpStatus.UNAUTHORIZED);
    }

    const newPasswordMatchesExisting = await bcrypt.compare(newPassword, user.password);
    if (newPasswordMatchesExisting) {
      return ServiceResponse.failure(AUTH_MESSAGES.SAME_PASSWORD, null, httpStatus.BAD_REQUEST);
    }

    await this.repository.updatePassword(user.id, newPassword);
    return ServiceResponse.success(AUTH_MESSAGES.PASSWORD_UPDATE_SUCCESS, null, httpStatus.OK);
  }

  async changePassword(userId?: string, oldPassword?: string, newPassword?: string) {
    if (!userId || !oldPassword || !newPassword) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.BAD_REQUEST);
    }

    const user = await this.repository.findActiveById(userId);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (!user.password) {
      return ServiceResponse.failure(AUTH_MESSAGES.USER_NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const oldPasswordMatches = await bcrypt.compare(oldPassword, user.password);
    if (!oldPasswordMatches) {
      return ServiceResponse.failure(AUTH_MESSAGES.OLD_PASSWORD_INVALID, null, httpStatus.UNAUTHORIZED);
    }

    const newPasswordMatchesExisting = await bcrypt.compare(newPassword, user.password);
    if (newPasswordMatchesExisting) {
      return ServiceResponse.failure(AUTH_MESSAGES.SAME_PASSWORD, null, httpStatus.BAD_REQUEST);
    }

    await this.repository.updatePassword(user.id, newPassword);

    return ServiceResponse.success(AUTH_MESSAGES.PASSWORD_UPDATE_SUCCESS, null, httpStatus.OK);
  }

  async refreshToken(refreshTokenValue: string) {
    if (!refreshTokenValue) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    let payload: { sub: string; type?: string };

    try {
      payload = jwt.verify(refreshTokenValue, config.jwt.secret) as { sub: string; type?: string };
    } catch {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    if (payload.type !== tokenTypes.REFRESH || !payload.sub) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    const user = await this.repository.findActiveById(payload.sub);

    if (!user) {
      return ServiceResponse.failure(AUTH_MESSAGES.ACCOUNT_DISABLED, null, httpStatus.FORBIDDEN);
    }

    if (user.forceLogoutAt && user.forceLogoutAt.getTime() > 0) {
      await this.repository.deleteTokensForUser(user.id);
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    const storedToken = await this.repository.findTokenByValue(refreshTokenValue, tokenTypes.REFRESH);

    if (!storedToken) {
      return ServiceResponse.failure(AUTH_MESSAGES.INVALID_CREDENTIALS, null, httpStatus.UNAUTHORIZED);
    }

    await this.repository.deleteTokenByValue(refreshTokenValue, user.id, tokenTypes.REFRESH);

    const authContext = await this.buildUserAuthContext(user);
    const tokens = await this.generateTokenPair(user, authContext);

    return ServiceResponse.success('Tokens refreshed successfully', { user: this.buildUserResponse(user, authContext), tokens }, httpStatus.OK);
  }

  async logout(userId?: string) {
    if (userId) {
      await this.repository.deleteTokensForUser(userId);
    }

    return ServiceResponse.success(AUTH_MESSAGES.LOGOUT_SUCCESS, null, httpStatus.OK);
  }
}

export default new AuthService();
