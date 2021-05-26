const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const app = express();

const winston = require('winston'); // Performs logging
const logger = winston.createLogger({
        transports: [
                new winston.transports.Console(),
                new winston.transports.File({filename: 'combined.log', options: {flags: 'a'}})
        ]
});


const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '13000mb'}));
app.use(bodyParser.urlencoded({limit: '13000mb', extended: true, parameterLimit: 10000000}));

// Connection URL
const url = 'mongodb://127.0.0.1';

// Database name
const dbName = 'sketchxsst_large';

app.post('/get', async (req, res) => {
	let query = req.body;
	user_id = Number(String(query['user']));

	// Query DB
	try {
		const client = new MongoClient(url);
		await client.connect();
		logger.log({level: 'info', message: 'Connected correctly to server'});
		const db = client.db(dbName);

		// Query an entry
		let data = await db.collection('inventory').find({'userID': user_id}).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+user_id+' made a Request'});
            res.end('User_ID not recognised');
            return;
		}

		let curr_idx = null;
		for (let i=0; i<data.length; i++){
			if (data[i]['annotation'] == null) {
				curr_idx = i;
				break;
			}
		}

		if (curr_idx == null) {
			res.end('None');
		} else {
			img_url = String(data[curr_idx]['img_url']);
			let reply_data = JSON.stringify({
				'index': String(curr_idx),
				'img_url': img_url
			});
			logger.info('User: '+user_id+' asked for Image: '+ img_url);
			res.end(reply_data);
		}

		// Close connection
		client.close();
	} catch(err) {
		logger.log({level: 'warn', message: err.stack});
		console.log(err.stack);
	}
});


app.post('/submit', async (req, res) => {
	let query = req.body;
	user_id = Number(String(query['user']));
	img_url = String(query['img_url']);
	sketch_data = query['sketch_data'];
	caption = String(query['caption']);

	// Query DB
	try{
		const client = new MongoClient(url);
		await client.connect();
		logger.log({level: 'info', message: 'Connected correctly to server'});
		const db = client.db(dbName);

		let data = await db.collection('inventory').find({'userID': user_id, 'img_url': img_url}).limit(1).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+user_id+' made a Request'});
            res.end('User Not Found');
            return;
		}

		//check if entry already exists
		if (data[0]['annotation'] != null) {
			res.end("Img already annotated");
			return;
		}

		// Update entry
		await db.collection('inventory').updateOne(
			{'userID': user_id, 'img_url': img_url},
			{$set: {
				'annotation': {
					'img_url': img_url,
					'sketch_data': sketch_data,
					'caption': caption					
				}
			}});

		curr_idx = data[0]['curr_idx'];
		all_img_urls = data[0]['all_img_urls'];

		logger.log({level: 'info', message: 'User: '+user_id+' submitted annotation for Image: '+img_url});
        res.end('Data written');

		// Close connection
		client.close();
	} catch(err) {
		logger.log({level: 'warn', message: err.stack});
		console.log(err.stack);
	}
});


app.post('/inspect', async (req, res) => {
	let query = req.body;
	const access_id = query['access_id'];

	if (access_id != 'sketchx-cvssp') {
		logger.log({level: 'info', message: 'Invalid access_id for inspection.'});
		res.end('Invalid access_id');
		return;
	}

	const user_id = Number(String(query['user_id']));
	const curr_idx = Number(String(query['curr_idx']));

	// Query DB
	try{
		const client = new MongoClient(url);
		await client.connect();
		logger.log({level: 'info', message: 'Connected correctly to server'});
		const db = client.db(dbName);

		let data = await db.collection('inventory').find({'userID': user_id}).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+String(user_id)+' made a Request'});
            res.end('User Not Found');
            client.close();
            return;
		}

		if (data[curr_idx]['annotation'] == null) {
			logger.log({level: 'info', message: 'Image: '+String(curr_idx)+' not annotated by User: '+String(user_id)});
			res.end('Image not found');
			client.close();
			return;
		}

		if (query['delete'] == true) {
			await db.collection('inventory').updateOne(
				{'userID': user_id, 'img_url': data[curr_idx]['img_url']},
				{$set: {'annotation': null}}
				)
			res.end('deleted');
			} else {
				let reply_data = JSON.stringify({
					'img_url': data[curr_idx]['img_url'],
					'sketch_data': data[curr_idx]['annotation']['sketch_data'],
					'caption': data[curr_idx]['annotation']['caption']
				});
				logger.log({level: 'info', 
					message:'Inspection for UserID: '+String(user_id)+' ID: '+String(curr_idx)});
				res.end(reply_data);	
			}
		
		// Close connection
		client.close();
		return;
	} catch(err) {
		logger.log({level: 'warn', message: err.stack});
		console.log(err.stack);
	}

});

module.exports = app;
