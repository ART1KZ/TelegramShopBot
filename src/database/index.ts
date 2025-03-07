import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectToDatabase;
