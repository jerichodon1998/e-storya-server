export const encodedJwtSecret = new TextEncoder().encode(
	process.env.JWT_SECRET || ''
);
