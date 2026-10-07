import type { CookieOptions, Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.ts';

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
import config from '../../config/config.ts';
import handleServiceResponse from '../../utils/handleServiceResponse.ts';
import authService from './auth.service.ts';
import type { AuthTokens, UpdateUserBody, UserListFilters, UserPortal } from './auth.types.ts';

class AuthController {
  constructor(private readonly service = authService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.register(req.body);

    if (!serviceResponse.success || !serviceResponse.responseObject) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    const { tokens, user } = serviceResponse.responseObject;
    this.setAuthCookies(res, tokens);

    handleServiceResponse(
      {
        ...serviceResponse,
        responseObject: { user, tokens },
      },
      res,
      // next
    );
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password, userportal } = req.body as {
      email: string;
      password: string;
      userportal: UserPortal;
    };

    const serviceResponse = await this.service.login(email, password, userportal);

    if (!serviceResponse.success || !serviceResponse.responseObject) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    const { tokens, user } = serviceResponse.responseObject;
    this.setAuthCookies(res, tokens);

    handleServiceResponse(
      {
        ...serviceResponse,
        responseObject: { user, tokens },
      },
      res,
      // next
    );
  };

  addUser = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.addUser(req.body);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const serviceResponse = await this.service.updateUser(userId, req.body as UpdateUserBody);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getCurrentUser(req.user?.userId);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const serviceResponse = await this.service.getUserById(userId);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  updateCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const serviceResponse = await this.service.updateCurrentUser(req.user?.userId, req.body as UpdateUserBody);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const serviceResponse = await this.service.getAllUsers(req.query as UserListFilters);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  activateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const serviceResponse = await this.service.updateUserActiveStatus(userId, true);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const serviceResponse = await this.service.updateUserActiveStatus(userId, false);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  forceLogoutUser = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const serviceResponse = await this.service.forceLogoutUser(userId);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  sendPasswordOtp = async (req: Request, res: Response): Promise<void> => {
    const { email, userportal } = req.body as { email: string; userportal: UserPortal };
    const serviceResponse = await this.service.sendPasswordOtp(email, userportal);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email, userportal } = req.body as {
      email: string;
      userportal: UserPortal;
    };
    const serviceResponse = await this.service.forgotPassword(email, userportal);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { email, userportal, otp } = req.body as {
      email: string;
      userportal: UserPortal;
      otp: string;
    };
    const serviceResponse = await this.service.verifyOtp(email, userportal, otp);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body as {
      token?: string;
      newPassword?: string;
    };
    const serviceResponse = await this.service.resetPassword(token, newPassword);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
    };
    const serviceResponse = await this.service.changePassword(req.user?.userId, oldPassword, newPassword);

    if (!serviceResponse.success) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    handleServiceResponse(serviceResponse, res);
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getCookieToken(req, 'refreshToken') || (req.body?.refreshToken as string | undefined) || '';
    const serviceResponse = await this.service.refreshToken(refreshToken);

    if (!serviceResponse.success || !serviceResponse.responseObject) {
      handleServiceResponse(serviceResponse, res);
      return;
    }

    const { tokens, user } = serviceResponse.responseObject;
    this.setAuthCookies(res, tokens);

    handleServiceResponse(
      {
        ...serviceResponse,
        responseObject: { user, tokens },
      },
      res
    );
  };

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    const serviceResponse = await this.service.logout(req.user?.userId);

    const cookieOptions = this.getAuthCookieOptions();

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    handleServiceResponse(serviceResponse, res);
  };

  private getAuthCookieOptions(): CookieOptions {
    const isProd = config.env === 'production';

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const cookieOptions = this.getAuthCookieOptions();

    // Access token cookie — expires when the JWT expires (in seconds → milliseconds)
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn * 1000,
    });

    // Refresh token cookie — expires at the exact same time as the JWT (dynamic, not hardcoded)
    const refreshMaxAge = tokens.refreshTokenExpires
      ? tokens.refreshTokenExpires.getTime() - Date.now()
      : config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: refreshMaxAge,
    });
  }
}

export default new AuthController();
