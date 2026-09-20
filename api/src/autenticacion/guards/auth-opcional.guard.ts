import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Intenta autenticar con jwt-local o supabase, pero nunca rechaza la request:
 * si no hay sesión válida, req.user queda como null.
 */
@Injectable()
export class AuthOpcionalGuard extends AuthGuard(['jwt-local', 'supabase']) {
  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    return (user || null) as TUser;
  }
}
