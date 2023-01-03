import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { CHANNEL_TYPE, EVENT_TYPE, EVENT_TYPE_ENUM } from './channel.enum';
import { Channel } from './schemas/channel.schema';
import e from 'express';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    // this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('JOIN_ROOMS')
  joinRooms(client: Socket, payload: string): void {
    client.join(payload);
    // this.server.emit('JOIN_ROOMS', payload);
  }

  @SubscribeMessage('LEAVE_ROOM')
  leaveRooms(client: Socket, payload: string): void {
    client.leave(`CHANNEL-${payload}`);
    // this.server.emit('JOIN_ROOMS', payload);
  }

  @SubscribeMessage('JOIN_USER')
  joinUser(client: Socket, payload: string): void {
    client.join(payload);
  }

  @SubscribeMessage('JOIN_TEAM')
  joinTeam(client: Socket, payload: string): void {
    client.join(payload);
  }

  channelListListener(
    channel: any,
    type: EVENT_TYPE,
    eventReceivers?: Array<any>,
    event?: EVENT_TYPE_ENUM,
  ) {
    if (channel.type === CHANNEL_TYPE.CHANNEL_PUBLIC) {
      this.server
        .to(`TEAM-${channel.teamId}`)
        .emit(event ?? EVENT_TYPE_ENUM.CHANNEL_CHANGE, channel, type);
    } else {
      const participants = eventReceivers?.length
        ? eventReceivers
        : channel.participants;

      participants.forEach((element) => {
        const idToSend = element.id ?? element._id;
        this.server
          .to(`USER-${idToSend}`)
          .emit(event ?? EVENT_TYPE_ENUM.CHANNEL_CHANGE, channel, type);
      });
    }
  }

  channelDelete(id, channel) {
    this.server.to(`USER-${id}`).emit('CHANNEL_DELETE', channel);
    this.server.off(`CHANNEL-${channel._id}`, () => {
      console.log('channel listener removed');
    });
  }

  messageSent(channelId, message) {
    this.server.to(`CHANNEL-${channelId}`).emit('MESSAGE_RECEIVED', message);
  }

  // channelMessageCount() {}
}
