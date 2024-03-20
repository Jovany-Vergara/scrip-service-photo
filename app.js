const express = require('express');
const https = require("https");
const nodeWebCam = require('node-webcam');
const fs = require('fs');
const path = require('path');
const compress_images = require('compress-images');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'images')));

const options = {
  width: 1024,
  height: 720,
  quality: 97,
  delay: 0,
  saveShots: true,
  output: "jpeg",
  device: 1,
  callbackReturn: "location"
};

const webcam = nodeWebCam.create(options);

app.get('/', (req, res) => {
  const imageName = `${Date.now()}_${Math.floor(Math.random() * 1001)}`;
  const imgPath = `./images/${imageName}.${options.output}`;

  if (!fs.existsSync(path.dirname(imgPath))) {
    fs.mkdirSync(path.dirname(imgPath));
  }

  webcam.capture(imgPath, (err) => {
    if (err) {
      console.log(err);
      res.send(JSON.stringify({ success: false, result: err }));
      return;
    }

    console.log('Image created');

    compress_images(
      imgPath,
      `./images/C-`,
      { compress_force: true, statistic: true, autoupdate: true },
      false,
      { jpg: { engine: "mozjpeg", command: ["-quality", "97"] } },
      { png: { engine: "pngquant", command: ["--quality=95-97", "-o"] } },
      { svg: { engine: "svgo", command: "--multipass" } },
      { gif: { engine: "gifsicle", command: ["--colors", "95", "--use-col=web"] } },
      function (err, completed) {
        if (completed === true) {
          const imagen = fs.readFileSync(`./images/C-${imageName}.${options.output}`);
          let result = Buffer.from(imagen).toString('base64');
          fs.unlinkSync(imgPath);
          fs.unlinkSync(`./images/C-${imageName}.${options.output}`);
          res.send(JSON.stringify({ success: true, result: `data:image/png;base64,${result}` }));
        }
      }
    )
  });
});

app.get('/test', (req, res) => {
  // Repite el mismo código que en el endpoint '/'
});

app.get('/list', (req, res) => {
  webcam.list((list) => res.send(JSON.stringify(list)));
});

const options_server = {
  key: fs.readFileSync(process.env.KEY_PATH),
  cert: fs.readFileSync(process.env.CERT_PATH),
  ca: fs.readFileSync(process.env.CA_PATH)
};

https.createServer(options_server, app)
  .listen(3000, () => console.log("Server started at port 3000"));