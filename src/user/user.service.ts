import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { UtilsService } from '../utils/utils.service';
import { ConnectUserDto } from './dto/connect-user.dto';
import { AppInfo, TokenPayload, UserInfo } from './info.type';
import { User, UserDocument } from './schemas/user.schema';
// const crypto = require('crypto');

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly utilsSvc: UtilsService,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
  ) {}

  async findByRefId(referenceId: string, appId: string) {
    const user = await this.userModel.findOne({ referenceId, appId }).lean();
    if (user == null) {
      throw new HttpException(
        this.i18n.t('errors.Invalid_Ref_Id', { args: { referenceId } }),
        400,
      );
    }

    return user;
  }

  async connectUser(userData: ConnectUserDto, appInfo: AppInfo): Promise<any> {
    try {
      const user = await this.userModel.findOneAndUpdate(
        {
          teamId: userData.teamId,
          referenceId: userData.referenceId,
          appId: appInfo.appId,
        },
        {
          ...userData,
          appId: appInfo.appId,
        },
        { upsert: true, new: true },
      );

      const userInfo: UserInfo = {
        userId: user._id.toString(),
        teamId: user.teamId,
        userReferenceId: user.referenceId,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userAvatar: user.avatar,
      };

      return {
        userToken: this.createUserToken(appInfo, userInfo),
        user: { userId: user._id.toString() },
      };
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  async setUserCurrentChannel(req: any, channelId: any) {
    try {
      const { user } = req;
      await this.userModel.updateOne(
        { id: user.appId },
        { currentChannel: channelId },
      );

      return { message: 'updated' };
    } catch (error) {
      console.error('error', error);
      throw new HttpException(error.message, 400);
    }
  }

  async getAllUsers(req: any, teamId: string): Promise<Array<User>> {
    try {
      if (teamId == null)
        throw new HttpException(this.i18n.t('errors.Invalid_Team_Id'), 400);
      const { user } = req;
      const users = await this.userModel
        .find({
          appId: user.appId,
          teamId,
          referenceId: { $ne: String(user.userReferenceId) }, // Excluding the user who called the API.
        })
        .lean();
      return users;
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  private createUserToken(appInfo: AppInfo, userInfo: UserInfo): string {
    const payload: TokenPayload = { ...appInfo, ...userInfo };
    const token = this.jwtService.sign(payload);
    return token;
  }
}
