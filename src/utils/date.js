import { env } from "../config/env.js";

const dateFormatter = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: env.businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

export const getTodayDateString = () => dateFormatter().format(new Date());

export const addDaysToDateString = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const isTodayOrFutureDate = (dateString) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && dateString >= getTodayDateString();
};

export const isFutureSlotTime = (dateString, timeString) => {
  if (!isTodayOrFutureDate(dateString)) return false;
  if (dateString > getTodayDateString()) return true;

  const now = new Date();
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: env.businessTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);

  return timeString > currentTime;
};
