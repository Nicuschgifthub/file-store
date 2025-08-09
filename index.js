const express = require('express');
const path = require('path');
const fs = require('fs');

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

app.get('/download/:fileid', (req, res) => {
  const filePathSimple = getFileLink(req.params.fileid)

  if (filePathSimple == undefined) {
    res.redirect('/404-no-link');
    return;
  }

  const filePath = path.join(filesDirectory, filePathSimple);

  if (!fs.existsSync(filePath)) {
    res.redirect('/404-no-link');
    return;
  }

  res.download(filePath);
});

function getFolderSize(folderPath) {
  let totalSize = 0;

  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(folderPath, item.name);
    const stats = fs.statSync(fullPath);

    if (item.isDirectory()) {
      totalSize += getFolderSize(fullPath); // recursion for subfolders
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

app.get('/', (req, res) => {
  const publicFolders = findFoldersWithPublicFile().map(name => {
    const fullPath = path.resolve(filesDirectory, name);
    const stats = fs.statSync(fullPath);

    return {
      name: '📁' + name,
      type: 'folder',
      size: formatBytes(getFolderSize(fullPath)),
      created: formatDate(stats.birthtime),
      modified: formatDate(stats.mtime),
      filelink: `/${name}`
    };
  });

  res.render('index', {
    data: { filesList: publicFolders },
    foldername: '/',
    isRoot: true
  });
});



app.get('/*', (req, res) => {
  const requestedPath = req.params[0] || '';
  const folderPath = path.resolve(filesDirectory, requestedPath);

  if (!folderPath.startsWith(filesDirectory)) {
    return res.status(403).send('Access Denied');
  }

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return res.render('404');
  }

  const relativePath = path.relative(filesDirectory, folderPath);
  const parentPath = relativePath ? `/${path.dirname(relativePath)}` : '/';

  const items = fs.readdirSync(folderPath, { withFileTypes: true })
    .filter(item => item.name !== '.public')
    .map(item => {
      const fullPath = path.join(folderPath, item.name);
      const stats = fs.statSync(fullPath);

      if (item.isDirectory()) {
        return {
          name: '📁' + item.name,
          type: 'folder',
          size: formatBytes(getFolderSize(fullPath)), // now shows folder size
          created: formatDate(stats.birthtime),
          modified: formatDate(stats.mtime),
          filelink: path.join('/', relativePath, item.name)
        };
      } else {
        return {
          name: item.name,
          type: getFileType(item.name),
          size: formatBytes(stats.size),
          created: formatDate(stats.birthtime),
          modified: formatDate(stats.mtime),
          filelink: `/download/${newFileLink(path.join(relativePath, item.name))}`
        };
      }
    });

  res.render('index', {
    data: { filesList: items },
    foldername: relativePath || '/',
    isRoot: !relativePath,
    parentPath
  });
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