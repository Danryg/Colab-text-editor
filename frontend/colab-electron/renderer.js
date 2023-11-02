const WebSocket = require('ws');
const marked = require('marked');

const { switchFile } = require('./js/drawer');


// Replace 'ws://localhost:8080' with the address of your Go WebSocket server.
const serverAddress = 'ws:localhost:8080/ws';

const socket = new WebSocket(serverAddress);

let files = []

let currentFile = null;


socket.onopen = (event) => {
    console.log('WebSocket connection established.');
};

socket.onmessage = (event) => {
    console.log('Received message from server:', event.data);
    // Handle the received message (e.g., update the document).
    // CHeck the first letter of data to see if it is a file or a message
    const tokens = event.data.split("|&$");


    if (tokens[0] == 1) {

        const content = tokens.slice(3);

        const file = {
            id: tokens[1],
            name: tokens[2],
            content: content
        }
        files.push(file);
        updateFiles();
    } else if (tokens[0] == 2) {
    } else if (tokens[0] == 3) {
        const file = files.find(file => file.id === tokens[1]);
        file.content[tokens[2]] = tokens[3];
        if (currentFile && currentFile.id === file.id) {
            renderFile(file);
        }
    } else {
        console.log("Unknown message type", tokens);
    }
};




const sendMessage = (message) => {
    socket.send(message);

}




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





const changeFile = (file) => {

    if (currentFile && currentFile.id === file.id) return;
    currentFile = file;

    renderFile(file);
    switchFile(file)

}
const createFile = (name) => {
    const file = {
        id: Date.now().toString(),
        name: "testAdd",
        content: []
    }
    files.push(file);

    let message = "1|&$" + file.id + "|&$" + file.name + "|&$";
    file.content.forEach(element => {
        message += element + "|&$";
    });
    files = [];
    sendMessage(message);

    updateFiles();
    return file;
}


const updateFileContent = (file, component, content) => {

    file.content[component] = content;

    let message = "3|&$" + file.id + "|&$" + component + "|&$" + content;
    sendMessage(message);
}




document.getElementById('test_button').addEventListener('click', () => {
    updateFileContent(currentFile, 0, "test");
});


const updateFile = () => {
    let message = "2|&$" + currentFile.id + "|&$" + currentFile.name + "|&$";
    currentFile.content.forEach(element => {
        message += element + "|&$";
    });
    sendMessage(message);
}


const updateFiles = () => {
    console.log("Updating files", files);
    fileList.innerHTML = '';
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
}


/* ------------------------ Renderer --------------------------*/

let activeRow = null;
const editor = document.getElementById('editor_window');


const addNewRow = (index) => {
    const rowElement = createRowElement("");
    editor.insertBefore(rowElement, editor.childNodes[index]);
    rowElement.addEventListener('keydown', keyDownEvent);
    rowElement.classList.add('selected');
    const rowElements = Array.from(editor.childNodes);
    rowElements.forEach(element => {
        if (element !== rowElement) {
            element.classList.remove('selected');
        }
    });
    rowElement.querySelector('input').focus();
}

const removeRow = (index) => {

}



const keyDownEvent = (event) => {
    if (event.key === 'Enter') {
        let index = Array.from(editor.childNodes).indexOf(activeRow);
        addNewRow(index + 1);
    } else if (event.key === 'Tab') {
        event.preventDefault();
        activeRow.querySelector('input').value += '    ';
    } else if (event.key === 'Backspace') {
        if (activeRow.querySelector('input').value === '') {
            if (editor.childNodes.length === 1) {
                editor.childNodes[0].querySelector('input').value = '';
            } else {

                let index = Array.from(editor.childNodes).indexOf(activeRow);
                editor.removeChild(activeRow);
                if (index > 0) {
                    const upRow = editor.childNodes[index - 1];

                    upRow.classList.add('selected');
                    upRow.querySelector('input').focus();
                }
            }
        }
    } else if (event.key === 'ArrowUp') {
        let index = Array.from(editor.childNodes).indexOf(activeRow);
        if (index > 0) {
            const upRow = editor.childNodes[index - 1];
            const prevRow = editor.childNodes[index];
            prevRow.classList.remove('selected');

            upRow.classList.add('selected');
            upRow.querySelector('input').focus();

        }
    } else if (event.key === 'ArrowDown') {
        let index = Array.from(editor.childNodes).indexOf(activeRow);
        if (index < editor.childNodes.length - 1) {
            const upRow = editor.childNodes[index + 1];
            const prevRow = editor.childNodes[index];
            prevRow.classList.remove('selected');
            upRow.classList.add('selected');
            upRow.querySelector('input').focus();


        }
    }
}

const createRowElement = (row) => {
    const ContentElement = document.createElement('input');
    ContentElement.classList.add('editor_row_content');
    ContentElement.value = row;

    const MarkdownElement = document.createElement('div');
    MarkdownElement.classList.add('editor_row_markdown');
    MarkdownElement.innerHTML = marked.parse(row);

    const rowElement = document.createElement('div');
    rowElement.classList.add('editor_row');
    rowElement.appendChild(ContentElement);
    rowElement.appendChild(MarkdownElement);

    ContentElement.addEventListener('focus', () => {
        activeRow = rowElement;
    });

    ContentElement.addEventListener('input', () => {
        MarkdownElement.innerHTML = marked.parse(ContentElement.value);
        updateFileContent(currentFile, Array.from(editor.childNodes).indexOf(rowElement), ContentElement.value);
    });

    rowElement.addEventListener('click', () => {
        rowElement.classList.add('selected');
        const rowElements = Array.from(editor.childNodes);
        rowElements.forEach(element => {
            if (element !== rowElement) {
                element.classList.remove('selected');
            }
        });
        rowElement.querySelector('input').focus();
    });

    return rowElement;
}


const renderFile = (file) => {
    const { name, content } = file;
    currentFile = file;
    // Setting the title of the editor.
    const editorHeaderTitle = document.getElementById('editor_header_title');
    editorHeaderTitle.textContent = name;

    // Setting the content of the editor.

    editor.innerHTML = '';
    file.content.forEach(row => {
        const rowElement = createRowElement(row);
        editor.appendChild(rowElement);
        rowElement.addEventListener('keydown', keyDownEvent);
    });
}