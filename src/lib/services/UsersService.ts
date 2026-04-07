import bcrypt from 'bcrypt';
import { IUser, SignUpMethodEnum } from '../types';
import { User } from '../db';

class UsersService {
	async signinWithEmailAndPassword(params: {
		email: string;
		password: string;
	}): Promise<{ user?: Omit<IUser, 'password'> | null; error?: any }> {
		const { email, password } = params;
		const fetchedUser = await User.findOne({ email }).select('+password');

		if (!fetchedUser) {
			return { error: 'User not found.' };
		}

		if (!fetchedUser.password) {
			return { error: "User didn't sign up with password." };
		}

		// compare passwords
		const isPasswordCorrect = await bcrypt.compare(
			password,
			fetchedUser.password
		);

		if (!isPasswordCorrect) {
			return { error: 'Incorrect credentials combination.' };
		}

		const parsedUserToObject = fetchedUser.toObject();
		delete parsedUserToObject.password; // remove password from response

		return { user: parsedUserToObject };
	}

	async createNewUser(params: {
		username: string;
		password: string;
		email: string;
		method: SignUpMethodEnum;
	}): Promise<{
		user?: Omit<IUser, 'password'> | null;
		error?: any;
	}> {
		const { username, password, email, method } = params;
		let userData: IUser | null = null;

		if (method === SignUpMethodEnum.EMAIL) {
			if (!password.trim()) {
				return { error: 'Password cannot be empty.' };
			}

			try {
				await bcrypt
					.hash(password, 10)
					.then(async (hash) => {
						const newUser = await User.insertOne({
							username,
							password: hash,
							email,
						});

						userData = newUser.toObject();
						delete userData.password;
					})
					.catch((err) => {
						throw err;
					});
			} catch (error) {
				console.log('error', error);
				return { error };
			}
		}
		// TODO: Google Signup

		return { user: userData };
	}
}

const usersService = new UsersService();

export { usersService, SignUpMethodEnum };
