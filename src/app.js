const cors = require("cors");
const express = require("express");
const env = require("./config/env");
const healthRoutes = require("./routes/healthRoutes");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to OnlineBooking API"
  });
});

app.use("/api/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

