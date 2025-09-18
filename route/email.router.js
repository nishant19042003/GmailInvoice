// import Router from 'express';
// import { AppAuth, getEmails,oauth2callback } from '../controllers/email.controller.js';
// const emailRouter = Router();

// emailRouter.get('/auth', AppAuth);
// emailRouter.get('/emails', getEmails);
// emailRouter.get('/check-session', (req, res) => {
//   if (req.session.tokens) {
//     return res.json({ loggedIn: true, tokens: req.session.tokens });
//   }
//   res.json({ loggedIn: false });
// });


// export default emailRouter;