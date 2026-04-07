import mongoose, { Model } from 'mongoose';
import emailValidator from 'email-validator';
import bcrypt from 'bcrypt';

interface IUser {
	_id: mongoose.Schema.Types.ObjectId;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	password?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

interface IUserMethods extends Model<IUser> {
	createNewUser: (params: {
		username: string;
		password: string;
		email: string;
		method: SignUpMethodEnum;
	}) => Promise<{
		user?: Omit<IUser, 'password'>;
		error?: any;
	}>;
	signinWithEmailAndPassword: (params: {
		email: string;
		password: string;
	}) => Promise<{ user?: Omit<IUser, 'password'> | null; error?: any }>;
}

enum SignUpMethodEnum {
	EMAIL = 'email',
	GOOGLE = 'google',
}

const userSchema = new mongoose.Schema<IUser, IUserMethods>(
	{
		_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			default: () => new mongoose.Types.ObjectId(),
		},
		email: {
			type: String,
			validate: {
				validator: function (email) {
					return emailValidator.validate(email);
				},
				message: 'Invalid Email Address',
			},
			trim: true,
			required: true,
		},
		username: { type: String, required: true, unique: true, trim: true },
		firstName: { type: String, trim: true },
		lastName: { type: String, trim: true },
		password: { type: String, select: false, trim: true },
		createdAt: { type: Date, required: true, default: () => Date.now() },
		updatedAt: { type: Date },
		deletedAt: { type: Date },
	},
	{
		statics: {
			createNewUser: async function (params: {
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
			},
			signinWithEmailAndPassword: async function (params: {
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
			},
		},
	}
);

const User = mongoose.model<IUser, IUserMethods>('User', userSchema);

export { User, type IUser, SignUpMethodEnum };
