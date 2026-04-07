const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

export { allowedOrigins };
export * from './db';
