/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel } from 'src/chat/schemas/channel.schema';
import { ConfigService } from 'src/config/config.service';
import { NotificationDto } from './dto/Notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('User') readonly UserModule: Model<any>,
    @InjectModel(Channel.name) readonly ChatModule: Model<any>,
  ) {}

  async updateUserNotificationIds(
    createNotificationDto: NotificationDto,
    req: any,
  ) {
    const { deviceId, playerId } = createNotificationDto;
    const { user } = req;
    const currentUser = await this.UserModule.findById(user.userId).exec();

    const joinedChannels: any = await this.ChatModule.find({
      participants: { $in: [user.userId] },
    }).exec();

    if (joinedChannels.length) {
      for (let index = 0; index < joinedChannels.length; index++) {
        const element = joinedChannels[index];
        for (
          let index = 0;
          index < element.participantsDetails.length;
          index++
        ) {
          let elementNew = element.participantsDetails[index];
          if (elementNew.id == user.userId) {
            elementNew = {
              ...elementNew,
              notificationIds: {
                [deviceId]: { pId: playerId },
                ...elementNew.notificationIds,
              },
            };
          }
          element.participantsDetails[index] = elementNew;
        }

        await element.save();
      }
    }

    currentUser.notificationIds = { [deviceId]: { pId: playerId } };

    const updatedUser = await currentUser.save();
    return {
      message: 'This action adds a new notification',
      deviceId,
      playerId,
    };
  }

  async removeUserNotificationIds(deviceId: string, req: any) {
    const { user } = req;
    const currentUser = await this.UserModule.findById(user.userId).exec();

    const joinedChannels: any = await this.ChatModule.find({
      participants: { $in: [user.userId] },
    }).exec();

    if (joinedChannels.length) {
      for (let index = 0; index < joinedChannels.length; index++) {
        const element = joinedChannels[index];
        for (
          let index = 0;
          index < element.participantsDetails.length;
          index++
        ) {
          const elementNew = element.participantsDetails[index];
          if (elementNew.id == user.userId) {
            elementNew.notificationIds[deviceId] = undefined;
          }
          element.participantsDetails[index] = elementNew;
        }

        await element.save();
      }
    }

    currentUser.notificationIds = { [deviceId]: undefined };
    return { message: 'removed' };
  }

  async sendNotification(contents, include_player_ids) {
    console.log('include_player_ids', include_player_ids);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Basic ${ConfigService.keys.ONE_SIGNAL_REST_API_KEY}`,
    };

    const data = {
      app_id: ConfigService.keys.ONE_SIGNAL_APP_ID,
      contents, //: {"en": "English Message"},
      // include_external_user_ids,
      include_player_ids,
    };

    const options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: headers,
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const https = require('https');

    const req = https.request(options, function (res) {
      res.on('data', function (data) {
        console.log('Response:');
        console.log('data', JSON.parse(data));
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
