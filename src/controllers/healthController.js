const mongoose = require("mongoose");
const { sendSuccess } = require("../utils/apiResponse");

const getHealth = (req, res) => {
  const databaseStates = ["disconnected", "connected", "connecting", "disconnecting"];

  return sendSuccess(res, "API is running", {
    service: "OnlineBooking API",
    environment: process.env.NODE_ENV || "development",
    database: databaseStates[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};

