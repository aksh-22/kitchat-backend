import {
  Controller,
  Get,
  Post,
  Request,
  Req,
  UseGuards,
  Param,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationService } from './authentication.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.loginWithCredentials(req.user);
  }

  @Post('signup')
  async signup(@Body() body: CreateCustomerDto) {
    return this.authService.signUp(body);
  }

  @Get('customer-info')
  @UseGuards(JwtAuthGuard)
  getUserInfo(@Request() req) {
    return req.user;
  }
}
