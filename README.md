# SketchX-SST Server-End Code

## Description:

This is a server-side code that servers client-end code found [here](https://github.com/pinakinathc/pinakinathc.github.io/blob/master/projects/_posts/sketchx-sst.html).

- It sends an image URL to the client (or user) which it recognize.
- The image is downloaded by the user from this URL.
- The user then draws a sketch and write a caption and sends it back to the server.
- The server verifies the client (or user) and saves the sketch and caption in a JSON file.
- Assumption: size of the data collection is small like 1GB. There is no database linked to it. A large-scale data collection needs a separate database (like MongoDB etc.)

### author: [pinakinathc](http://www.pinakinathc.me)

## Instruction:

- Install NodeJS and NPM. You can check [this](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) link to know how to install NodeJS and NPM.
- ```git clone https://github.com/pinakinathc/SketchX-SST.git```
- ```cd SketchX-SST```
- ```npm init```
- ```python create_all_data_json.py``` (this creates a dummy all_data.json file. Modify it for your own future use.)
- ```node --max-old-space-size=7168 index.js```
- If you are using your personal computer, your web server is now running at 127.0.0.1:8000. Go to <http://127.0.0.1:8000>.
- If you are using something like AWS, GCP or Linode or have a Public IP then, Go to ```http://<Your Public IP>:8000```.

#### If you got stuck or need my assistance:
- Create an issue in this repository.
- Drop an email at: ```contact@pinakinathc.me```
