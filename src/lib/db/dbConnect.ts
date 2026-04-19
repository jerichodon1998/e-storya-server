import mongoose from 'mongoose';

/**
 * Initializes the Mongoose connection.
 * @return {Promise<void>}
 */
async function mongooseInit(): Promise<void> {
	try {
		await mongoose.connect(process.env.MONGODB_URI || '');
		console.log('mongooseInit()');
	} catch (error) {
		console.log('mongooseInit() error', error);
	}
}

export { mongooseInit };
