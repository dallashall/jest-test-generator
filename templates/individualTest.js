const arg = idx => `    const arg${idx} = {};\n`;

const individualTest = function individualTest(fn) {
  let test = `  test('${fn.name || 'anonymousFn'}', () => {\n`;
  const args = [];
  const numArgs = fn.length;
  for (let idx = 0; idx < numArgs; idx += 1) {
    test += arg(idx);
    args.push(`arg${idx}`);
  }
  test += `    const condition = ${fn.name || 'anonymousFn'}(${args.join(', ')});\n`;
  test += '    expect(condition);\n';
  test += '  });\n\n';
  return test;
};

module.exports = individualTest;
