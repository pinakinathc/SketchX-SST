# -*- coding: utf-8 -*-
# author: pinakinathc

import os
import cv2
import numpy as np
from bresenham import bresenham
# import matplotlib.pyplot as plt
import tqdm
import requests
import shutil
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


# Declare database name, output_dir, sketchycoco_dir
client = Connect.get_connection()
db = client.sketchxsst_large

output_dir = 'raster_images'
coco_dir = '/home/pinaki/surrey/vol/research/sketchcaption/phd/dataset/COCO-stuff/images/train2017'
sketchycoco_dir = '/home/pinaki/surrey/vol/research/sketchcaption/phd/dataset/SketchyCOCO/Scene/Sketch/paper_version/'

os.makedirs(os.path.join(os.getcwd(), output_dir), exist_ok=True)
os.makedirs(os.path.join(os.getcwd(), output_dir, 'sketches'), exist_ok=True)
os.makedirs(os.path.join(os.getcwd(), output_dir, 'images'), exist_ok=True)
os.makedirs(os.path.join(os.getcwd(), output_dir, 'sketchycoco'), exist_ok=True)
os.makedirs(os.path.join(os.getcwd(), output_dir, 'text'), exist_ok=True)

list_of_all_imgs = [] # Will be used for sanity check
count_duplicates = 0

for idx in range(1, 101): # UserID from 1 to 100
# for idx in [8, 9, 13, 14, 15, 19, 23, 27, 63]:
	data = list(db.inventory.find({'userID': idx}))

	num_anns = sum([x['annotation'] is not None for x in data])
	if num_anns == 0:
		print ('skipping UserID: %d'%idx)
		continue

	print('User: %d, # of annotations: %d'%(idx, num_anns))

	os.makedirs(os.path.join(os.getcwd(), output_dir, 'sketches', str(idx)), exist_ok=True)
	os.makedirs(os.path.join(os.getcwd(), output_dir, 'images', str(idx)), exist_ok=True)
	os.makedirs(os.path.join(os.getcwd(), output_dir, 'sketchycoco', str(idx)), exist_ok=True)
	os.makedirs(os.path.join(os.getcwd(), output_dir, 'text', str(idx)), exist_ok=True)

	# for annotation in data[0]['annotation']:
	for cell in tqdm.tqdm(data):
		annotation = cell['annotation']
		if annotation is None:
			continue
		sketch_data = annotation['sketch_data']
		img_url = annotation['img_url']
		caption = annotation['caption']

		raster_img, _, time = drawPNG(sketch_data)

		# if time <= 60: # conditional constrain
		# 	continue

		# print (img_url)
		# print (caption)

		img_name = os.path.split(img_url)[-1]

		# Sanity check
		if img_name in list_of_all_imgs:
			print ('>>>>>>>>>>>>>>>\n\n\nDuplicate entry: %s for UserID: %d \n\n\n<<<<<<<<<<<<<<<<'%(img_name, idx))
			count_duplicates += 1
		# assert img_name not in list_of_all_imgs, 'Duplicate entry: %s for UserID: %d'%(img_name, idx)
		list_of_all_imgs.append(img_name)

		# Write rasterised scene sketch
		cv2.imwrite(os.path.join(os.getcwd(), output_dir, 'sketches', str(idx), img_name), raster_img)

		# Write RGB image from coco
		if coco_dir is None:
			rgb_img = requests.get(img_url).content
			with open(os.path.join(os.getcwd(), output_dir, 'images', str(idx), img_name), 'wb') as fp:
				fp.write(rgb_img)
		else:
			shutil.copy(os.path.join(coco_dir, img_name), os.path.join(os.getcwd(), output_dir, 'images', str(idx), img_name))

		# Write Synthetic SketchyCOCO
		if sketchycoco_dir is not None:
			path1 = os.path.join(sketchycoco_dir, 'trainInTrain', img_name[:-3]+'png')
			path2 = os.path.join(sketchycoco_dir, 'valInTrain', img_name[:-3]+'png')

			if os.path.exists(path1):
				shutil.copy(path1, os.path.join(os.getcwd(), output_dir, 'sketchycoco', str(idx), img_name[:-3]+'png'))

			elif os.path.exists(path2):
				shutil.copy(path2, os.path.join(os.getcwd(), output_dir, 'sketchycoco', str(idx), img_name[:-3]+'png'))

			else:
				raise AssertionError('Cannot find corresponding Synthetic sketch in %s or %s'%(path1, path2))

		# Write Caption
		with open(os.path.join(os.getcwd(), output_dir, 'text', str(idx), img_name[:-3]+'txt'), 'w') as fp:
			fp.write(caption)
		
		## For visualisation
		# plt.imshow(raster_img, cmap='gray')
		# plt.show()

print ('Total duplicates: %d'%count_duplicates)
