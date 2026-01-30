import express, { Router } from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";
import { createStorage } from "../../server/storage";
import session from "express-session";

const api = express();

api.use(express.json());
api.use(express.urlencoded({ extended: false }));

// Session configuration
api.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

const storage = createStorage();
registerRoutes(api, storage);

export const handler = serverless(api);
