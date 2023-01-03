import { Injectable, HttpException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { App, AppDocument } from './schemas/app.schema';
import { CreateAppDto } from './dto/create-app.dto';
import { UtilsService } from '../utils/utils.service';
import { I18nService } from 'nestjs-i18n';
const crypto = require('crypto');
@Injectable()
export class AppService {
  constructor(
    @InjectModel(App.name) private appModel: Model<AppDocument>,
    private readonly utilsSvc: UtilsService,
    private readonly i18n: I18nService,
  ) {}

  async findByApiKey(apiKey: string) {
    const app = await this.appModel.findOne({ apiKey }).lean();
    if (app == null) {
      throw new HttpException(this.i18n.t('errors.Invalid_API_Key'), 400);
    }

    return app;
  }

  async createApp(
    appData: CreateAppDto,
    customerId: any,
  ): Promise<AppDocument> {
    try {
      const existingApp = await this.appModel.findOne({
        name: appData.name,
        customerId,
      });
      if (existingApp != null) {
        throw new HttpException(
          this.i18n.t('errors.App_Name_Exists', {
            args: { appName: appData.name },
          }),
          400,
        );
      }
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const apiKey = await this.utilsSvc.hashPassword(randomBytes);
      const appModel = new this.appModel({
        ...appData,
        apiKey,
        customerId,
      });
      return await appModel.save();
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
