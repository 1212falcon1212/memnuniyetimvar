import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9002',
  region: process.env.S3_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'memnuniyetimvar',
  accessKeyId: process.env.S3_ACCESS_KEY || 'memnuniyetimvar',
  secretAccessKey: process.env.S3_SECRET_KEY || 'memnuniyetimvar_dev',
  forcePathStyle: true,
}));
