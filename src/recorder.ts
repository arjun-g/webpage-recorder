import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const EXTENSION_PATH = path.join(__dirname, 'extension');

export class Recorder {

    browser: puppeteer.Browser
    page: puppeteer.Page
    extensionId: string

    constructor(private options: {
        url: string,
        width: number,
        height: number,
        audio: boolean,
        video: boolean,
        filename: string,
        startOn?: (page: puppeteer.Page) => Promise<void>
    }){
        
    }

    async start(): Promise<void>{

        let options = this.options;

        let launchOptions: puppeteer.LaunchOptions = {
            headless: false,
            args: [
                '--load-extension=' + EXTENSION_PATH,
                '--disable-extensions-except=' + EXTENSION_PATH,
                '--disable-infobars'
            ]
        };

        this.browser = await puppeteer.launch(launchOptions);

        await (await this.browser.pages())[0].goto('about:blank');

        let targets = await this.browser.targets();

        let target = targets.find(target => {
            return target['_targetInfo'].title === 'Webpage Recorder Extension';
        });

        this.extensionId = target.url().match('chrome-extension\:\/\/([a-zA-Z0-9]*)\/_generated_background_page.html')[1];
        
        await this.browser.close();

        launchOptions = {
            headless: false,
            defaultViewport: null,
            args: [
                '--enable-usermedia-screen-capturing',
                '--allow-http-screen-capture',
                '--load-extension=' + EXTENSION_PATH,
                '--disable-extensions-except=' + EXTENSION_PATH,
                '--whitelisted-extension-id=' + this.extensionId,
                '--disable-infobars',
                `--window-size=${options.width},${options.height}`,
                '--enable-tab-capture',
                '--no-sandbox'
            ]
        };
        
        this.browser = await puppeteer.launch(launchOptions);

        let page = this.page = await this.browser.newPage();

        await page.setViewport({ width: options.width, height: options.height });

        const client = await page.target().createCDPSession();
        
        await client.send('Emulation.clearDeviceMetricsOverride');

        await page.goto(options.url, { waitUntil: 'domcontentloaded' });

        let folder = path.dirname(options.filename);

        let downloadPath: string = path.resolve(process.cwd(), folder);

        await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath.toString() });

        if(options.startOn){
            options.startOn(page).then(_ => page.evaluate((video: boolean, audio: boolean, width: number, height: number, folder: string, filename: string) => {
                window.postMessage({
                    command:  'WR_START_RECORDING',
                    audio,
                    video,
                    width,
                    height,
                    folder,
                    filename
                }, '*')
            }, !!options.video, !!options.audio, options.width, options.height, folder, path.basename(options.filename)));
        }
        else{
            console.log('SENDING RECORD MESSAGE ELSE');
            page.evaluate((video: boolean, audio: boolean, width: number, height: number, folder: string, filename: string) => {
                console.log('SENDING RECORD MESSAGE');
                window.postMessage({
                    command:  'WR_START_RECORDING',
                    audio,
                    video,
                    width,
                    height,
                    folder,
                    filename
                }, '*')
            }, !!options.video, !!options.audio, options.width, options.height, folder, path.basename(options.filename));
        }
    }

    async stop(){
        let page = this.page;
        let options = this.options;
        page.evaluate(() => {
            window.postMessage({ command:  'WR_STOP_RECORDING'}, '*');
        });
        await page.waitForSelector('#webpage-recorder-downloaded-filename');
        let downloadFilenameElement = await page.$('#webpage-recorder-downloaded-filename');
        let downloadedFilename = await page.evaluate(element => element.textContent, downloadFilenameElement);
        await page.waitForSelector('#webpage-recorder-downloaded');
        if(downloadedFilename !== options.filename)
            await this.moveFile(downloadedFilename, options.filename);
        if(this.browser)
            await this.browser.close();
    }

    private moveFile(source: string, target: string){
        return new Promise((resolve, reject) => {
            fs.createReadStream(source)
            .pipe(fs.createWriteStream(target))
            .on('close', () => {
                resolve();
            });
        });
    }

}