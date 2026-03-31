/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://127.0.0.1');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');

    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'products');
    this.publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://127.0.0.1:9000');

    this.s3 = new S3Client({
      endpoint: `${endpoint}:${port}`,
      region: 'us-east-1', // MinIO requires any region string
      forcePathStyle: true, // CRITICAL for MinIO — prevents AWS virtual-host URL style
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  // Auto-create bucket on startup if it doesn't already exist
  async onModuleInit() {
    await this.ensureBucketExists(this.bucket);
  }

  private async ensureBucketExists(bucketName: string) {
    try {
      // Check if bucket already exists
      await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      this.logger.log(`Bucket "${bucketName}" already exists.`);
    } catch {
      // Bucket doesn't exist — create it
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        this.logger.log(`Bucket "${bucketName}" created.`);

        // Set bucket to public-read so frontend can render images directly
        const publicPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucketName}/*`,
            },
          ],
        };
        await this.s3.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(publicPolicy),
          }),
        );
        this.logger.log(`Bucket "${bucketName}" set to public-read.`);
      } catch (err) {
        this.logger.error(`Failed to create bucket "${bucketName}":`, err);
      }
    }
  }

  /**
   * Upload a file to MinIO.
   * @param file - Multer file object
   * @param folder - Optional subfolder prefix e.g. 'products' or 'categories'
   * @returns Full public URL of the uploaded image
   */
  async uploadFile(file: Express.Multer.File, folder = 'products'): Promise<string> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  /**
   * Delete a file from MinIO by its full URL.
   * @param fileUrl - Full public URL of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the key from the full URL
      const urlPath = new URL(fileUrl).pathname;
      // pathname looks like /products/products/uuid.jpg
      // we need to strip the leading /bucket-name/ to get the key
      const key = urlPath.replace(`/${this.bucket}/`, '');

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file: ${key}`);
    } catch (err) {
      this.logger.warn(`Could not delete file ${fileUrl}:`, err);
    }
  }
}
