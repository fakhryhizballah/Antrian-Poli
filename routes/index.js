const express = require('express');
const router = express.Router();
const controller = require('../controllers');

router.get('/', (req, res) => {
    // res.send('Hello World!')
    res.render('pages/home', { title: "ANTREAN LOKET" })
})
router.get('/flexy', (req, res) => {
    // res.send('Hello World!')
    res.render('pages/flexy', { title: "ANTREAN LOKET" })
})
router.get('/flexy3', (req, res) => {
    // res.send('Hello World!')
    res.render('pages/flexy3', { title: "ANTREAN LOKET" })
})


module.exports = router;