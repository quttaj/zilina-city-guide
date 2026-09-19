const express = require("express");
const router = require('../util/router')();
const dbHandler = require("../util/dbHandler");
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 } });

function isAuthenticated(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}


router.post('/addComment', isAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.session.userId) {
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(401).json({ message: "Authentication required" });
        } else {
            req.session.redirectTo = req.originalUrl;
            return res.redirect('/login');
        }
    }

    const { name, description, parent_id, redirect } = req.body;



    
    try {
        await dbHandler.createComment(name, description, req.session.userId, parent_id || null, req.file);

   
        if (redirect === 'stay') {
            if (parent_id) {
                return res.redirect("/comments/" + encodeURIComponent(parent_id));
            } else {
                return res.redirect("/place/" + encodeURIComponent(name));
            }
        } else {
            return res.redirect("/comments");
        }
    } catch (error) {
        console.error('Error adding comment: ', error);
        return res.status(500).send("An error occurred while adding your comment.");
    }
});


router.get('/comments/:id', async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await dbHandler.getCommentById(commentId);
        if (comment) {
            await dbHandler.incrementViewCount(commentId);
            let replies = [];
            let isAuthenticated = req.session.userId ? true : false;
            let isAdmin = req.session.isAdmin ? true : false;

            if (isAuthenticated) {
                replies = await dbHandler.getRepliesForComment(commentId);
            }

            res.render("comments-details", {
                com: comment,
                replies: replies,
                isAuthenticated: isAuthenticated,
                isAdmin: isAdmin,
                userId: req.session.userId,
                mime: mime  
            });
        } else {
            res.status(404).render("404");
        }
    } catch (error) {
        console.error("Error loading comment details or incrementing view count:", error);
        res.status(500).render("500");
    }
});


router.get('/comments/edit/:id', isAuthenticated, async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await dbHandler.getCommentById(commentId);
        if (comment && (req.session.isAdmin || req.session.userId === comment.author_id)) {
            res.render('editcomment', { comment });
        } else {
            res.status(403).send('Unauthorized access');
        }
    } catch (error) {
        console.error("Error loading comment for edit:", error);
        res.status(500).render("500");
    }
});

router.post('/comments/edit/:id', isAuthenticated, async (req, res) => {
    const { description } = req.body;
    const commentId = req.params.id;

    try {
        const comment = await dbHandler.getCommentById(commentId);
        if (comment && (req.session.isAdmin || req.session.userId === comment.author_id)) {
            await dbHandler.updateComment(commentId, comment.name, description);
            if (comment.parent_id) {
                res.redirect('/comments/' + encodeURIComponent(comment.parent_id));
            } else {
                res.redirect('/comments/' + encodeURIComponent(commentId));
            }
        } else {
            res.status(403).send('Unauthorized access');
        }
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).send("An error occurred while updating your comment.");
    }
});

router.post('/comments/delete/:id', isAuthenticated, async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await dbHandler.getCommentById(commentId);
        if (comment && (req.session.isAdmin || req.session.userId === comment.author_id)) {
            await dbHandler.deleteComment(commentId);
            if (comment.parent_id) {
                res.redirect('/comments/' + encodeURIComponent(comment.parent_id));
            } else {
                res.redirect('/comments');
            }
        } else {
            res.status(403).send('Unauthorized access');
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).send("An error occurred while deleting your comment.");
    }
});



router.get('/addComment', isAuthenticated, (req, res) => {
    const parent_id = req.query.parent_id; 
    res.render("addcomment", { parent_id }); 
});

router.get('/comments', async (req, res) => {
    const data = await dbHandler.getComments();
    let filteredData = data;

    if (req.query.filter) {
        const filters = Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter];
        filteredData = data.filter(com => filters.includes(com.name));
    }

    res.render("comments", {
        numberOfComments: filteredData.length,
        comments: filteredData,
        mime: mime  
    });
});

module.exports = router; 
