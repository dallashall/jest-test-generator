const individualTest = require('./individualTest');

const descTop = name => `describe('${name}', () => {\n`;
const descBottom = '});\n';

const fileTest = function fileTest(req, path, name) {
  const levels = (path.match(/\//g) || []).length;
  let fileString = descTop(name);
  const pathPrefix = '../';
  let pathToOriginal = '';

  for (let i = 0; i < levels; i += 1) {
    pathToOriginal += pathPrefix;
  }
  pathToOriginal += path.replace('./', '');

  if (typeof req === 'function') {
    fileString = `const ${req.name || 'anonymousFn'} = require('${pathToOriginal}');\n${fileString}`;
    fileString += individualTest(req);
  }

  const keys = Object.keys(req);
  const props = [];

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (typeof req[key] === 'function') {
      props.push({
        key,
        test: individualTest(req[key]),
      });
      console.log('adding test for:', key);
      fileString += individualTest(req[key]);
    }
  }

  const fns = props.map(fn => fn.key);
  if (fns.length !== 0) {
    fileString = `const { ${fns.join(', ')} } = require('${pathToOriginal}')\n${fileString}`;
  }
  fileString += descBottom;
  return fileString;
};

module.exports = fileTest;
