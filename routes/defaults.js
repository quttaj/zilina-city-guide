const express = require("express");
const router = require('../util/router')();
const dbHandler = require("../util/dbHandler");


router.get('/', (req, res) => {
    res.render("home");
  });

router.get('/mesta', async (req, res) => {
    const places = await dbHandler.getPlaces();
    res.render('mesta', { places: places });
  });

  router.get('/place/:name', async (req, res) => {
    const placeName = req.params.name;
    const place = await dbHandler.getPlaceByName(placeName);
    if (!place) {
      console.log('Place not found');
      return res.status(404).send('Place not found');
    }

    const comments = await dbHandler.getCommentsForPlace(placeName);

    res.render('place-details', { 
        place: place, 
        comments: comments, 
        userId: req.session.userId  
    });
});






module.exports = router; 