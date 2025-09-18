// import {google} from 'googleapis';
// import 'dotenv/config';

// //here we set up OAuth2 client
// const oauth2Client = new google.auth.OAuth2(
//   process.env.CLIENT_ID,
//   process.env.CLIENT_SECRET,
//   process.env.REDIRECT_URI
// );
// // Scopes for Gmail read-only access
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// import { parseEmail } from '../methods/emailparse.js';
// import { isInvoiceEmail } from '../methods/Filter.js';

// export const AppAuth = async (req, res) => {
//     const url = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//     prompt: 'consent'
//   });
//   console.log("Redirecting to:", url);
//   res.redirect(url);
// };
// export const oauth2callback=async (req, res) => {
//   const code = req.query.code;
//   if (!code) return res.status(400).send("Missing code");

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     req.session.tokens = tokens;
//     res.redirect("http://localhost:5173?auth=success");

//   } catch (err) {
//     console.error(err);
//     res.redirect("http://localhost:5173");
//   }
// };
// function getBody(payload) {
//   let body = "";
//   if (payload.parts) {
//     for (let part of payload.parts) {
//       if (part.mimeType === "text/plain") {
//         body = Buffer.from(part.body.data, "base64").toString("utf-8");
//       } else if (part.parts) {
//         body += getBody(part);
//       }
//     }
//   } else if (payload.body?.data) {
//     body = Buffer.from(payload.body.data, "base64").toString("utf-8");
//   }
//   return body;
// }

// export const getEmails = async (req, res) => {
//   if (!req.session.tokens) return res.redirect("/email/auth");
//   oauth2Client.setCredentials(req.session.tokens);
//   const gmail = google.gmail({ version: "v1", auth: oauth2Client });

//   try {
//     const list = await gmail.users.messages.list({
//       userId: "me",
//       maxResults: 10,
//     });

//     const messages = list.data.messages || [];
//     const results = [];

//     for (let m of messages) {
//       const msg = await gmail.users.messages.get({
//         userId: "me",
//         id: m.id,
//         format: "full",
//       });

//       if (!isInvoiceEmail(msg.data)) continue;

//       // ✅ Extract full email body (not just snippet)
//       const bodyText = getBody(msg.data.payload);

//       const r1 = parseEmail(bodyText);

//       results.push({
//         data: r1,
//         raw: bodyText, // keep raw for debugging
//       });
//     }

//     return res.json(results);
//   } catch (err) {
//     console.error("Gmail API error:", err.response?.data || err.message);
//     return res.status(500).send("Error fetching emails");
//   }
// };


