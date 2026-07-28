const express = require('express');
const router = express.Router();
const controller = require('../controllers');
const axios = require('axios');

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

router.get('/panggil/:kd_poli', (req, res) => {
    const { kd_poli } = req.params;
    res.render('pages/panggil', { title: "PANGGIL PASIEN", kd_poli: kd_poli });
})

// Proxy endpoint untuk fetch antrian dari external API
router.get('/api/antrian', async (req, res) => {
    try {
        const { tgl_antrean, kd_poli } = req.query;

        if (!tgl_antrean || !kd_poli) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const response = await axios.get(
            `${process.env.HOST}/api/ralan/antiran/poli?tgl_antrean=${tgl_antrean}&kd_poli=${kd_poli}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.TOKEN
                }
            }
        );
        const response2 = await axios.get(
            `${process.env.HOST}/api/ralan/antiran/rujukan?tgl_antrean=${tgl_antrean}&kd_poli=${kd_poli}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.TOKEN
                }
            }
        );

        response.data.data = response.data.data.concat(response2.data.data);


        res.json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch antrian data',
            message: error.message
        });
    }
});

module.exports = router;