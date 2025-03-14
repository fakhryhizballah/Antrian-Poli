const express = require('express');
const router = express.Router();
const controller = require('../controllers');

router.get('/', (req, res) => {
    // res.send('Hello World!')
    res.render('pages/home', { title: "ANTREAN LOKET" })
})


module.exports = router;