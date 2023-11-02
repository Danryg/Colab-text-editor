const switchFile = (file) => {
    const fileItem = document.getElementById(file.id);
    const fileItems = fileList.querySelectorAll('.selected');
    fileItems.forEach(item => {
        item.classList.remove('selected');
    });
    fileItem.classList.add('selected');
}




module.exports = { switchFile }