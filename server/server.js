import crypto from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";

dotenv.config();

const {
  PORT = 3000,
  FRONTEND_URL,
  BACKEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  COOKIE_SECRET,
} = process.env;

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const COOKIE_NAME = "calendar_session";
const isProduction = process.env.NODE_ENV === "production";

if (!FRONTEND_URL || !BACKEND_URL || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !COOKIE_SECRET) {
  throw new Error("Missing required environment variables. Copy .env.example and fill the values.");
}

if (COOKIE_SECRET.length < 32) {
  throw new Error("COOKIE_SECRET must be at least 32 characters.");
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL.replace(/\/+$/, "")}/auth/callback`
);

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/auth/google", (_request, response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  response.redirect(url);
});

app.get("/auth/callback", async (request, response, next) => {
  try {
    const { code } = request.query;
    if (!code || typeof code !== "string") {
      response.status(400).send("Missing authorization code.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      response.status(400).send("Google did not return a refresh token. Revoke app access and try again.");
      return;
    }

    setSessionCookie(response, {
      refreshToken: tokens.refresh_token,
      createdAt: Date.now(),
    });
    response.redirect(FRONTEND_URL);
  } catch (error) {
    next(error);
  }
});

app.get("/auth/status", (request, response) => {
  response.json({ authenticated: Boolean(readSession(request)) });
});

app.post("/auth/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

app.get("/api/calendar", async (request, response, next) => {
  try {
    const calendar = getCalendarClient(request);
    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: String(request.query.timeMin || new Date().toISOString()),
      timeMax: String(request.query.timeMax || getDefaultTimeMax()),
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: "startTime",
    });
    response.json(result.data.items || []);
  } catch (error) {
    next(error);
  }
});

app.post("/api/calendar", async (request, response, next) => {
  try {
    const calendar = getCalendarClient(request);
    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: request.body,
    });
    response.status(201).json(result.data);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/calendar/:eventId", async (request, response, next) => {
  try {
    const calendar = getCalendarClient(request);
    const result = await calendar.events.update({
      calendarId: "primary",
      eventId: request.params.eventId,
      requestBody: request.body,
    });
    response.json(result.data);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/calendar/:eventId", async (request, response, next) => {
  try {
    const calendar = getCalendarClient(request);
    await calendar.events.delete({
      calendarId: "primary",
      eventId: request.params.eventId,
    });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  const status = error.status || error.code || 500;
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  response.status(safeStatus).json({
    error: safeStatus === 401 ? "Authentication required." : "Calendar backend error.",
  });
});

app.listen(PORT, () => {
  console.log(`Calendar backend listening on ${PORT}`);
});

function getCalendarClient(request) {
  const session = readSession(request);
  if (!session?.refreshToken) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: session.refreshToken });
  return google.calendar({ version: "v3", auth: client });
}

function getDefaultTimeMax() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function readSession(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const value = cookies[COOKIE_NAME];
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decrypt(value));
  } catch {
    return null;
  }
}

function setSessionCookie(response, session) {
  response.cookie(COOKIE_NAME, encrypt(JSON.stringify(session)), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 180,
    path: "/",
  });
}

function clearSessionCookie(response) {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

function encrypt(value) {
  const key = getCookieKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decrypt(value) {
  const data = Buffer.from(value, "base64url");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getCookieKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function getCookieKey() {
  return crypto.createHash("sha256").update(COOKIE_SECRET).digest();
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        return [decodeURIComponent(item.slice(0, index)), decodeURIComponent(item.slice(index + 1))];
      })
  );
}
