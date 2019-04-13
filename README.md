# Webpage Recorder - v1.0.0
**Record a webpage as video/audio file**

Webpage Recorder is based on [puppeteer](https://github.com/GoogleChrome/puppeteer).  You can record video/audio of a webpage and get a .webm file as output.

## Installation

`> npm install webpage-recorder --save`

OR

`> yarn add youtube-video-parser`

## Usage

```js
//Import library
const { Recorder } = require('webpage-recorder');

//Start recording immediatly after 'domcontentloaded' event triggered in the webpage
const recorder = new Recorder({
    url: 'http://example.com',
    height: 1080,
    width: 1920,
    audio :true,
    video: true,
    filename: './video.webm'
});
await recorder.start();

//Start recording 5 secs after 'domcontentloaded' event triggered in the webpage
const recorder = new Recorder({
    url: 'http://example.com',
    height: 1080,
    width: 1920,
    audio :true,
    video: true,
    filename: './video.webm',
    startOn: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 5000);
        });
    }
});
await recorder.start();

//Start recording after element with id 'next' is added in the page. Click on it and stop the recording after element with id 'previous' appears
const recorder = new Recorder({
    url: 'http://example.com',
    height: 1080,
    width: 1920,
    audio :true,
    video: true,
    filename: './video.webm',
    startOn: async page => {
        return await page.waitForSelector('#next');
    }
});
let page = await recorder.start();
await page.waitForSelector('#next');
await page.click('#next');
await page.waitForSelector('#previous');
await recorder.stop();

```