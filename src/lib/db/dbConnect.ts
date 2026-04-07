import mongoose from 'mongoose';

async function mongooseInit() {
	try {
		await mongoose.connect(process.env.MONGODB_URI || '');
		console.log('mongooseInit()');
	} catch (error) {
		console.log('mongooseInit() error', error);
	}
}

export { mongooseInit };
