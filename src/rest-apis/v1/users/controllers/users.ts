import { SignUpMethodEnum, usersService } from '@/lib';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function userSignInController(
	request: FastifyRequest<{
		Body: {
			email: string;
			password: string;
		};
	}>,
	reply: FastifyReply
) {
	const { email, password } = request.body;
	const userCredentials = await usersService.signinWithEmailAndPassword({
		email: email,
		password: password,
	});

	if (!userCredentials.user) {
		reply.status(401).send({ error: userCredentials.error });
	}

	reply.status(200).send(userCredentials.user);
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
) {
	const { username, password, email } = request.body;

	try {
		const { error, user } = await usersService.createNewUser({
			username,
			password,
			email,
			method: SignUpMethodEnum.EMAIL,
		});

		if (!user || error) {
			reply.status(500).send({ error });
			return;
		}

		reply.status(200).send(user);
	} catch (error) {
		console.log('error', error);
		reply.status(500).send({ error });
	}
}
