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
const dbName = 'sketchxsst';

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
		let data = await db.collection('inventory').find({'userID': user_id}).limit(1).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+user_id+' made a Request'});
            res.end('User_ID not recognised');
            return;
		}

		data = data[0];
		let curr_idx = data['curr_idx'];

		if (curr_idx == data['all_img_urls'].length) {
			res.end('None');
		} else {
			var annotated_urls = [];
			for (let i=0; i<data['annotation'].length; i++) {
				annotated_urls.push(data['annotation'][i]['img_url']);
			}

			let index = null;
			let img_url = null;
			for (let i=0; i<data['all_img_urls'].length; i++) {
				img_url = data['all_img_urls'][i];
				if (!annotated_urls.includes(img_url)) {
					index = i;
					break;
				}
			}
			assert(!null, index);

			img_url = String(img_url);
			let reply_data = JSON.stringify({
				'index': String(index),
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

		let data = await db.collection('inventory').find({'userID': user_id}).limit(1).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+user_id+' made a Request'});
            res.end('User Not Found');
            return;
		}

		curr_idx = data[0]['curr_idx'];
		all_img_urls = data[0]['all_img_urls'];

		// Check if image IMG URL is valid
		if (!all_img_urls.includes(img_url)) {
			logger.log({level: 'warn', message: 'User: '+user_id+' submitted annotation for unrecognized image: '+img_url});
            res.end("Img URL Not Found");
            return;
		}

		// Check if entry already exists
		let annotated_urls = [];
		for (let i=0; i<data[0]['annotation'].length; i++) {
			annotated_urls.push(data[0]['annotation'][i]['img_url']);
		} if (annotated_urls.includes(img_url)) {
			res.end("Img already annotated");
			return;
		}

		// Update and push entry
		await db.collection('inventory').updateOne(
			{'userID': user_id},
			{$push: {
				'annotation': {
					'img_url': img_url,
					'sketch_data': sketch_data,
					'caption': caption
				}
			}});

		await db.collection('inventory').updateOne(
				{'userID': user_id},
				{$set: {curr_idx: curr_idx+1}}
			);

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
	}

	const user_id = Number(String(query['user_id']));
	const curr_idx = Number(String(query['curr_idx']));

	// Query DB
	try{
		const client = new MongoClient(url);
		await client.connect();
		logger.log({level: 'info', message: 'Connected correctly to server'});
		const db = client.db(dbName);

		let data = await db.collection('inventory').find({'userID': user_id}).limit(1).toArray();

		// Check if valid UserID
		if (data.length == 0) {
			logger.log({level: 'warn', message: 'Unrecognised User: '+String(user_id)+' made a Request'});
            res.end('User Not Found');
            client.close();
            return;
		}
		data = data[0];

		if (data['annotation'].length == 0 || curr_idx >= data['annotation'].length) {
			logger.log({level: 'info', message: 'No more images for User: '+String(user_id)});
			res.end('Image not found');
			client.close();
			return;
		}

		if (query['delete'] == true) {
			await db.collection('inventory').updateOne(
				{'userID': user_id},
				{$pull: {'annotation': {'img_url': data['annotation'][curr_idx]['img_url']}}}
			)
			res.end('deleted');
		} else {
			let reply_data = JSON.stringify({
				'img_url': data['annotation'][curr_idx]['img_url'],
				'sketch_data': data['annotation'][curr_idx]['sketch_data'],
				'caption': data['annotation'][curr_idx]['caption']
			});
			logger.log({level: 'info', 
				message:'Inspection for UserID: '+String(user_id)+' ID: '+String(curr_idx)});
			res.end(reply_data);
		}

		// Close connection
		client.close();
	} catch(err) {
		logger.log({level: 'warn', message: err.stack});
		console.log(err.stack);
	}

});

module.exports = app;
