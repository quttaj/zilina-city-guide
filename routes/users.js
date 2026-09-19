const express = require('express');
const router = require('../util/router')();
const User = require('../util/userModel');

router.get('/admin/users', async (req, res) => {
    try {
        const [users] = await User.findAll();
        if (users) {
            res.render('users', { users });
        } else {
            res.send("No users found.");
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/admin/user/:id/edit', async (req, res) => {
    try {
        const [results] = await User.findById(req.params.id);
        if (results.length > 0) {
            const user = results[0];
            res.render('useredit', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Server Error');
    }
});



router.post('/admin/user/:id/edit', async (req, res) => {
    const { firstName, lastName, email } = req.body;
    await User.update(req.params.id, firstName, lastName, email);
    res.redirect('/admin/users');
});

router.post('/admin/user/:id/delete', async (req, res) => {
    await User.delete(req.params.id);
    res.redirect('/admin/users');
});

module.exports = router;
