const port = chrome.runtime.connect(chrome.runtime.id);

let downloadedFilePath = '';

port.onMessage.addListener(msg => {
    if(msg.command === 'DOWNLOADING_FILE'){
        downloadedFilePath = msg.filename;
        let span = document.createElement('SPAN');
        span.setAttribute('id', 'webpage-recorder-downloaded-filename');
        span.innerText = downloadedFilePath;
        span.style.display = 'none';
        document.body.appendChild(span);
    }
    else if(msg.command === 'DOWNLOADED'){
        let span = document.createElement('SPAN');
        span.setAttribute('id', 'webpage-recorder-downloaded');
        span.style.display = 'none';
        document.body.appendChild(span);
    }
});

window.addEventListener('message', (ev) => {
    console.log('GOT MESSAGE', ev);
    port.postMessage(ev.data);
});