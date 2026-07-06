const mongoose = require("mongoose");
const env = require("./env");

const connectDatabase = async () => {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set. Skipping database connection.");
    return;
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
};

module.exports = connectDatabase;

