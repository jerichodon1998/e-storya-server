export const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

export const ENV = process.env.NODE_ENV;

export const isProduction = ENV === 'production';

export const isStaging = ENV === 'staging';

export const isDevelopment = ENV === 'development' || !ENV;

export * from './db';
export * from './services';
