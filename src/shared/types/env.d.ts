declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production' | 'staging';
		PORT: number;
		MONGODB_URI: string;
		JWT_SECRET: string;
		COOKIE_SIGNATURE: string;
	}
}
