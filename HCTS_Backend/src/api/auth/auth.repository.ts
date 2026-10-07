import bcrypt from 'bcryptjs';
import type { Moment } from 'moment';
import type { Types } from 'mongoose';
import { RoleModel, Token, User } from '../../models/index.ts';
import PasswordOtp from '../../models/passwordOtp.model.ts';
import { tokenTypes } from '../../config/tokens.ts';
import type {
  AuthContext,
  AuthPermission,
  AuthUserDocument,
  CreateUserBody,
  UpdateUserBody,
  UserListFilters,
  UserPortal,
} from './auth.types.ts';

type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class AuthRepository {
  async createUser(userBody: CreateUserBody): Promise<AuthUserDocument> {
    return User.create(userBody) as Promise<AuthUserDocument>;
  }

  async findByEmailAndPortal(email: string, userportal: UserPortal): Promise<AuthUserDocument | null> {
    return User.findOne({
      email: email.toLowerCase(),
      $or: [
        { userportal },
        { userportal: 'both' },
        { userportal: { $exists: false } },
      ],
      deletedAt: null,
    }).select('+password') as Promise<AuthUserDocument | null>;
  }

  async findActiveById(userId: string | Types.ObjectId): Promise<AuthUserDocument | null> {
    return User.findOne({
      _id: userId,
      isActive: true,
      deletedAt: null,
    }).select('+password') as Promise<AuthUserDocument | null>;
  }

  async findById(userId: string | Types.ObjectId): Promise<AuthUserDocument | null> {
    return User.findOne({
      _id: userId,
      deletedAt: null,
    }) as Promise<AuthUserDocument | null>;
  }

  async getAllUsers(filters: UserListFilters = {}): Promise<{ users: AuthUserDocument[]; total: number }> {
    const query: Record<string, any> = {
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters.roleId || filters.roleName) {
      const roles = await RoleModel.find({
        ...(filters.roleId ? { _id: filters.roleId } : {}),
        ...(filters.roleName ? { name: new RegExp(`^${escapeRegExp(filters.roleName)}$`, 'i') } : {}),
        isActive: true,
      }).select('_id');

      const roleIds = roles.map((role) => role._id);
      query.roleIds = { $in: roleIds };
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    const total = await User.countDocuments(query);

    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const users = (await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)) as AuthUserDocument[];

    return { users, total };
  }

  async getAuthContextByRoleIds(roleIds: Types.ObjectId[] | string[]): Promise<AuthContext> {
    const roles = await RoleModel.find({
      _id: { $in: roleIds },
      isActive: true,
    })
      .populate('permissions')
      .lean();

    const permissionById = new Map<string, AuthPermission>();

    const authRoles = roles.map((role) => {
      const permissions = ((role.permissions || []) as unknown as Array<{
        _id: Types.ObjectId;
        permissionName: string;
        permissionIdentifier: string;
      }>).map((permission) => {
        const authPermission = {
          id: String(permission._id),
          permissionName: permission.permissionName,
          permissionIdentifier: permission.permissionIdentifier,
        };

        permissionById.set(authPermission.id, authPermission);

        return authPermission;
      });

      return {
        id: String(role._id),
        name: role.name,
        roleType: role.roleType,
        isSystem: role.isSystem,
        isActive: role.isActive,
        permissions,
      };
    });

    return {
      roles: authRoles,
      permissions: Array.from(permissionById.values()),
    };
  }

  async countByEmail(email: string): Promise<number> {
    return User.countDocuments({
      email: email.toLowerCase(),
      deletedAt: null,
    });
  }

  async updateLastLogin(userId: string | Types.ObjectId): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  async updateUser(userId: string | Types.ObjectId, payload: UpdateUserBody): Promise<AuthUserDocument | null> {
    return User.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
      },
      payload,
      {
        new: true,
        runValidators: true,
      }
    ) as Promise<AuthUserDocument | null>;
  }

  async updateUserActiveStatus(userId: string | Types.ObjectId, isActive: boolean): Promise<AuthUserDocument | null> {
    return User.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
      },
      {
        isActive,
        ...(isActive ? {} : { forceLogoutAt: new Date() }),
      },
      {
        new: true,
        runValidators: true,
      }
    ) as Promise<AuthUserDocument | null>;
  }

  async deleteTokensForUser(userId: string | Types.ObjectId, type?: TokenType): Promise<void> {
    await Token.deleteMany({
      user: userId,
      ...(type ? { type } : {}),
    });
  }

  async deleteRefreshTokensForUser(userId: string | Types.ObjectId): Promise<void> {
    await this.deleteTokensForUser(userId, tokenTypes.REFRESH);
  }

  async forceLogoutUser(userId: string | Types.ObjectId): Promise<AuthUserDocument | null> {
    return User.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
      },
      {
        forceLogoutAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ) as Promise<AuthUserDocument | null>;
  }


  async updatePassword(userId: string | Types.ObjectId, password: string): Promise<AuthUserDocument | null> {
    const user = (await User.findById(userId).select('+password')) as AuthUserDocument | null;
    if (!user) {
      return null;
    }

    user.password = password;
    await user.save();
    return user;
  }
  async saveToken(token: string, userId: string | Types.ObjectId, expires: Moment | Date, type: TokenType): Promise<void> {
    await Token.create({
      token,
      user: userId,
      expires: expires instanceof Date ? expires : expires.toDate(),
      type,
    });
  }

  async saveRefreshToken(token: string, userId: string | Types.ObjectId, expires: Moment): Promise<void> {
    await this.saveToken(token, userId, expires, tokenTypes.REFRESH);
  }

  async findTokenByValue(token: string, type: TokenType) {
    return Token.findOne({
      token,
      type,
      expires: { $gt: new Date() },
      blacklisted: false,
    });
  }

  async deleteTokenByValue(token: string, userId: string | Types.ObjectId, type: TokenType): Promise<void> {
    await Token.deleteOne({
      token,
      user: userId,
      type,
    });
  }

  async createPasswordOtp(email: string, userportal: UserPortal, otp: string, expiresAt: Date) {
    await PasswordOtp.updateMany(
      { email: email.toLowerCase(), status: 'pending' },
      { status: 'expired' }
    );

    return PasswordOtp.create({
      email: email.toLowerCase(),
      userportal: userportal as any,
      otp,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt,
    });
  }

  async verifyPasswordOtp(email: string, userportal: UserPortal, otp: string): Promise<boolean> {
    await PasswordOtp.updateMany(
      {
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $lte: new Date() },
      },
      { status: 'expired' }
    );

    const otpDoc = await PasswordOtp.findOneAndUpdate(
      {
        email: email.toLowerCase(),
        otp,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      },
      {
        status: 'used',
        usedAt: new Date(),
      },
      { new: true }
    );

    return Boolean(otpDoc);
  }
}

export default new AuthRepository();
