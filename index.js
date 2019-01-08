// const inputFile = 'input.json';
// const outputFile = 'output.json';
const inputFile = 'serverInput.json';
const outputFile = 'serverOutput.json';

const simplify = require('simplify-js');
const fs = require('fs');
const paths = JSON.parse(fs.readFileSync(inputFile));
console.log('paths', paths);

const output = [];
for (let points of paths)
  output.push(
    simplify(
      points.map(p => ({
        x: p[0],
        y: p[1],
      })),
      2,
    ),
  );

//fs.writeFileSync(outputFile, JSON.stringify(output), 'utf8');

let str = '';
for (let points of paths)
  for (let point of points) str += `${point[0]},${point[1]}\n`;

fs.writeFileSync(outputFile, str, 'utf8');
