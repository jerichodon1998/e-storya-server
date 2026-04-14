import { usersService } from '@src/lib';
import { encodedJwtSecret } from '@src/shared/constants';
import { CookieNamesEnum, SignUpMethodEnum } from '@src/shared/enums';
import { IUser } from '@src/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import jose from 'jose';

export async function userSignInController(
	request: FastifyRequest<{
		Body: {
			email: string;
			password: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	user?: Omit<IUser, 'password'> | null | undefined;
	message?: any;
	token?: string;
	error?: any;
}> {
	const { email, password } = request.body;
	const origin = URL.parse(request.headers.origin || '');

	const userCredentials = await usersService.signinWithEmailAndPassword({
		email: email,
		password: password,
	});

	if (!userCredentials.user) {
		reply.status(401);
		return { message: userCredentials.error };
	}

	const tokenExpiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1hr
	let token = '';
	try {
		token = await new jose.SignJWT(userCredentials.user)
			.setExpirationTime(tokenExpiryDate)
			.setProtectedHeader({ alg: 'HS256' })
			.sign(encodedJwtSecret);
	} catch (error: any) {
		reply.status(500);
		return {
			message: error?.message?.toString() || 'Something went wrong',
			error,
		};
	}

	if (origin?.hostname) {
		console.log('set cookie');
		reply.setCookie(CookieNamesEnum.APP_USER_TOKEN_JWT, token, {
			path: '/',
			secure: true,
			httpOnly: true,
			sameSite: 'lax',
			expires: tokenExpiryDate,
		});
	}

	reply.status(200);
	return { user: userCredentials.user, ...(!origin && { token }) };
}

export async function userSignUpController(
	request: FastifyRequest<{
		Body: {
			username: string;
			password: string;
			email: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	message?: string;
	error?: any;
}> {
	const { username, password, email } = request.body;

	const { error, user } = await usersService.createNewUser({
		username,
		password,
		email,
		method: SignUpMethodEnum.EMAIL,
	});

	if (!user || error) {
		reply.status(500);
		return {
			message: error?.message?.toString() || 'Something went wrong',
			error,
		};
	}

	reply.status(200);
	return { message: 'Ok' };
}

export async function getSignedInUserController(
	request: FastifyRequest,
	reply: FastifyReply
): Promise<{
	user?: Omit<IUser, 'password'> | undefined;
	message?: string;
	error?: any;
}> {
	const userId = request.user?._id;

	if (!userId) {
		reply.status(401);
		return { error: 'No userId provided' };
	}

	try {
		const { user, error } = await usersService.getUserById({ userId });

		if (error) {
			reply.status(500);
			return { error };
		}

		const parsedUserToObject = user?.toObject();
		delete parsedUserToObject?.password; // remove password from response

		reply.status(200);
		return { user: parsedUserToObject };
	} catch (error) {
		reply.status(500);
		return { error };
	}
}
