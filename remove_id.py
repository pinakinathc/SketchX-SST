# -*- coding: utf-8 -*-
# author: pinakinathc

import os
from pymongo import MongoClient

class Connect(object):
	@staticmethod
	def get_connection():
		return MongoClient("mongodb://127.0.0.1/")


client = Connect.get_connection()
db = client.sketchxsst_large

# for user_id in [1,2,3,4,5,6,7,10,11,12]:
for img_id in [263359, 361212, 451153, 507122]:
	img_url = 'http://images.cocodataset.org/train2017/%012d.jpg'%int(img_id)
	# db.inventory.update_many(
	# 	{"userID": user_id},
	# 	{"$set": {"annotation": None}})
	db.inventory.update_many(
		{"img_url": img_url},
		{"$set": {"annotation": None}})


# img_list = [15681,  62741,  76792, 92109, 102755, 111707,  186308, 213911, 235529, 284688, 285588, 300580, 365918, 356908, 361661,  430391, 480115, 517805, 562614, 574487, 575633]
# cursor = db.inventory.find({'userID': 94});
# for data in cursor:
# 	img_url = data['img_url']
# 	img_id = int(os.path.split(img_url)[-1][:-4])
# 	if img_id in img_list:
# 		print ('continue')
# 		continue
# 	db.inventory.update_many(
# 		{'img_url': img_url},
# 		{'$set': {'annotation': None}})
