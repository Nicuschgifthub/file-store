function generateRandomString(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    return randomString;
}

function newFileLink(filePath) {
    const rand = generateRandomString(12);

    if (!global.fileService) {
        global.fileService = {};
    }

    global.fileService[rand] = filePath;
    return rand;
}

const getFileLink = (rand) => {
    return global.fileService[rand];
}


module.exports = { newFileLink, getFileLink };