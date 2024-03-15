import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbConnection = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.DATABASE_URL);
    console.log(
      `database connected to host ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection FAILED", error);
    process.exit(1);
  }
};
export default dbConnection;
