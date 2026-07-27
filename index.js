require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const axios = require('axios');

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const morgan = require('morgan');
app.use(morgan('dev'));
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/*+json' }))
app.use(cookieParser())
// const ejs = require('ejs');
// app.set('view engine', 'ejs');
// Set view engine
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use("/asset/js/", express.static(path.join(__dirname + '/Public/js/')));
app.use("/asset/img/", express.static(path.join(__dirname + '/Public/img/')));
app.use("/asset/css/", express.static(path.join(__dirname + '/Public/css/')));
app.use("/asset/video/", express.static(path.join(__dirname + '/Public/video/')));
const routes = require('./routes');
app.use('/', routes);



io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Subscribe ke room berdasarkan kd_poli
    socket.on("subscribe_poli", (kd_poli) => {
        socket.join(`poli_${kd_poli}`);
        console.log(`User ${socket.id} subscribed to poli_${kd_poli}`);
    });

    // Unsubscribe dari room poli
    socket.on("unsubscribe_poli", (kd_poli) => {
        socket.leave(`poli_${kd_poli}`);
        console.log(`User ${socket.id} unsubscribed from poli_${kd_poli}`);
    });

    // Handle panggil pasien event
    socket.on("panggil_pasien", (data) => {
        io.emit('panggil_update', {
            kd_poli: data.kd_poli,
            no_reg: data.no_reg,
            nm_pasien: data.nm_pasien,
            nm_dokter: data.nm_dokter,
            nm_poli: data.nm_poli,
            timestamp: new Date()
        });
        console.log(`Panggil pasien: ${data.nm_pasien} di poli ${data.kd_poli}`);
        // Broadcast ke semua client di room poli tersebut
        io.to(`poli_${data.kd_poli}`).emit('panggil_update', {
            kd_poli: data.kd_poli,
            no_reg: data.no_reg,
            nm_pasien: data.nm_pasien,
            nm_dokter: data.nm_dokter,
            nm_poli: data.nm_poli,
            timestamp: new Date()
        });
    });

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Fungsi untuk fetch dan broadcast data per poli
async function broadcastAntrianData(kd_poli) {
    let dateNow = new Date();
    let date = dateNow.getDate();
    let month = dateNow.getMonth() + 1;
    let year = dateNow.getFullYear();
    let tgl = `${year}-${month}-${date}`;

    try {
        const response = await axios.get(
            `${process.env.HOST}/api/ralan/antiran/poli?tgl_antrean=${tgl}&kd_poli=${kd_poli}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.TOKEN
                }
            }
        );

        // Broadcast ke semua client yang subscribe ke poli ini
        io.to(`poli_${kd_poli}`).emit('antrian_update', {
            kd_poli: kd_poli,
            data: response.data.data,
            timestamp: new Date()
        });
    } catch (error) {
        console.error(`Error fetching data for poli ${kd_poli}:`, error.message);
    }
}

// Broadcast data setiap 10 detik untuk semua poli (anda bisa optimize ini)
// setInterval(async () => {
//     // Daftar poli yang active (bisa dari database)
//     const poli_list = ['ANA', 'U0011', 'U0006', 'INT', 'U0002', 'U0044'];
//     for (let poli of poli_list) {
//         await broadcastAntrianData(poli);
//     }
// }, 10000);
// Simpan koneksi client yang aktif


app.get('/api/antiran/poli/:kd_poli/:nm_poli/:nm_pasien', (req, res) => {
    const { kd_poli, nm_poli, nm_pasien } = req.params;
    const data = { kd_poli, nm_poli, nm_pasien };
    clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
    return res.status(200).json({ message: 'Data sent successfully' });
})
let clients = [];

// 1. Endpoint untuk Client Web App melakukan subscribe (GET)
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Daftarkan client
    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// app.listen(3000, () => console.log('Server running on port 3000'));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
