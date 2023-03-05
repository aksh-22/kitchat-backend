import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as AWS from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
// import * as Jimp from 'jimp';
// import * as im from 'imagemagick';
import * as sharp from 'sharp';
import { s3DetailsDto } from './dto/s3-details.dto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as thumbsupply from 'thumbsupply';

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

  getFileType = (file: any) => {
    console.log('file', file);
    if (file.mimetype.match('image.*')) return 'image';

    if (file.mimetype.match('video.*')) return 'video';

    if (file.mimetype.match('audio.*')) return 'audio';
  };

  async getThumbBuffer(file, ext) {
    const fileType: 'image' | 'video' | 'audio' = this.getFileType(file);

    console.log('fileType', fileType);

    switch (fileType) {
      case 'image':
        return sharp(file.buffer)
          .resize({ width: 50, height: 50 })
          .toBuffer()
          .then((data) => {
            return data;
          });

      case 'video':
        thumbsupply.generateThumbnail(file).then((thumb) => {
          // serve thumbnail
          console.log('thumb', thumb);
        });
      // new ffmpeg({
      //   source: stream.Readable.from(request.file.buffer, {
      //     objectMode: false,
      //   }),
      // })
      //   .withSize('320x240')
      //   .on('error', function (err) {
      //     console.log('An error occurred: ' + err.message);
      //   })
      //   .on('end', function (filenames) {
      //     console.log('Successfully generated ' + filenames.join(', '));
      //   })
      //   .takeScreenshots(5, './');

      // process(file)
      //   .output('screenshot.png')
      //   .noAudio()
      //   .seek('3:00')

      //   .output('small.avi')
      //   .audioCodec('copy')
      //   .size('320x200')

      //   .output('big.avi')
      //   .audioCodec('copy')
      //   .size('640x480')

      //   .on('error', function (err) {
      //     console.log('An error occurred: ' + err.message);
      //   })
      //   .on('end', function () {
      //     console.log('Processing finished !');
      //   })
      //   .run();

      // process(file).screenShot();

      // console.log('process', process);

      // process.then((video) => {
      //   const ss = video.fnExtractFrameToJPG('/', {
      //     frame_rate: 1,
      //     number: 5,
      //     file_name: 'my_frame_%t_%s',
      //   });
      //   // console.log('ss',ss);
      // });

      default:
        break;
    }
  }

  // async getThumbBuffer(){}

  async createParam(bucketName, folder, region, file) {
    let name = file.originalname.split('.');
    const ext = name[name.length - 1];
    name = uuidv1().concat('.', ext);
    const thumbName = `thumb-${name}`;

    const thumbBuffer = await this.getThumbBuffer(file, ext);
    return {
      thumbParams: {
        Bucket: bucketName,
        Key: `${folder}/${thumbName}`,
        Body: thumbBuffer,
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: region,
        },
        ACL: 'public-read',
      },
      originalParams: {
        Bucket: bucketName,
        Key: `${folder}/${name}`,
        Body: file.buffer,
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: region,
        },
        ACL: 'public-read',
      },
    };
  }

  async uploadFileS3(file, folder, details: s3DetailsDto) {
    try {
      const { accessKeyId, secretAccessKey, bucketName, region } = details;

      const s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
      });

      const { originalParams, thumbParams } = await this.createParam(
        bucketName,
        folder,
        region,
        file,
      );

      const { Location: original } = await s3.upload(originalParams).promise();
      const { Location: thumbnail } = await s3.upload(thumbParams).promise();
      return { original, thumbnail };
    } catch (error) {
      console.error(error);
    }
  }

  async deleteFileS3(url, folder, details: s3DetailsDto) {
    const { accessKeyId, bucketName, secretAccessKey } = details;

    const s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });
    let name = url.split('/');
    name = name[name.length - 1];
    const thumbName = `thumb-${name}`;
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: `${folder}/${name}`,
      })
      .promise();

    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: `${folder}/${thumbName}`,
      })
      .promise();
  }
}
