import mongoose from 'mongoose';

let isConnectedToDb = false;

export const connectToDb = () => {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) return console.log('no mongo uri');

  if (isConnectedToDb) return console.log('already connected to db');

  try {
    mongoose.connect(process.env.MONGODB_URI!);
    isConnectedToDb = true;
    console.log('successfully connected to mongo');
  } catch (error) {
    console.log(error);
  }
};
