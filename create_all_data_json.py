# -*- coding: utf-8 -*-
# author: pinakinathc

import glob
import os
import json
import numpy as np

if __name__ == '__main__':

    ''' Get all the URL of images we want to annotate '''
    url_list = ["http://images.cocodataset.org/val2017/000000005477.jpg",
        "http://images.cocodataset.org/val2017/000000060770.jpg",
        "http://images.cocodataset.org/val2017/000000576052.jpg",
        "http://images.cocodataset.org/val2017/000000163057.jpg",
        "http://images.cocodataset.org/val2017/000000212895.jpg",
        "http://images.cocodataset.org/val2017/000000252716.jpg",
        "http://images.cocodataset.org/val2017/000000260106.jpg",
        "http://images.cocodataset.org/val2017/000000305695.jpg",
        "http://images.cocodataset.org/val2017/000000323709.jpg",
        "http://images.cocodataset.org/val2017/000000415990.jpg"]
    np.random.shuffle(url_list)

    user_list = ['17', '19', '21'] # Add all unique user IDs you want.
    user_len = len(user_list)
    N = len(url_list) // len(user_list)

    all_data = {'users': {}}
    for idx, user in enumerate(user_list):
        all_data['users'][user] = []
        all_data[user] = {}

        for image_url in url_list[N*idx: N*(idx+1)]: # Each user is assigned 100 Images
            all_data['users'][user].append(image_url)

    with open('all_data_skeleton.json', 'w') as fp:
        json.dump(all_data, fp)

