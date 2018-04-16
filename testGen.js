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
console.log(ignoredPaths);

const jsFilesInDir = function jsFilesInDir(dir) {
  return readDir(dir, '.js$');
};

const createTestFilesForDir = function createTestFilesForDir(dir) {
  jsFilesInDir(dir)
    .then((files) => {
      const testFileNames = files.map(file => file.replace('.js', '.test.js'));
      for (let idx = 0; idx < files.length; idx++) {
        const file = '.\\' + path.join('./', dir, files[idx].replace('.js', '').split('\\').join('/'));
        const normalizedPath = file.split('\\').join('/');
        const req = require(normalizedPath);
        console.log('dynamic require', Object.keys(req));
        const testFileName = testFileNames[idx];
        const originalFile = files[idx];
        fs.writeFileSync(`__tests__\\${dir}\\${testFileName}`, fileTest(req, normalizedPath, originalFile));
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
