import type { AuthUser } from '../auth/auth.types';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    list(user: AuthUser): Promise<AuthUser[]>;
}
