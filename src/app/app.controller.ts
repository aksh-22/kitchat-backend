import { Controller, Post, Request, UseGuards, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';
import { CreateAppDto } from './dto/create-app.dto';

@Controller('app')
export class AppController {
  constructor(private appSvc: AppService) {}

  @Post('create-app')
  @UseGuards(JwtAuthGuard)
  async signup(@Body() body: CreateAppDto, @Request() req) {
    return this.appSvc.createApp(body, req.user._id);
  }
}
