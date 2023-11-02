


const marked = require('marked');


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

module.exports = { renderFile }