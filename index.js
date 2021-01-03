const winston = require('winston')
const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const port = 8000;

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({filename: 'combined.log', options: {flags: 'a'}})
	]
});

app.use(cors());
app.use(bodyParser.json({limit: '700mb'}));
app.use(bodyParser.urlencoded({limit: '700mb', extended: true}));

let fs = require('fs');
var all_data = JSON.parse(fs.readFileSync('all_data.json', 'utf-8'));

app.get('/', (req, res) => {
	logger.log({level: 'info', message: 'Unwanted GET request from ' + req.socket.remoteAddress});
	res.send('Hello World! Please do not disturb this server in future.');
});

app.post('/get', (req, res) => {
	data = req.body;
	user_id = String(data['user']);
	if (!Object.keys(all_data['users']).includes(user_id)) {
		logger.log({level: 'warn', message: 'Unrecognised User: '+user_id+' made a Request'});
		res.end('User_ID not recognised');
		return;
	}
	user_urls = Object.keys(all_data[user_id]);
	all_urls = all_data['users'][user_id];
	flag = true
	for (let i=0; i<all_urls.length; i++) {
		if (!user_urls.includes(all_urls[i])) {
			logger.info('User: '+user_id+' asked for Image: '+all_urls[i]);
			var reply_data = JSON.stringify({
				'index' : String(i),
				'img_url' : all_urls[i],
			});
			// res.end(all_urls[i]);
			res.end(reply_data);
			flag = false;
			return;
		}
	}
	if (flag) {
		logger.log({level: 'info', message: 'User: '+user_id+' completed all annotation.'});
		res.end('None');
	}
})

app.post('/submit', (req, res) => {
	data = req.body;
	user_id = String(data['user'])
	//if (!all_data['users'].includes(user_id))
	if (!Object.keys(all_data['users']).includes(user_id)) {
		logger.log({level: 'warn', message: 'Found an Unrecognised User_ID: '+user_id});
		res.end("User Not Found");
		return;
	} else if (!all_data['users'][user_id].includes(data['img_url'])) {
		logger.log({level: 'warn', message: 'User: '+user_id+' submitted annotation for unrecognized image: '+data['img_url']});
		res.end("Img URL Not Found");
		return;
	} else {
		all_data[String(data['user'])][data['img_url']] = {
			'sketch': data['sketch_data'],
			'sketch_caption': data['caption']
		}
		let fs = require('fs');
		fs.writeFile('all_data.json',JSON.stringify(all_data), function (err) {
			if (err) throw err;
			logger.log({level: 'info', message: 'User: '+user_id+' submitted annotation for Image: '+data['img_url']});
			res.end('Data written');
		})
	}
})

app.listen(port, () => {
	console.log('Example app listening on port '+port+'!')
});
