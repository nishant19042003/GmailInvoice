import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import FileStoreFactory from "session-file-store"; // session persistence

import { isInvoiceEmail } from "./methods/Filter.js";
import { parseEmail } from "./methods/emailparse.js";
import fs from "fs";
dotenv.config();
const app = express();
// Make sure sessions folder exists
if (!fs.existsSync("./sessions")) {
  fs.mkdirSync("./sessions");
}
// ---------- FILE-BASED SESSION STORE ----------
const FileStore = FileStoreFactory(session);

// ---------- CORS ----------
app.use(
  cors({
    origin: "http://localhost:5173", // frontend
    credentials: true,               // allow cookies
  })
);

// ---------- SESSION ----------
app.use(
  session({
    store: new FileStore({
      path: "./sessions",
      retries: 1,
    }),
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,   // ✅ dev only (set true in production with HTTPS)
      httpOnly: true,
      sameSite: "lax", // ✅ works in localhost
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ---------- OAUTH2 ----------
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

app.get("/email/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens; // ✅ save in session
    res.redirect("http://localhost:5173?auth=success");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

// ---------- HELPER TO GET EMAIL BODY ----------
function getBody(payload) {
  let body = "";
  if (payload.parts) {
    for (let part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body += Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.mimeType === "text/html" && part.body?.data) {
        body += Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.parts) {
        body += getBody(part);
      }
    }
  } else if (payload.body?.data) {
    body += Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  return body;
}

// ---------- FETCH EMAILS ----------
app.get("/email/emails", async (req, res) => {
  if (!req.session.tokens) return res.status(401).send("Not logged in");

  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    const messages = list.data.messages || [];
    const results = [];

    for (let m of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "full",
      });

      // keep your filter as is
      if (!isInvoiceEmail(msg.data)) continue;

      const emailBody = getBody(msg.data.payload);

      // keep your parser as is
      results.push(parseEmail(emailBody));
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching emails:", err);
    res.status(500).send("Error fetching emails");
  }
});

app.listen(3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);

