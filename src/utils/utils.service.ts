import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_OR_ROUNDS = 10;

@Injectable()
export class UtilsService {
  async hashPassword(password: string) {
    return await bcrypt.hash(password, SALT_OR_ROUNDS);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
