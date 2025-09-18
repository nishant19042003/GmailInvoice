// backend/app.js
import express from "express";
import session from "express-session";
import cors from "cors";
import { google } from "googleapis";
import dotenv, { parse } from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(session({
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
}));

// Setup OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// Step 1: Redirect user to Google login
app.get("/email/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });
  res.redirect(url);
});

// Step 2: Google redirects here with code
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const { tokens } = await oauth2Client.getToken(code);
  req.session.tokens = tokens;  // Save tokens in session

  res.redirect("http://localhost:5173?auth=success");
});
import { isInvoiceEmail } from './methods/Filter.js';
import {parseEmail} from './methods/emailparse.js';

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

// Step 3: Fetch emails
app.get("/email/emails", async (req, res) => {
  if (!req.session.tokens) return res.status(401).send("Not logged in");

  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
    const messages = list.data.messages || [];

    const results = [];
    for (let m of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "full",
      });
      if (!isInvoiceEmail(msg.data)) continue; // Filter non-invoice emails
     //i want full email body to be parsed
      const emailBody = getBody(msg.data.payload);
      const parsedData = parseEmail(emailBody);

      results.push(parsedData);
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching emails");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
