const fs = require('fs');
const simplify = require('simplify-js');
const simplifyCoeff = 0;
const doSimplify = true;

const areas = JSON.parse(fs.readFileSync('areas.json'));
const newAreas = [];

const topLeft = {
  lat: 41.812126,
  lng: 19.5317643,
  x: 0,
  y: 0,
};
const bottomRight = {
  lat: 34.83857,
  lng: 28.380165,
  x: 1000,
  y: 1000,
};
const earthRadius = 6.371;
const latlngToGlobalXY = (lat, lng) => {
  let x = earthRadius * lng * Math.cos((topLeft.lat + bottomRight.lat) / 2);
  let y = earthRadius * lat;
  return { x: x, y: y };
};
// Calculate global X and Y for top-left reference point
topLeft.pos = latlngToGlobalXY(topLeft.lat, topLeft.lng);
bottomRight.pos = latlngToGlobalXY(bottomRight.lat, bottomRight.lng);

const latlngToScreenXY = ({ lat, lng }) => {
  //Calculate global X and Y for projection point
  let pos = latlngToGlobalXY(lat, lng);
  //Calculate the percentage of Global X position in relation to total global width
  pos.perX = (pos.x - topLeft.pos.x) / (bottomRight.pos.x - topLeft.pos.x);
  //Calculate the percentage of Global Y position in relation to total global height
  pos.perY = (pos.y - topLeft.pos.y) / (bottomRight.pos.y - topLeft.pos.y);

  //Returns the screen position based on reference points
  return {
    x: topLeft.x + (bottomRight.x - topLeft.x) * pos.perX,
    y: topLeft.y + (bottomRight.y - topLeft.y) * pos.perY,
  };
};

let diffx = 0,diffy = 0, numpoints = 0;
const avgDiff = 3.5;
const diffThreshold = 10 * avgDiff;

for(let area of areas) {
    const { fullName, id, name, polygons } = area;
    const paths = [];

    for(let polygon of polygons) {
        let points = polygon.map(p => latlngToScreenXY(p));
        if(doSimplify === true)
            points = simplify(points); 
        paths.push(points.map((p, i) => {
            if(i > 0) {
                const diff = [Math.abs(points[i].x - points[i - 1].x), Math.abs(points[i].y - points[i - 1].y)];
                if(diff[0] > diffThreshold || diff[1] > diffThreshold) {
                    console.log('HUGE DIFF', fullName, diff);
                    return `M${points[i].x},${points[i].y}`;
                }
                // diffx += Math.abs(points[i].x - points[i - 1].x);
                // diffy += Math.abs(points[i].y - points[i - 1].y);
                // numpoints++;
            }
            return `${i === 0 ? 'M' : 'L'}${points[i].x},${points[i].y}`;
            }).join(' '));
    }

    //console.log('polygons', polygons.length, '-> paths', paths.length);

    newAreas.push({
        fullName,
        id,
        name,
        path: paths.join(''),
    })
}

console.log('avgx', (diffx / numpoints).toFixed(3), 'avgy', (diffy / numpoints).toFixed(3));

fs.writeFileSync('svgPaths.js', 'window.elements = ' + JSON.stringify(newAreas), 'utf8');