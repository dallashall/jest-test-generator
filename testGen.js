#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const fileTest = require('./templates/fileTest');

const currentPath = path.resolve();
console.log(currentPath);

const makeDir = function makeDir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, (res) => {
      if (res) return reject(res);
      return resolve();
    });
  });
};
const readDir = function readDir(dir, type = null) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) return reject(err);
      if (type) return resolve(files.filter(file => file.match(new RegExp(type))));
      return resolve(files);
    });
  });
};

const createTestFolder = function createTestFolder() {
  return makeDir('__tests__')
    .then(() => console.log('Made directory'))
    .catch(() => console.log('Failed to create directory'));
};
createTestFolder();

const ignoredPaths = fs.readFileSync('./.testgenignore').toString().split("\r").join('').split("\n");
console.log('Ignoring paths:', ignoredPaths);

const jsFilesInDir = function jsFilesInDir(dir) {
  return readDir(dir, '.js$');
};

const createTestFilesForDir = function createTestFilesForDir(dir) {
  jsFilesInDir(dir)
    .then((files) => {
      const testFileNames = files.map(file => file.replace('.js', '.test.js'));
      console.log('Files found:', files);
      for (let idx = 0; idx < testFileNames.length; idx++) {
        const file = '.\\' + path.join('./', dir, files[idx].replace('.js', '').split('\\').join('/'));
        console.log('File:', file);
        const normalizedPath = file.split('\\').join('/');
        console.log('Normalized Path:', normalizedPath);
        const fullPath = path.resolve(file);
        console.log('Full path', fullPath);
        try {
          const req = require(fullPath);
          console.log('Successfully required:', req);
          console.log('dynamic require', Object.keys(req));
          console.log(file);
          const testFileName = testFileNames[idx];
          const originalFile = files[idx];
          fs.writeFileSync(`__tests__\\${dir}\\${testFileName}`, fileTest(req, normalizedPath, originalFile));
          console.log('Written');
        } catch (e) {
          console.log('Catch!', e);
          console.log('Node\'s path:', path.resolve('.'));
          const jsFile = fs.readFileSync(normalizedPath + '.js').toString().split("\n");
          const matches = [];
          jsFile.forEach((line) => {
            const exportConstMatch = line.match(/export\sconst\s(\w+)\s/);
            if (exportConstMatch) {
              if (exportConstMatch.length > 0) {
                const args = line.match(/export\sconst.+\((.+)\)/) || [];
                console.log('args', args);
                let len;
                if (args[1]) {
                  len = args[1].split(',').length;
                } else {
                  len = 0;
                }
                matches.push({ name: exportConstMatch[1], length: len });
              }
            }
            const exportDefaultMatch = line.match(/export\sdefault\s(\w+)[\s\;\$]/);
            if (exportDefaultMatch && exportDefaultMatch.length > 0) matches.push({ name: exportDefaultMatch[1], length: 0 });
          });
          console.log('matches', matches);
        }
        // write file imports
        // scaffold base description
        // insert test for each file
      }
    });
};
createTestFilesForDir('./');

const directories = function directories(dir, ignore = ignoredPaths) {
  let listing = fs.readdirSync(dir).map(name => path.join(dir, name));
  if (ignore) listing = listing.filter(name => !ignore.includes(name));
  return listing.filter(filePath => fs.lstatSync(filePath).isDirectory());
};

const traverseDirectories = function traverseDirectories(rootPath) {
  directories(rootPath, ignoredPaths).forEach((subPath) => {
    const testPath = path.join('__tests__', subPath);
    makeDir(testPath)
      .then(() => {
        createTestFilesForDir(subPath);
        if (directories(subPath).length !== 0) {
          traverseDirectories(subPath);
        }
      })
      .catch(() => {
        console.log(`Directory ${subPath} already exists`);
        createTestFilesForDir(subPath);
        if (directories(subPath).length !== 0) {
          traverseDirectories(subPath);
        }
      });
  });
};

traverseDirectories('./');
