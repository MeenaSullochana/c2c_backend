import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { type LoginDto, type RefreshDto, type RegisterDto } from './auth.dto';
import type { AuthUser } from './auth.types';
export declare class AuthController {
    private readonly auth;
    private readonly users;
    constructor(auth: AuthService, users: UsersService);
    register(body: RegisterDto): Promise<{
        user: import("./auth.types").PublicUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    login(body: LoginDto): Promise<{
        user: import("./auth.types").PublicUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    refresh(body: RefreshDto): Promise<import("./auth.types").AuthTokens>;
    logout(body: RefreshDto, user: AuthUser): Promise<{
        success: boolean;
    }>;
    me(user: AuthUser): Promise<import("./auth.types").PublicUser>;
}
