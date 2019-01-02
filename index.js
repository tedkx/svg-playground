const simplify = require('simplify-js');
const fs = require('fs');
const paths = JSON.parse(fs.readFileSync('input.json'));

const output = [];
for (let points of paths) output.push(simplify(points));

fs.writeFileSync('output.json', JSON.stringify(output), 'utf8');
