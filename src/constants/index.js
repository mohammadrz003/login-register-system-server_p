import { config } from "dotenv";

config();

// APP CONSTANTS
export const DB = process.env.APP_DB;
export const PORT = process.env.PORT || process.env.APP_PORT;
export const DOMAIN = process.env.APP_DOMAIN;
export const SECRET = process.env.APP_SECRET;
export const CLIENT_URL = process.env.APP_CLIENT_URL;

export const GOOGLE_CLIENT_ID = process.env.APP_GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.APP_GOOGLE_CLIENT_SECRET;
