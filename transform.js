const fs = require('fs');

const data = JSON.parse(fs.readFileSync('areas.json'));
const newData = [];

for (let area of data) {
  const { id, fullName, name, polygons } = area;
  newData.push({
    id,
    fullName,
    name,
    polygons: polygons.map(p => p.borders.map(p => ({ lat: p[0], lng: p[1] }))),
  });
}

fs.writeFileSync('newareas.json', JSON.stringify(newData), 'utf8');
