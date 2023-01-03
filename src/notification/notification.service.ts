import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { NotificationDto } from './dto/Notification.dto';
import https from 'https';

@Injectable()
export class NotificationService {
  constructor(@InjectModel('User') readonly UserModule: Model<any>) {}

  async updateUserNotificationIds(
    createNotificationDto: NotificationDto,
    req: any,
  ) {
    const { deviceId, playerId } = createNotificationDto;
    const { user } = req;
    const currentUser = await this.UserModule.findById(user.userId).exec();

    currentUser.notificationIds = { [deviceId]: { pId: playerId } };

    const updatedUser = await currentUser.save();
    console.log('updatedUser', updatedUser);
    return { message: 'This action adds a new notification', deviceId };
  }

  async removeUserNotificationIds(id: string, req: any) {
    console.log('id', id);
    const { user } = req;
    const currentUser = await this.UserModule.findById(user.userId).exec();
    currentUser.notificationIds[id] = undefined;
    const updatedUser = await currentUser.save();
    console.log('updatedUser', updatedUser);
    return { message: 'removed' };
  }

  async sendNotification(contents, include_player_ids) {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Basic ${ConfigService.keys.ONE_SIGNAL_REST_API_KEY}`,
    };

    const data = {
      app_id: ConfigService.keys.ONE_SIGNAL_APP_ID,
      contents, //: {"en": "English Message"},
      include_player_ids,
    };

    const options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: headers,
    };

    const req = https.request(options, function (res) {
      res.on('data', function (data) {
        console.log('Response:');
        console.log(JSON.parse(data));
      });
    });

    req.on('error', function (e) {
      console.log('ERROR:');
      console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();
  }
}
