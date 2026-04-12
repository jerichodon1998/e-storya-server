const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const ENV = process.env.NODE_ENV;

const isProduction = ENV === 'production';

const isStaging = ENV === 'staging';

const isDevelopment = ENV === 'development' || !ENV;

export { allowedOrigins, isProduction, isStaging, isDevelopment };
export * from './db';
export * from './services';
export * from './types';
