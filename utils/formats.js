const path = require('path');

const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

const formatDate = (date) => {
    return date.toLocaleString();
}

const getFileType = (file) => {
    return path.extname(file).slice(1).toUpperCase();
}

module.exports = { formatBytes, formatDate, getFileType };