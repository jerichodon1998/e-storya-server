import bcrypt from 'bcrypt';
import { User } from '@lib/db';
import mongoose, {
	HydratedDocument,
	isValidObjectId,
	ObjectId,
} from 'mongoose';
import { SignUpMethodEnum } from '@src/shared/enums';
import { IUser } from '@src/shared/types';

class UsersService {
	async signinWithEmailAndPassword(params: {
		email: string;
		password: string;
		session?: mongoose.mongo.ClientSession;
		shouldThrowError?: boolean;
	}): Promise<{ user?: Omit<IUser, 'password'> | null; error?: any }> {
		const {
			email,
			password,
			shouldThrowError = false,
			session = undefined,
		} = params;
		const fetchedUser = await User.findOne({ email }, null, {
			...(session && { session }),
		}).select('+password');

		if (!fetchedUser) {
			if (shouldThrowError) {
				throw new Error('User not found.');
			}

			return { error: 'User not found.' };
		}

		if (!fetchedUser.password) {
			if (shouldThrowError) {
				throw new Error("User didn't sign up with password.");
			}

			return { error: "User didn't sign up with password." };
		}

		// compare passwords
		const isPasswordCorrect = await bcrypt.compare(
			password,
			fetchedUser.password
		);

		if (!isPasswordCorrect) {
			if (shouldThrowError) {
				throw new Error('Incorrect credentials combination.');
			}

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
		session?: mongoose.mongo.ClientSession;
		shouldThrowError?: boolean;
	}): Promise<{
		user?: Omit<IUser, 'password'> | null;
		error?: any;
	}> {
		const {
			username,
			password,
			email,
			method,
			shouldThrowError = false,
			session = undefined,
		} = params;
		let userData: IUser | null = null;

		if (method === SignUpMethodEnum.EMAIL) {
			if (!password.trim()) {
				if (shouldThrowError) {
					throw new Error('Password cannot be empty.');
				}

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
				if (shouldThrowError) {
					throw error;
				}

				console.log('error', error);
				return { error };
			}
		}
		// TODO: Google Signup

		return { user: userData };
	}

	async getUserById(params: {
		userId: string | ObjectId;
		session?: mongoose.mongo.ClientSession;
		shouldThrowError?: boolean;
	}): Promise<{
		user?: Omit<HydratedDocument<IUser>, 'password'> | null;
		error?: any;
	}> {
		const { userId, shouldThrowError = false, session = undefined } = params;

		if (!isValidObjectId(userId)) {
			if (shouldThrowError) {
				throw new Error('Invalid userId');
			}

			return { error: 'Invalid userId' };
		}

		try {
			const user = await User.findOne({ _id: userId, deletedAt: null }, null, {
				...(session && { session }),
			});

			if (!user) {
				if (shouldThrowError) {
					throw new Error('User not found.');
				}

				return { error: 'User not found.' };
			}

			const parsedUserToObject = user.toObject();
			delete parsedUserToObject.password; // remove password from response

			return { user };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}
}

const usersService = new UsersService();

export { usersService };
