import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatJwtStrategy } from './chat-jwt.strategy';

@Injectable()
export class ChatAuthGuard extends AuthGuard('chat-jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    const { password, sessions, ...result } = user;
    return result;
  }
}
