# -*- coding: utf-8 -*-
# author: pinakinathc

import os
from pymongo import MongoClient

class Connect(object):
	@staticmethod
	def get_connection():
		return MongoClient("mongodb://127.0.0.1/")

client = Connect.get_connection()
db_old = client.sketchxsst
db_new = client.sketchxsst_large

for idx in range(1, 101): # UserID from 1 to 100
	data = list(db_old.inventory.find({'userID': idx}))

	print (data, idx)
	if len(data[0]['annotation']) == 0:
		continue

	for annotation in data[0]['annotation']:
		sketch_data = annotation['sketch_data']
		img_url = annotation['img_url']
		caption = annotation['caption']

		db_new.inventory.update_one(
			{'userID': idx, 'img_url': img_url},
			{'$set': {'annotation': {
				'img_url': img_url,
				'sketch_data': sketch_data,
				'caption': caption
			}}});
