import { Module } from '@nestjs/common';
import { AppController } from './main.controller';
import { AppService } from './main.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { ChatGateway } from './chat/chat.gateway';
import { CustomerModule } from './customer/customer.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilsModule } from './utils/utils.module';
import { AppModule } from './app/app.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import * as path from 'path';
import { I18nModule } from 'nestjs-i18n';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),

    AuthenticationModule,
    CustomerModule,
    UtilsModule,
    AppModule,
    UserModule,
    ChatModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class MainModule {}
