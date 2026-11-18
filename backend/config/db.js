import mongoose from "mongoose";

// Connect to MongoDB Atlas when the server starts.
export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error(
      "MONGO_URI is missing. Add your MongoDB Atlas connection string to backend/.env"
    );
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      // Fail after 10 seconds instead of waiting for the 30-second default.
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

// After the first successful connection, Mongoose reconnects automatically.
// These logs help you notice when the connection drops or comes back.
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});
