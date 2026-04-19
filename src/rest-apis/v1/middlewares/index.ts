import { IUser } from '@src/shared/types';
import { encodedJwtSecret } from '@src/shared/constants';
import { CookieNamesEnum } from '@src/shared/enums';
import { FastifyReply, FastifyRequest } from 'fastify';
import jose from 'jose';
import { JOSEError } from 'jose/errors';
import { usersService } from '@src/lib';

/**
 * Verify JWT token middleware.
 *
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 * @return {Promise<void>}
 */
export async function verifyJwtToken(
	request: FastifyRequest,
	reply?: FastifyReply
): Promise<void> {
	const token = request.cookies?.[CookieNamesEnum.APP_USER_TOKEN_JWT];

	if (!token) {
		reply?.status(401);
		throw new Error('No token provided');
	}

	try {
		const { payload } = await jose.jwtVerify<IUser>(token, encodedJwtSecret);
		const { error, user } = await usersService.getUserById({
			userId: payload?._id || '',
		});

		if (error || !user) {
			reply?.status(500);
			throw new Error('User Error/Not Found');
		}

		request.user = user;
	} catch (error) {
		const joseError = error as JOSEError;
		console.log('error', joseError?.message);
		reply?.status(401);
		throw new Error('Invalid token');
	}
}
