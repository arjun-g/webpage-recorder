function getVideoAudioStream(video: boolean, audio: boolean): Promise<MediaStream>{
    let options: any = {
        audio,
        video
    }
    return new Promise((resolve, reject) => {
        chrome.tabCapture.capture(options, stream => {
            resolve(stream);
        });
    });
}

chrome.runtime.onConnect.addListener(port => {
    let recorder: MediaRecorder = null;
    port.onMessage.addListener(async message => {
        console.log('GOT MESSAGE', message);
        if (message.command === 'WR_START_RECORDING') {

            let filename = message.filename;
            let video = message.video;
            let audio = message.audio;

            const chunks = [];
            const stream = await getVideoAudioStream(video, audio);
            recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm'
            });
            recorder.ondataavailable = event => {
                if(event.data.size > 0) chunks.push(event.data);
            };
            recorder.onstop = () => {
                let videoBlob = new Blob(chunks, {
                    type: 'video/webm'
                });
                let url = URL.createObjectURL(videoBlob);
                chrome.downloads.download({
                    url,
                    filename
                });
            };
            recorder.start();
        }
        else if (message.command === 'WR_STOP_RECORDING') {
            recorder.stop();
        }

        chrome.downloads.onChanged.addListener(delta => {
            console.log(JSON.stringify(delta));
            if(delta.filename){
                port.postMessage({ command: 'DOWNLOADING_FILE', filename: delta.filename.current });
            }
            else if(delta.state && delta.state.current === 'complete'){
                port.postMessage({ command: 'DOWNLOADED' });
            }
        });

    });

});

