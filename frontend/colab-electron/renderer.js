const WebSocket = require('ws');
const marked = require('marked');

const editorText = document.getElementById('editor_text');
// Replace 'ws://localhost:8080' with the address of your Go WebSocket server.
const serverAddress = 'ws:localhost:8080/ws';

const socket = new WebSocket(serverAddress);

const files = [{
    id: "1", name: 'file1', content: [
        "## Hej", "Test", " Kul sak"
    ]
}, {
    id: "2", name: 'file2', content: [
        "## Hej 2", "Test", " Kul sak"
    ]
}]

let currentFile = null;



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



const rightArrow = document.getElementById('right_arrow');
const drawer = document.getElementById('drawer');
const fileList = document.getElementById('file_list');

rightArrow.addEventListener('click', () => {
    drawer.classList.toggle('open');
});



editor_text.addEventListener('input', (event) => {

    console.log('enter key pressed');

    document.getElementById('editor_preview').innerHTML =
        marked.parse(editorText.value);

    console.log('sending message to server:', editorText.value);
    //socket.send(editorText.value);

});


const changeFile = (file) => {

    const fileItem = document.getElementById(file.id);
    if (currentFile && currentFile.id === file.id) return;
    currentFile = file;
    let rowCount = 0;

    editorText.innerHTML = '';
    file.content.forEach(element => {
        const row = document.createElement('div');
        row.classList.add('text_row');
        row.innerHTML = marked.parse(element);
        editorText.appendChild(row);



        row.addEventListener('click', () => {
            if (row.classList.contains('selected')) return;

            row.classList.add('selected');


            row.innerHTML = '';
            const rowNumber = document.createElement('div');
            rowNumber.classList.add('text_row_number');
            rowNumber.appendChild(document.createTextNode(rowCount));
            rowCount++;
            row.appendChild(rowNumber);

            const rowText = document.createElement('input');
            rowText.classList.add('text_row_text');
            rowText.focus();
            rowText.value = element;
            rowText.addEventListener('focusout', () => {
                row.innerHTML = marked.parse(element);
            });
            row.appendChild(rowText);

        });


    });


    const fileItems = fileList.querySelectorAll('.selected');
    fileItems.forEach(item => {
        item.classList.remove('selected');
    });
    fileItem.classList.add('selected');

    const editorHeaderTitle = document.getElementById('editor_header_title');
    editorHeaderTitle.textContent = file.name;

}


files.forEach(file => {
    const fileItem = document.createElement('li');
    fileItem.classList.add('file');
    fileItem.id = file.id;


    const fileName = document.createElement('h3');
    fileName.id = "file_name";
    fileName.textContent = file.name;
    fileItem.appendChild(fileName);


    fileList.appendChild(fileItem);
    fileItem.addEventListener('click', () => {
        changeFile(file);
    });
});