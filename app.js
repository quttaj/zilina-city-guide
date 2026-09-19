const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./data/database');
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('Set SESSION_SECRET to a random value of at least 32 characters.');
}
const app = express();
app.disable('x-powered-by');
if (production) app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/healthz', (req, res) => res.send('OK'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
const sessionStore = new MySQLStore({}, db);
app.use(session({
  name: 'zilina.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1800000, httpOnly: true, sameSite: 'lax', secure: production }
}));
app.use((req, res, next) => {
  res.locals.userId = req.session?.userId;
  res.locals.isAdmin = req.session?.isAdmin;

  if (req.method === 'POST' && req.get('origin') && req.get('origin') !== `${req.protocol}://${req.get('host')}`) {
    return res.status(403).send('Please submit the form from this website.');
  }
  next();
});
app.use('/', require('./routes/attachments'));
app.use('/', require('./routes/defaults'));
app.use('/', require('./routes/comments'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/users'));
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.locals.userId = req.session?.userId;
  res.locals.isAdmin = req.session?.isAdmin;
  console.error('Request failed:', err.code || err.name);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).send('Maximum attachment size is 5 MB.');
  res.status(500).render('500');
});
if (require.main === module) {
  sessionStore.onReady().then(() => {
    app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Site listening on port ${process.env.PORT || 3000}`));
  }).catch(err => { console.error('Database startup failed:', err.code || err.name); process.exit(1); });
}
module.exports = { app, sessionStore, db };
