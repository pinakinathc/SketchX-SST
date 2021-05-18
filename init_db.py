# -*- coding: utf-8 -*-
# author: pinakinathc

import numpy as np
from pymongo import MongoClient

class Connect(object):
	@staticmethod
	def get_connection():
		return MongoClient("mongodb://127.0.0.1/")

client = Connect.get_connection()
db = client.sketchxsst

with open('./data/list_imgs.txt', 'r') as fp:
	list_img_ids = fp.read().split('\n')[:-1]

list_img_urls = []
for img_id in list_img_ids:
	img_url = 'http://images.cocodataset.org/train2017/%012d.jpg'%int(img_id)
	print (img_url)
	list_img_urls.append(img_url)

for user_id in range(100):
	query = {
		'userID': user_id,
		'all_img_urls': list_img_urls[user_id: user_id+100],
		'curr_idx': 0,
		'annotation': [],
	}
	db.inventory.insert_one(query)
