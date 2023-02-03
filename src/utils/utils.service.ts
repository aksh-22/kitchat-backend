import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as AWS from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import * as Jimp from 'jimp';
import * as im from 'imagemagick';
import * as sharp from 'sharp';

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

  async resizeImage(file) {
    return sharp(file.buffer)
      .resize({ width: 50, height: 50 })
      .toBuffer()
      .then((data) => {
        return data;
      });
  }

  async uploadFileS3(file, folder, details) {
    try {
      const { accessKeyId, secretAccessKey, bucketName, region } = details;
      const thumbBuffer = await this.resizeImage(file);
      file.buffer = thumbBuffer;

      const s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
      });

      let name = file.originalname.split('.');
      const ext = name[name.length - 1];
      name = uuidv1().concat('.', ext);
      const thumbName = `thumb-${name}`;
      const params = {
        Bucket: bucketName,
        Key: `${folder}/${name}`,
        Body: file.buffer,
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: region,
        },
        ACL: 'public-read',
      };
      const thumbParams = {
        Bucket: bucketName,
        Key: `${folder}/${thumbName}`,
        Body: file.buffer,
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: region,
        },
        ACL: 'public-read',
      };
      const { Location: original } = await s3.upload(params).promise();
      const { Location: thumbnail } = await s3.upload(thumbParams).promise();
      return { original, thumbnail };
    } catch (error) {
      console.error(error);
    }
  }

  async deleteFileS3(url, folder) {
    const accessKeyId = 'AKIAXY2LMJZNXKJLIUZU';

    const secretAccessKey = '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';

    const bucketName = 'kitchat-bucket';

    const s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });
    let name = url.split('/');
    name = name[name.length - 1];
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: `${folder}/${name}`,
      })
      .promise();
  }
}
