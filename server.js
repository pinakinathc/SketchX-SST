// author: pinakinathc
// www.pinakinathc.me

const winston = require('winston'); // Performs logging
const express = require('express');
const cors = require('cors');
const router = require('./routes/sst_routes.js') // Routing

const app = express();
const bodyParser = require('body-parser');
const port = 80;

const logger = winston.createLogger({
        transports: [
                new winston.transports.Console(),
                new winston.transports.File({filename: 'combined.log', options: {flags: 'a'}})
        ]
});

app.use(cors());
app.use(bodyParser.json({limit: '1300mb'}));
app.use(bodyParser.urlencoded({limit: '1300mb', extended: true}));


app.get('/', (req, res) => { // Homepage
	logger.log({level: 'info', message: 'GET request from ' + req.socket.remoteAddress});
	res.sendFile(__dirname+'/index.html');
});


app.get('/inspect', (req, res) => { // Inspect data
	logger.log({level: 'info', message: 'GET request from ' + req.socket.remoteAddress});
	res.sendFile(__dirname+'/inspect.html');
});


// Additional routing with linking to DB
app.use(router);


app.listen(port, () => {
	console.log('SketchX-SST server listening on port '+port+'!');
})
