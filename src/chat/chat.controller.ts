import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CHCreatePvtDto } from './dto/ch-create-pvt.dto';
import { CHCreateDirectDto } from './dto/ch-create-direct.dto';
import { CHPatchDto } from './dto/ch-patch.dto';
import { CHParticipantAddDto } from './dto/ch-participant-add.dto';
import { CHAdminAddDto } from './dto/ch-admin-add.dto';
import { CHMessageAddDto } from './dto/ch-msg-add.dto';
import { CHMessageRemoveDto } from './dto/ch-msg-remove.dto';
import { ChatAuthGuard } from './chat-jwt-auth.guard';
import { ChMessageDto } from './dto/cha-message.dto';
import { CHMessageUpdateDto } from './dto/ch-msg-update.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CHUploadAttachments } from './dto/upload-attachments.dto';

@Controller('chat')
export class ChatController {
  constructor(private chatSvc: ChatService) {}

  @Get('channel/')
  @UseGuards(ChatAuthGuard)
  async channelGetAll(@Request() req, @Query('teamId') teamId) {
    return this.chatSvc.channelGetAll(req, teamId);
  }

  @Get('channel/:id')
  @UseGuards(ChatAuthGuard)
  async channelGetById(@Request() req, @Param('id') id) {
    return this.chatSvc.channelGetById(req, id);
  }

  @Patch('channel/:id')
  @UseGuards(ChatAuthGuard)
  async channelUpdate(
    @Body() body: CHPatchDto,
    @Request() req,
    @Param('id') id,
  ) {
    return this.chatSvc.channelUpdate(body, req, id);
  }

  @Post('channel/create/private')
  @UseGuards(ChatAuthGuard)
  async createChannelPvt(@Body() body: CHCreatePvtDto, @Request() req) {
    return this.chatSvc.channelCreatePvt(body, req);
  }

  @Patch('channel/mute/:channelId')
  @UseGuards(ChatAuthGuard)
  async channelMuteHandler(@Request() req, @Param('channelId') channelId) {
    return this.chatSvc.channelMuteHandler(req, channelId);
  }

  @Post('channel/create/public')
  @UseGuards(ChatAuthGuard)
  async channelCreatePublic(@Body() body: CHCreatePvtDto, @Request() req) {
    return this.chatSvc.channelCreatePublic(body, req);
  }

  @Post('channel/create/direct')
  @UseGuards(ChatAuthGuard)
  async channelCreateDirect(@Body() body: CHCreateDirectDto, @Request() req) {
    return this.chatSvc.channelCreateDirect(body, req);
  }

  @Delete('channel/delete/:channelId')
  @UseGuards(ChatAuthGuard)
  async deleteChannel(@Param('channelId') channelId, @Request() req) {
    return this.chatSvc.deleteChannel(req, channelId);
  }

  @Post('channel/participant/add')
  @UseGuards(ChatAuthGuard)
  async channelParticipantAdd(
    @Body() body: CHParticipantAddDto,
    @Request() req,
  ) {
    return this.chatSvc.channelParticipantAdd(body, req);
  }

  @Post('channel/participant/remove')
  @UseGuards(ChatAuthGuard)
  async channelParticipantRemove(
    @Body() body: CHParticipantAddDto,
    @Request() req,
  ) {
    return this.chatSvc.channelParticipantRemove(body, req);
  }

  @Post('channel/admin/add')
  @UseGuards(ChatAuthGuard)
  async channelAdminAdd(@Body() body: CHAdminAddDto, @Request() req) {
    return this.chatSvc.channelAdminAdd(body, req);
  }

  @Post('channel/admin/remove')
  @UseGuards(ChatAuthGuard)
  async channelAdminRemove(@Body() body: CHAdminAddDto, @Request() req) {
    return this.chatSvc.channelAdminRemove(body, req);
  }

  @Get('channel/:channelId/messages')
  @UseGuards(ChatAuthGuard)
  async channelMessageAll(@Request() req, @Param('channelId') channelId) {
    return this.chatSvc.channelMessageAll(req, channelId);
  }

  @Post('channel/message/add')
  @UseGuards(ChatAuthGuard)
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: { fileSize: 10 * 1000 * 1000 },
    }),
  )
  async channelMessageAdd(
    @Body() body: CHMessageAddDto,
    @Request() req,
    @UploadedFiles() attachments,
  ) {
    return this.chatSvc.channelMessageAdd(body, req, attachments);
  }

  @Post('channel/message/remove')
  @UseGuards(ChatAuthGuard)
  async channelMessageRemove(@Body() body: CHMessageRemoveDto, @Request() req) {
    return this.chatSvc.channelMessageRemove(body, req);
  }

  @Post('channel/message/update')
  @UseGuards(ChatAuthGuard)
  async channelMessageUpdate(@Body() body: CHMessageUpdateDto, @Request() req) {
    return this.chatSvc.channelMessageUpdate(body, req);
  }

  @Delete('message/delete/:channelId/:messageId')
  @UseGuards(ChatAuthGuard)
  async deleteMessage(
    @Param('messageId') messageId,
    @Param('channelId') channelId,
    @Request() req,
  ) {
    return this.chatSvc.channelMessageDelete(channelId, messageId, req);
  }

  @Post('channel/message/read')
  @UseGuards(ChatAuthGuard)
  async channelMessageRead(@Body() body: ChMessageDto, @Request() req) {
    return this.chatSvc.readMessage(body, req);
  }

  @Post('channel/message/upload/attachment')
  @UseGuards(ChatAuthGuard)
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: { fileSize: 10 * 1000 * 1000 },
    }),
  )
  async uploadAttachments(
    @Body() body: CHUploadAttachments,
    @Request() req,
    @UploadedFiles() attachments,
  ) {
    return this.chatSvc.uploadAttachments({ attachments }, req);
  }
}
