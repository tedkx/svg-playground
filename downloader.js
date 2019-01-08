const axios = require('axios');
const fs = require('fs');

const outputFile = 'areas.json';

const areas = [];
const maxId = 74;

let currentId = 1;

const parseResponse = response => {
  const { errorCode, errorDecsr, extAreaList } = response.data;
  console.log(
    'received data',
    errorCode,
    errorDecsr,
    Array.isArray(extAreaList) ? (extAreaList[0] || {}).fullName : null,
  );
  if (errorCode === 0) {
    const { polygons, id, name, fullName } = extAreaList[0];
    areas.push({ fullName, id, name, polygons });
    fs.writeFileSync(outputFile, JSON.stringify(obj), 'utf8');
  }

  currentId++;
  if (currentId <= maxId) setTimeout(fetchArea, 1000);
};

const fetchArea = () => {
  console.log('fetching area', currentId);
  axios
    .get(
      'http://localhost/api/mymaps/getextareapolygons?extAreaIds=' + currentId,
    )
    .then(parseResponse);
};

fetchArea();
