// src/common/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Just try to authenticate, but don't throw error if not authenticated
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Return user if found, otherwise return null (no error)
    return user || null;
  }
}