import { Injectable } from '@nestjs/common';
import { Keys } from './keys';

@Injectable()
export class ConfigService {
  static keys: Keys = new Keys();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
