import {
  Controller,
  Post,
  Get,
  Request,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConnectUserDto } from './dto/connect-user.dto';
import { ChatAuthGuard } from '../chat/chat-jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userSvc: UserService) {}
  @Post('connect')
  async connect(@Body() body: ConnectUserDto, @Request() req) {
    return this.userSvc.connectUser(body, req['x-app-info']);
  }

  @Get('all/:teamId')
  @UseGuards(ChatAuthGuard)
  async getAllUsers(@Request() req, @Param('teamId') teamId) {
    return this.userSvc.getAllUsers(req, teamId);
  }
  @Get('currentChannel/:channelId')
  @UseGuards(ChatAuthGuard)
  async setCurrentChannel(@Request() req, @Param('channelId') channelId) {
    return this.userSvc.setUserCurrentChannel(req, channelId);
  }
}
