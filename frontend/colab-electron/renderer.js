const WebSocket = require('ws');


const editorText = document.getElementById('editor_text');
// Replace 'ws://localhost:8080' with the address of your Go WebSocket server.
const serverAddress = 'ws://localhost:8080/ws';

const socket = new WebSocket(serverAddress);

console.log('Attempting to connect to WebSocket server at', serverAddress);

socket.onopen = (event) => {
    console.log('WebSocket connection established.');
};

socket.onmessage = (event) => {
    console.log('Received message from server:', event.data);
    // Handle the received message (e.g., update the document).
    editorText.value = event.data;

};

socket.onerror = (event) => {
    console.error('WebSocket error:', event);
};

socket.onclose = (event) => {
    if (event.wasClean) {
        console.log('WebSocket closed cleanly, code=' + event.code + ', reason=' + event.reason);
    } else {
        console.error('WebSocket connection abruptly closed');
    }
};


const answerButten = document.getElementById('answer_button');


answerButten.addEventListener('click', () => {
    console.log('answer button clicked');
    socket.send(editorText.value);
});

editor_text.addEventListener('input', (event) => {

        console.log('enter key pressed');
        socket.send(editorText.value);
    
});