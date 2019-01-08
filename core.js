(() => {
  //const keepNodes = ['polygon', 'polyline', 'path', 'g'];
  const keepNodes = ['path'];
  const applyStyle = node => {
    node.style.fill = '#f2f2f2';
    node.style.stroke = '#888';
    node.style['stroke-width'] = 1.5;
  };
  let offset = 0;

  window.preformat = () => {
    for (let i = 0; i < document.rootElement.childElementCount - offset; i++) {
      const child = document.rootElement.children[i];
      if (!keepNodes.includes(child.tagName)) {
        child.remove();
        i--;
      } else if (
        child.tagName === 'g' &&
        child.getAttribute('id') !== 'layer5'
      ) {
        child.remove();
        i--;
      } else if (child.tagName === 'g') {
        while (child.children[0]) {
          applyStyle(child.children[0]);
          document.rootElement.appendChild(child.children[0]);
        }
      } else if (child.childElementCount > 0) {
        child.remove();
        i--;
      } else {
        applyStyle(child);
      }
    }
  };

  const split = (str, max) => {
    const sets = [];
    var all = str
      .split(/(?=[,-\s])/)
      .filter(s => ![',', ''].includes(s.replace(/ /g, '')))
      .map(s => (s[0] === ',' ? s.substr(1) : s).trim());
    if (all.length <= max) return [all];
    let curr = 0;
    for (let s of all) {
      if (sets[curr] && sets[curr].length >= max) curr++;
      if (!sets[curr]) sets[curr] = [];
      sets[curr].push(s);
    }
    return sets;
  };
  const add = (num, str, absolute) => {
    if (absolute === true) return parseFloat(str);
    const decimals = Math.max(
      (num.toString().split('.')[1] || []).length,
      ((typeof str === 'string' ? str : str.toString()).split('.')[1] || [])
        .length,
    );

    const result = parseFloat((num + parseFloat(str)).toFixed(decimals));
    if (isNaN(result))
      throw `NaN result num ${num} str ${str} decimals ${decimals}`;

    return result;
  };

  const moveTo = ([x, y]) => ({ x: parseFloat(x), y: parseFloat(y) });
  const lineTo = ([x, y], current, absolute, first) => ({
    x: add(current.x, x, absolute),
    y: add(current.y, y, absolute),
  });
  const horizontalLineTo = ([x], current, absolute, first) => ({
    x: add(current.x, x, absolute),
    y: current.y,
  });
  const verticalLineTo = ([y], current, absolute, first) => ({
    x: current.x,
    y: add(current.y, y, absolute),
  });
  const curveTo = ([x1, y1, x2, y2, x, y], current, absolute) => ({
    x: add(current.x, x, absolute),
    y: add(current.y, y, absolute),
    other: { x1, y1, x2, y2 },
  });
  const smoothCurveTo = ([x1, y1, x, y], current, absolute, first) => ({
    x: add(current.x, x, absolute),
    y: add(current.y, y, absolute),
    other: { x1, y1 },
  });
  const closePath = (arg, current, absolute, first) => ({
    x: first.x,
    y: first.y,
  });

  const commands = {
    m: moveTo,
    l: lineTo,
    h: horizontalLineTo,
    c: curveTo,
    v: verticalLineTo,
    z: closePath,
    s: smoothCurveTo,
  };
  const max = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, z: 0 };

  window.writeSvg = elements => {
    //console.log('elements!', elements);
    const body = document.querySelector('body');
    while (body.children[0]) body.children[0].remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1265.748 1073.786');
    document.querySelector('body').appendChild(svg);

    let i = 0;
    for (let element of elements) {
      i++;
      const newPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      newPath.setAttribute('fill', '#FA8072');
      newPath.setAttribute('stroke', '#161313');
      newPath.setAttribute('stroke-width', '#2');
      newPath.setAttribute('d', element.path);
      newPath.setAttribute('id', element.id || i);
      element.name && newPath.setAttribute('data-name', element.name);
      element.fullName && newPath.setAttribute('data-full-name', element.fullName);
      newPath.setAttribute(
        'style',
        'fill: rgb(242, 242, 242); color: rgb(0, 0, 0); clip-rule: nonzero; display: inline; overflow: visible; visibility: visible; opacity: 1; isolation: auto; mix-blend-mode: normal; color-interpolation: srgb; color-interpolation-filters: linearrgb; fill-opacity: 1; fill-rule: nonzero; stroke: rgb(136, 136, 136); stroke-width: 1.5; stroke-linecap: butt; stroke-linejoin: round; stroke-miterlimit: 10; stroke-dasharray: none; stroke-dashoffset: 0; stroke-opacity: 1; color-rendering: auto; image-rendering: auto; shape-rendering: auto; text-rendering: auto',
      );
      newPath.addEventListener('click', e =>
        alert(`clicked path ${e.target.getAttribute('data-name')} (${e.target.getAttribute('data-full-name')})`),
      );
      newPath.addEventListener('mouseover', e => {
        e.target.setAttribute('stroke', '#991313');
        e.target.style['stroke'] = 'rgb(200, 136, 136)';
        e.target.style['stroke-width'] = '2.5';
        e.target.style['fill'] = 'rgb(255, 242, 242)';
      });
      newPath.addEventListener('mouseleave', e => {
        e.target.setAttribute('stroke', '#161313');
        e.target.style['stroke'] = 'rgb(136, 136, 136)';
        e.target.style['stroke-width'] = '1.5';
        e.target.style['fill'] = 'rgb(242, 242, 242)';
      });
      svg.appendChild(newPath);
    }
  };

  window.convert = () => {
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

    const latlngToScreenXY = (lat, lng) => {
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

    console.log('topLeft', topLeft, 'bottomRight', bottomRight);
    const coords = window.coords;
    const path = [];
    for (let coord of coords) {
      path.push(latlngToScreenXY(coord[0], coord[1]));
    }
    console.log('path', path);
    window.paths = [path];
  };

  window.svgToPoints = () => {
    const root = document.querySelector('svg');
    const expoReg = /(\d+)e(-?)(\d+)/g;
    for (let child of root.children) {
      //for (let child of Array.from(root.children).slice(12, 13)) {
      const points = [];
      const raw = child.getAttribute(
        child.tagName === 'polygon' || child.tagName === 'polyline'
          ? 'points'
          : 'd',
      );
      let mode = 'commands';
      let instructions = raw.split(/(?=[mlhvcsqtaz])/i);
      if (instructions.length <= 1) {
        instructions = raw.split(/ /g);
        mode = 'absolute';
      }
      instructions = instructions
        .filter(i => i.replace(/\s/g, '').length > 0)
        .map(i => {
          while ((m = expoReg.exec(i))) {
            console.log('exp found', m);
            i = i.replace(
              m[0],
              Math.pow(
                parseInt(m[1]),
                parseInt(m[3]) * (m[2] === '-' ? -1 : 1),
              ).toString(),
            );
          }
          return i;
        });

      for (let instruction of instructions) {
        //if (mode === 'absolute') console.log('INSTRUCTION', instruction);
        let cmd = instruction[0].toLowerCase();
        const argSets = split(instruction.substr(1), max[cmd]);
        for (let i = 0; i < argSets.length; i++) {
          const args = argSets[i];
          if (mode === 'absolute') {
            const [x, y] = args;
            points.push({ x: parseFloat(x), y: parseFloat(y) });
          } else if (commands[cmd]) {
            //if (cmd === 'c') console.log('FULL', instruction);
            if (cmd === 'm' && i > 0) cmd = 'l';
            points.push({
              ...commands[cmd](
                args,
                points[points.length - 1],
                instruction[0].toUpperCase() === instruction[0],
                points[0],
              ),
              cmd,
              //   i: args,
            });
          } else {
            console.error(
              'unknown command',
              cmd,
              'for',
              args,
              'mode',
              mode,
              'full',
              raw.split(/(?=[mlhvcsqtaz])/i),
            );
            throw '';
          }
          // console.log(
          //   'instruction',
          //   instruction,
          //   'translated to',
          //   points[points.length - 1],
          // );
        }
      }

      window.paths.push(points);
      //if (window.paths.length === 5) break;
    }
  };

  window.pointsToSvg = paths => {
    const neg = y => (y >= 0 ? ',' : '') + (y * 1.0).toString(); //.toFixed(4).replace(/\.0+$/, '');
    const elements = [];
    if (!paths) paths = window.paths;
    for (let path of paths) {
      let pathText = '';
      let prevPoint = null;
      for (let point of path) {
        pathText +=
          prevPoint === null || point.cmd === 'm' || point.cmd === 'M'
            ? `M${point.x}${neg(point.y)}`
            : point.cmd === 'z'
            ? ' z'
            : ' l' +
              [
                add(point.x, prevPoint.x * -1),
                neg(add(point.y, prevPoint.y * -1)),
              ].join('');
        prevPoint = point;
      }
      elements.push({ path: pathText });
    }

    writeSvg(elements);
  };

  window.pointsToSvgExact = paths => {
    const neg = y => (y >= 0 ? ',' : '') + (y * 1.0).toString(); //.toFixed(4).replace(/\.0+$/, '');
    let pathText = '';
    const pathTexts = [];
    let prevPoint = null;
    if (!paths) paths = window.paths;
    for (let points of path) {
      for (let point of points) {
        pathText +=
          '  ' +
          (point.cmd === 'm' ? 'M' : point.cmd) +
          (point.cmd === 'm'
            ? [point.x, point.y]
            : point.cmd === 'h'
            ? [add(point.x, prevPoint.x * -1)]
            : point.cmd === 'v'
            ? [add(point.y, prevPoint.y * -1)]
            : point.cmd === 'c'
            ? [
                point.other.x1,
                point.other.y1,
                point.other.x2,
                point.other.y2,
                add(point.x, prevPoint.x * -1),
                add(point.y, prevPoint.y * -1),
              ]
            : [add(point.x, prevPoint.x * -1), add(point.y, prevPoint.y * -1)]
          )
            .map((s, i) => (i > 0 ? neg(s) : s))
            .join('');
        prevPoint = point;
      }

      pathTexts.push(pathText);
    }
  };
})();
