const express = require('express');
const router = require('../util/router')();
const bcrypt = require('bcrypt');
const db = require("../data/database");
const dbHandler = require("../util/dbHandler");

router.get('/sign-up', (req, res) => {
    res.render("sign-up");
});

router.get('/login', (req, res) => {
    res.render("login");
});


router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (![firstName, lastName, email, password].every(v => typeof v === 'string' && v.trim()) ||
        firstName.length > 100 || lastName.length > 100 || email.length > 255 || !email.includes('@') ||
        password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).render('sign-up', { error: 'Fill in all fields. Password: at least 8 characters, at most 72 bytes.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (results.length > 0) {
            return res.render('sign-up', { error: 'Email already in use' });
        }

        await db.query('INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)', [firstName, lastName, email, hashedPassword]);
        res.redirect('/login');
    } catch (error) {
        console.error('Sign-up error: ', error);
        res.status(500).render('sign-up', { error: 'Error registering new user' });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = results[0];
        if (!user) {
            return res.render('login', { error: 'No user found with that email address' });
        }
        if (await bcrypt.compare(password, user.password_hash)) {
            await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
            req.session.userId = user.id;
            req.session.isAdmin = !!user.isAdmin;
            await new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
            if (user.isAdmin) {
                res.redirect('/');
            } else {
                res.redirect('/');
            }
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error: ', error);
        res.status(500).render('login', { error: 'Error logging in user' });
    }
});


router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session: ", err);
            return res.redirect('/some-error-page'); 
        }
        res.redirect('/login'); 
    });
});

router.get('/my-profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); 
    }

    try {
        const [userDetails] = await db.query('SELECT first_name, last_name, email FROM users WHERE id = ?', [req.session.userId]);
        const user = userDetails[0];
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('myprofile', { user: user });
    } catch (error) {
        console.error('Error retrieving user profile: ', error);
        res.status(500).send('Error retrieving user profile');
    }
});

router.use('/admin', dbHandler.adminMiddleware); 


module.exports = router;



