import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatAuthGuard } from 'src/chat/chat-jwt-auth.guard';
import { NotificationDto } from './dto/Notification.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(ChatAuthGuard)
  updateUserNotificationIds(
    @Body() createNotificationDto: NotificationDto,
    @Request() req,
  ) {
    return this.notificationService.updateUserNotificationIds(
      createNotificationDto,
      req,
    );
  }

  @Delete(':id')
  @UseGuards(ChatAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationService.removeUserNotificationIds(id, req);
  }
}
