require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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

    // socket.on("message", (data) => {
    //     console.log(`Message from ${socket.id}:`, data);
    //     io.emit("message", data); // Broadcast ke semua client
    // });

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});
const chatController = require("./controllers");
chatController(io.of("/rooms"));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
