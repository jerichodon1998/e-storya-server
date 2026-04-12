import { IUser } from '@/lib';
import { encodedJwtSecret } from '@/shared/constants';
import { CookieNamesEnum } from '@/shared/enums';
import { FastifyReply, FastifyRequest } from 'fastify';
import jose from 'jose';
import { JOSEError } from 'jose/errors';

export async function verifyJwtToken(
	request: FastifyRequest,
	reply?: FastifyReply
) {
	const token = request.cookies?.[CookieNamesEnum.APP_USER_TOKEN_JWT];

	if (!token) {
		reply?.status(401);
		throw new Error('No token provided');
	}

	try {
		const { payload } = await jose.jwtVerify<IUser>(token, encodedJwtSecret);
		request.user = payload;
	} catch (error) {
		const joseError = error as JOSEError;
		console.log('error', joseError?.message);
		reply?.status(401);
		throw new Error('Invalid token');
	}
}
