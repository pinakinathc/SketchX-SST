# -*- coding: utf-8 -*-
# author: pinakinathc

import os
import cv2
import numpy as np
from bresenham import bresenham
# import matplotlib.pyplot as plt
from pymongo import MongoClient


def drawPNG (vector_images, side=256, time=None):
    raster_image = np.ones((side, side), dtype=np.uint8);
    vector_sketch = list()
    prevX, prevY = None, None;
    start_time = vector_images[0]['timestamp']
    if time is None:
        time = vector_images[-1]['timestamp'] - start_time
    for points in vector_images:
        if (points['timestamp'] - start_time)/1000 > time:
            break
        x, y = map(float, points['coordinates'])
        x = int(x * side); y = int(y * side)
        pen_state = list(map(int, points['pen_state']))
        if not (prevX is None or prevY is None):
            cordList = list(bresenham(prevX, prevY, x, y))
            for cord in cordList:
                    if (cord[0] > 0 and  cord[1] > 0) and (cord[0] < side and  cord[1] < side):
                        raster_image[cord[1], cord[0]] = 0
            if pen_state == [0, 1, 0]:
                    prevX = x; prevY = y
                    vector_sketch.append([x, y, 0])
            elif pen_state == [1, 0, 0]:
                    prevX = None; prevY = None;
                    vector_sketch.append([x, y, 1])
            else:
                raise ValueError('pen_state not accounted for')
        else:
            prevX = x; prevY = y;
    # invert black and white pixels and dialate
    raster_image = (1 - cv2.dilate(1-raster_image, np.ones((3,3),np.uint8), iterations=1))*255
    return raster_image, vector_sketch, time/1000



class Connect(object):
	@staticmethod
	def get_connection():
		return MongoClient("mongodb://127.0.0.1/")


client = Connect.get_connection()
db = client.sketchxsst

output_dir = 'raster_images'
os.makedirs(os.path.join(os.getcwd(), output_dir), exist_ok=True)

for idx in range(1, 101): # UserID from 1 to 100
	data = list(db.inventory.find({'userID': idx}))

	if len(data[0]['annotation']) == 0:
		continue

	os.makedirs(os.path.join(os.getcwd(), output_dir, str(idx)), exist_ok=True)

	for annotation in data[0]['annotation']:
		sketch_data = annotation['sketch_data']
		img_url = annotation['img_url']
		caption = annotation['caption']

		raster_img, _, time = drawPNG(sketch_data)

		# if time <= 60: # conditional constrain
		# 	continue

		print (img_url)
		print (caption)

		img_name = os.path.split(img_url)[-1]
		cv2.imwrite(os.path.join(os.getcwd(), output_dir, str(idx), img_name), raster_img)
		
		## For visualisation
		# plt.imshow(raster_img, cmap='gray')
		# plt.show()