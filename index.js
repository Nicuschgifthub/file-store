const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5555;
const filesDirectory = path.join(__dirname, 'files');

global.fileService = {};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const { formatBytes, formatDate, getFileType } = require('./utils/formats');
const { newFileLink, getFileLink } = require('./utils/file-service');

if (!fs.existsSync(filesDirectory)) {
  fs.mkdirSync(filesDirectory, { recursive: true });
}

const findFoldersWithPublicFile = () => {
  const foldersWithPublicFile = [];

  const subfolders = fs.readdirSync(filesDirectory, { withFileTypes: true });
  subfolders.forEach((dirent) => {
    if (dirent.isDirectory()) {
      const folderPath = path.join(filesDirectory, dirent.name);
      const publicFilePath = path.join(folderPath, '.public');

      if (fs.existsSync(publicFilePath)) {
        foldersWithPublicFile.push(dirent.name);
      }
    }
  });

  return foldersWithPublicFile;
}

app.get('/', (req, res) => {
  const publicFolders = findFoldersWithPublicFile();
  console.log(publicFolders)
  res.render('info', { public: publicFolders });
})

app.get('/:folder', (req, res) => {
  const folderName = req.params.folder;
  const folderPath = path.join(filesDirectory, folderName);

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return res.render('404');
  }

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    files = files.filter(element => element !== '.public');

    const filesList = files.map(file => {
      const stats = fs.statSync(path.join(folderPath, file));
      return {
        filelink: newFileLink(path.join(folderName, file)),
        name: file,
        size: formatBytes(stats.size),
        created: formatDate(stats.birthtime),
        modified: formatDate(stats.mtime),
        type: getFileType(file)
      };
    });

    res.render('index', { data: { filesList }, foldername: folderName });
  });
});

app.get('/download/:fileid', (req, res) => {
  const filePath = path.join(filesDirectory, getFileLink(req.params.fileid));

  if (!fs.existsSync(filePath)) {
    res.redirect('/404-no-link');
    return;
  }

  res.download(filePath);
});

app.get('/404-no-link', (req, res) => {
  res.render('404');
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'favicon.ico'));
});

app.get('/speedtest/file', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=large-file.txt');

  const fileSizeMB = 200;
  const buffer = Buffer.alloc(1024 * 1024, 'x');

  for (let i = 0; i < fileSizeMB; i++) {
    res.write(buffer);
  }

  res.end();
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`FileServer: http://localhost:${PORT}`);
});

setInterval(() => {
  global.fileService = {};
}, 1000 * 60 * 60 * 5);