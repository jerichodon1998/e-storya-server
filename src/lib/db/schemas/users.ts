import mongoose from 'mongoose';
import emailValidator from 'email-validator';
import { IUser } from '@src/shared/types';
import { CollectionNamesEnum } from '@src/shared/enums';

const userSchema = new mongoose.Schema<IUser>(
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
			unique: true,
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
		toObject: {
			transform: function (doc, ret) {
				ret._id = ret._id.toString();
				return ret;
			},
		},
	}
);

const User = mongoose.model<IUser>(
	CollectionNamesEnum.USERS,
	userSchema,
	CollectionNamesEnum.USERS
);

export { User };
