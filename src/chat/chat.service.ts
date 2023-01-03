import { Injectable, HttpException, Request } from '@nestjs/common';
import { Model, ObjectId, Types } from 'mongoose';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Channel, ChannelDocument } from './schemas/channel.schema';

import { Message, MessageDocument } from './schemas/message.schema';
import { CHCreatePvtDto } from './dto/ch-create-pvt.dto';
import { CHCreateDirectDto } from './dto/ch-create-direct.dto';
import { CHPatchDto } from './dto/ch-patch.dto';
import { CHParticipantAddDto } from './dto/ch-participant-add.dto';
import { CHAdminAddDto } from './dto/ch-admin-add.dto';
import { CHMessageAddDto } from './dto/ch-msg-add.dto';
import { CHMessageRemoveDto } from './dto/ch-msg-remove.dto';
import { I18nService } from 'nestjs-i18n';
import { UserService } from '../user/user.service';
import { ChatGateway } from './chat.gateway';
import { EVENT_TYPE, EVENT_TYPE_ENUM } from './channel.enum';
import { ChMessageDto } from './dto/cha-message.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationDocument } from 'src/notification/schema/notification.schema';

const CHANNEL_TYPE = {
  DIRECT: 'DIRECT',
  CHANNEL_PUBLIC: 'CHANNEL_PUBLIC',
  CHANNEL_PRIVATE: 'CHANNEL_PRIVATE',
};

@Injectable()
export class ChatService {
  constructor(
    private readonly notifyService: NotificationService,
    @InjectModel(Channel.name)
    private channelModel: Model<ChannelDocument>,
    @InjectModel(Message.name)
    private msgModel: Model<MessageDocument>,
    private readonly i18n: I18nService,
    private readonly userSvc: UserService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async channelAggregator(filter) {
    return this.channelModel
      .aggregate([
        {
          $match: filter,
        },
        {
          $project: {
            title: 1,
            description: 1,
            participants: {
              $map: {
                input: '$participants',
                as: 'participant',
                in: {
                  $convert: {
                    input: '$$participant',
                    to: 'objectId',
                  },
                },
              },
            },
            admins: {
              $map: {
                input: '$admins',
                as: 'admin',
                in: {
                  $convert: {
                    input: '$$admin',
                    to: 'objectId',
                  },
                },
              },
            },
            teamId: 1,
            type: 1,
            createdBy: 1,
            lastUpdatedAt: 1,
            createdAt: 1,
            participantsDetails: 1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participants',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'admins',
            foreignField: '_id',
            as: 'admins',
          },
        },
        { $sort: { lastUpdatedAt: -1 } },
      ])
      .exec();
  }

  directChannelTitle(channel, userId) {
    return channel.participants.reduce((title, item) => {
      return item._id != userId
        ? (title += `${item.firstName} ${item.lastName}`)
        : title;
    }, '');
  }

  async channelGetAll(req, teamId): Promise<any> {
    const { user } = req;

    const fetchChannelsAggregate = async (channelType) => {
      let filter;
      filter = {
        appId: new Types.ObjectId(user.appId),
        teamId: teamId || { $in: [undefined, ''] },
        participants: user.userId,
      };
      if (channelType === CHANNEL_TYPE.CHANNEL_PUBLIC) {
        filter = {
          appId: new Types.ObjectId(user.appId),
          teamId: teamId || { $in: [undefined, ''] },
          type: CHANNEL_TYPE.CHANNEL_PUBLIC,
        };
      }
      return await this.channelAggregator(filter);
    };

    const publicChannels = await fetchChannelsAggregate(
      CHANNEL_TYPE.CHANNEL_PUBLIC,
    );
    const userChannels = await fetchChannelsAggregate(null);

    // Making dynamic title for Direct channel.
    userChannels.map((channel) => {
      if (channel.type === CHANNEL_TYPE.DIRECT) {
        channel.title = this.directChannelTitle(channel, user.userId);
      }
    });

    return { publicChannels, otherChannels: userChannels };
  }

  async channelGetById(req, id): Promise<ChannelDocument> {
    const { user } = req;
    const channel = await this.channelModel.findById(id);
    this.channelCheckValidParticipantAccess(channel, user.userId);
    return channel;
  }

  async channelUpdateListener(
    channelId: any,
    event: EVENT_TYPE,
    eventReceivers?: Array<any>,
  ) {
    const searchFilter = {
      _id: channelId,
    };
    await this.channelAggregator(searchFilter).then((res) => {
      this.chatGateway.channelListListener(res[0], event, eventReceivers);
    });
  }

  async channelUpdate(body: CHPatchDto, req, id): Promise<ChannelDocument> {
    const { user } = req;
    const channel = await this.channelModel.findById(id);
    if (body.duplicateTitleAllowed === 'false') {
      await this.channelCheckDuplicateTitle(
        body.title,
        user.appId,
        channel.teamId || null,
        user.appName,
        id,
      );
    }
    this.channelCheckValidAdminAccess(channel, user.userId);
    try {
      const channel = await this.channelModel.findByIdAndUpdate(
        id,
        { ...body },
        { new: true },
      );
      await this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE);

      return channel;
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  async channelCreatePvt(body: CHCreatePvtDto, req): Promise<ChannelDocument> {
    return await this.channelCreateBasic(
      body,
      req,
      CHANNEL_TYPE.CHANNEL_PRIVATE,
    );
  }

  async channelCreatePublic(
    body: CHCreatePvtDto,
    req,
  ): Promise<ChannelDocument> {
    return await this.channelCreateBasic(
      body,
      req,
      CHANNEL_TYPE.CHANNEL_PUBLIC,
    );
  }

  async channelCreateDirect(
    body: CHCreateDirectDto,
    req,
  ): Promise<ChannelDocument> {
    return await this.channelCreateBasic(body, req, CHANNEL_TYPE.DIRECT);
  }

  private async channelCreateBasic(body, req, channelType) {
    try {
      const { user } = req;
      if (body.duplicateTitleAllowed === 'false') {
        await this.channelCheckDuplicateTitle(
          body.title,
          user.appId,
          body.teamId || null,
          user.appName,
          null,
        );
      }

      let participants = [];
      let admins = [];

      if (channelType === CHANNEL_TYPE.CHANNEL_PRIVATE) {
        participants = [user.userId];
        admins = [user.userId];
      }

      if (channelType === CHANNEL_TYPE.CHANNEL_PUBLIC) {
        admins = [user.userId];
      }

      if (channelType === CHANNEL_TYPE.DIRECT) {
        const partnerUser = await this.userSvc.findByRefId(
          body.partnerReferenceId,
          user.appId,
        );
        participants = [user.userId, partnerUser._id.toString()].sort();
        admins = [];
        const existingChannel = await this.channelModel.findOne({
          participants: participants,
          type: CHANNEL_TYPE.DIRECT,
          appId: user.appId,
          teamId: body.teamId == '' || body.teamId == null ? null : body.teamId,
        });
        if (existingChannel != null) {
          return existingChannel;
        }
      }

      const channelModel = new this.channelModel({
        appId: user.appId,
        type: channelType,
        participants: participants,
        admins: admins,
        createdBy: user.userId,
        ...body,
        teamId: body.teamId == '' || body.teamId == null ? null : body.teamId,
      });
      // channelModel;
      const newChannel = await channelModel.save();

      await this.channelUpdateListener(newChannel._id, EVENT_TYPE.ADDED);

      return newChannel;
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  private async channelCheckDuplicateTitle(
    title,
    appId,
    teamId,
    appName,
    excludedChannelId: ObjectId,
  ) {
    const channel = await this.channelModel
      .findOne({
        _id: { $ne: excludedChannelId },
        title: title,
        appId: appId,
        teamId: teamId,
      })
      .lean();
    if (channel != null)
      throw new HttpException(
        this.i18n.t('errors.Channel_Title_Exists', {
          args: {
            title: title,
            appName: appName,
            team: teamId,
          },
        }),
        400,
      );
  }

  private channelCheckValidAdminAccess(channel, adminId) {
    if (channel == null)
      throw new HttpException(this.i18n.t('errors.Invalid_Channel_Id'), 400);

    if (!channel.admins.includes(adminId))
      throw new HttpException(this.i18n.t('errors.NotAdmin'), 401);
  }

  private channelCheckValidParticipantAccess(channel, participantId) {
    if (channel == null)
      throw new HttpException(this.i18n.t('errors.Invalid_Channel_Id'), 400);

    if (!channel.admins.includes(participantId))
      throw new HttpException(
        this.i18n.t('errors.UnauthorizedChannelAccess'),
        401,
      );
  }

  private channelCheckParticipant(channel, userId, shouldInclude) {
    if (shouldInclude) {
      if (!channel.participants.includes(userId))
        throw new HttpException(
          this.i18n.t('errors.ParticipantDoesntExists'),
          400,
        );
    } else {
      if (channel.participants.includes(userId))
        throw new HttpException(
          this.i18n.t('errors.ParticipantAlreadyExists'),
          400,
        );
    }
  }

  private channelCheckAdmin(channel, userId, shouldInclude) {
    if (shouldInclude) {
      if (!channel.admins.includes(userId))
        throw new HttpException(this.i18n.t('errors.AdminDoesntExists'), 400);
    } else {
      // An Admin to be added in channel, must be a participant first in the channel.
      if (!channel.participants.includes(userId))
        throw new HttpException(
          this.i18n.t('errors.AdminMustParticipate'),
          400,
        );

      if (channel.admins.includes(userId))
        throw new HttpException(this.i18n.t('errors.AdminAlreadyExists'), 400);
    }
  }

  private channelCheckType(channel, types: string[]) {
    if (!types.includes(channel.type))
      throw new HttpException(
        this.i18n.t('errors.ChannelTypeOpNotAllowed'),
        400,
      );
  }

  async channelParticipantAdd(
    body: CHParticipantAddDto,
    req: any,
  ): Promise<Channel> {
    const { user } = req;
    const channel = await this.channelModel.findById(body.channelId);
    this.channelCheckValidAdminAccess(channel, user.userId);
    this.channelCheckType(channel, [CHANNEL_TYPE.CHANNEL_PRIVATE]);
    this.channelCheckParticipant(channel, body.participantId, false);

    channel.participants.push(body.participantId);
    await channel.save();
    await this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE);
    return channel;
  }

  async channelParticipantRemove(body: CHParticipantAddDto, req: any) {
    const { user } = req;
    const channel = await this.channelModel.findById(body.channelId);
    this.channelCheckValidAdminAccess(channel, user.userId);
    this.channelCheckType(channel, [CHANNEL_TYPE.CHANNEL_PRIVATE]);
    this.channelCheckParticipant(channel, body.participantId, true);

    channel.participants = channel.participants.filter(
      (item) => item != body.participantId,
    );
    const searchFilter = {
      _id: channel._id,
    };
    await channel.save();
    const aggregatedChannel = await this.channelAggregator(searchFilter);
    this.chatGateway.channelDelete(body.participantId, aggregatedChannel[0]);
    // this.chatGateway.channelDelete(body.participantId, channel);
    return aggregatedChannel[0];
  }

  async channelAdminAdd(body: CHAdminAddDto, req: any) {
    const { user } = req;
    const channel = await this.channelModel.findById(body.channelId);
    this.channelCheckValidAdminAccess(channel, user.userId);
    this.channelCheckType(channel, [
      CHANNEL_TYPE.CHANNEL_PRIVATE,
      CHANNEL_TYPE.CHANNEL_PUBLIC,
    ]);
    this.channelCheckAdmin(channel, body.adminId, false);

    channel.admins.push(body.adminId);
    await channel.save();
    await this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE);
    return channel;
  }

  async channelAdminRemove(body: CHAdminAddDto, req: any) {
    const { user } = req;
    const channel = await this.channelModel.findById(body.channelId);
    this.channelCheckValidAdminAccess(channel, user.userId);
    this.channelCheckType(channel, [
      CHANNEL_TYPE.CHANNEL_PRIVATE,
      CHANNEL_TYPE.CHANNEL_PUBLIC,
    ]);
    this.channelCheckAdmin(channel, body.adminId, true);

    channel.admins = channel.admins.filter((item) => item != body.adminId);
    await channel.save();
    await this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE);
    return channel;
  }

  async channelMessageAll(req: any, channelId: string) {
    const messages = await this.msgModel
      .aggregate([
        { $match: { channelId: new Types.ObjectId(channelId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender_data',
          },
        },
        { $unwind: '$sender_data' },
        { $sort: { createdAt: 1 } },
      ])
      .exec();
    return messages;
  }

  async channelMessageAdd(body: CHMessageAddDto, req: any) {
    const { user } = req;
    const channel = await this.channelModel.findById(body.channelId);

    // Only participant can add message except in public channel.
    if (channel.type !== CHANNEL_TYPE.CHANNEL_PUBLIC)
      this.channelCheckParticipant(channel, user.userId, true);

    const message = new this.msgModel({
      sender: user.userId,
      content: body.content,
      createdAt: new Date(),
      channelId: body.channelId,
      appId: user.appId,
    });

    // appId:'6270d77c6d1932f0bd9035e6'
    // appName:'Wincy'
    // exp:1659336651
    // iat:1654152651
    // teamId:'PAIRROXZ'
    // userAvatar:'https://wincy-bucket.s3.ap-south-1.amazonaws.com/Profile%20Pictures/f05d7390-2761-11ec-8741-952ccb7f6066.jpg'
    // userFirstName:'Pratik'
    // userId:'62909bc447e402f188e80ed1'
    // userLastName:'Purohit'
    // userReferenceId:'necixy@hotmail.com'

    await this.channelUnreadCountUpdate(channel, req.user);

    const result = await message.save();
    this.chatGateway.messageSent(body.channelId, {
      ...result['_doc'],
      sender_data: {
        _id: user.userId,
        appId: user.appId,
        referenceId: user.userReferenceId,
        teamId: user.teamId,
        avatar: user.userAvatar,
        firstName: user.userFirstName,
        lastName: user.userLastName,
      },
    });
    const content = {
      message: message.content,
    };
    const userPlayerIds = [];
    this.notifyService.sendNotification({ en: content.message }, userPlayerIds);

    return result;
  }

  async channelMessageRemove(body: CHMessageRemoveDto, req: any) {
    const { user } = req;
    const message = await this.msgModel.findById(body.messageId).lean();

    if (message == null) {
      throw new HttpException(this.i18n.t('errors.Invalid_Msg_Id'), 400);
    }

    // Only sender can delete the message.
    if (message.sender.toString() !== user.userId) {
      throw new HttpException(
        this.i18n.t('errors.Message_Delete_Sender_Err'),
        400,
      );
    }

    await this.msgModel.deleteOne({ id: body.messageId });
    return { deleted: true };
  }

  async channelUnreadCountUpdate(channel, user) {
    const tempChannel = channel;

    if (tempChannel?.participantsDetails?.length > 0) {
      tempChannel.participantsDetails.forEach((el: any) => {
        el.unread = el.id == user.userId ? 0 : (el.unread += 1);
      });
    } else {
      const tempDetails = tempChannel.participants.map((id) => ({
        id,
        unread: id == user.userId ? 0 : 1,
      }));
      tempChannel.participantsDetails = tempDetails;
    }

    const updatedChannel = await channel.update(tempChannel);

    const receivers = [];

    tempChannel.participantsDetails.forEach((el) => {
      if (el.id != user.userId) {
        receivers.push(el);
      }
    });

    const channelToSend = {
      _id: tempChannel._id,
      participantsDetails: tempChannel.participantsDetails,
    };

    this.chatGateway.channelListListener(
      channelToSend,
      EVENT_TYPE.COUNT,
      receivers,
    );

    return { updatedChannel, receivers };

    // this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE, receivers);
  }

  async readMessage(body: ChMessageDto, req: any) {
    const { channelId } = body;

    const { user } = req;
    const channel = await this.channelModel.findById(channelId);
    if (channel.type !== CHANNEL_TYPE.CHANNEL_PUBLIC)
      this.channelCheckParticipant(channel, user.userId, true);

    const tempChannel = channel;

    if (tempChannel?.participantsDetails?.length > 0) {
      tempChannel.participantsDetails.forEach((el: any) => {
        if (el.id == user.userId) {
          el.unread = 0;
        }
      });
    }
    const updatedChannel = await channel.update(tempChannel);
    const receivers = [{ id: user.userId }];
    this.chatGateway.channelListListener(
      tempChannel,
      EVENT_TYPE.COUNT,
      receivers,
    );
    // this.chatGateway.channelListListener(updatedChannel, EVENT_TYPE.COUNT);
    // this.channelUpdateListener(channel._id, EVENT_TYPE.UPDATE, receivers);

    return updatedChannel;
  }
}
