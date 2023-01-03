import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppService } from '../app/app.service';
import { I18nService } from 'nestjs-i18n';
import { AppInfo } from './info.type';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly appSvc: AppService,
    private readonly i18n: I18nService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey == null || apiKey == '') {
      throw new HttpException(this.i18n.t('errors.Missing_API_Key'), 400);
    }
    const app = await this.appSvc.findByApiKey(apiKey.toString());

    const appInfo: AppInfo = {
      appId: app._id.toString(),
      appName: app.name,
    };
    req['x-app-info'] = appInfo;
    next();
  }
}
