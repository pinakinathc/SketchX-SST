# -*- coding: utf-8 -*-
# author: pinakinathc


from pymongo import MongoClient

class Connect(object):
	@staticmethod
	def get_connection():
		return MongoClient("mongodb://127.0.0.1/")


client = Connect.get_connection()
db = client.sketchxsst_large

for user_id in [1,2,3,4,5,6,7]:
	db.inventory.update_many(
		{"userID": user_id},
		{"$set": {"annotation": None}})