(() => {
  const keepNodes = ['polygon', 'polyline', 'path', 'g'];
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
      .filter(s => s.replace(/ /g, '').length > 0)
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
  const add = (num, str) => {
    const decimals = Math.max(
      (num.toString().split('.')[1] || []).length,
      ((typeof str === 'string' ? str : str.toString()).split('.')[1] || [])
        .length
    );
    console.log(
      'adding',
      num,
      str,
      'decimals',
      decimals,
      '->',
      parseFloat((num + parseFloat(str)).toFixed(decimals))
    );
    return parseFloat((num + parseFloat(str)).toFixed(decimals));
  };

  const moveTo = ([x, y]) => ({ x: parseFloat(x), y: parseFloat(y) });
  const lineTo = ([x, y], current) => ({
    x: add(current.x, x),
    y: add(current.y, y),
  });
  const horizontalLineTo = ([x], current) => ({
    x: add(current.x, x),
    y: current.y,
  });
  const verticalLineTo = ([y], current) => ({
    x: current.x,
    y: add(current.y, y),
  });
  const curveTo = ([x1, y1, x2, y2, x, y], current) =>
    console.log('curve', x1, '|', y1, '|', x2, '|', y2, '|', x, '|', y) || {
      x: add(current.x, x),
      y: add(current.y, y),
      other: { x1, y1, x2, y2 },
    };
  const smoothCurveTo = ([x1, y1, x, y], current) => ({
    x: add(current.x, x),
    y: add(current.y, y),
    other: { x1, y1 },
  });
  const closePath = (arg, current, first) => ({ x: first.x, y: first.y });

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

  window.paths = [];

  const appendSvg = pathText => {
    if (!document.querySelector('svg')) {
      const svg = document.createElement('div');
      svg.innerHTML = '<svg viewBox="0 0 1265.748 1073.786"></svg>';
      document.querySelector('body').appendChild(svg.children[0]);
    }

    const newNode = document.createElement('div');
    newNode.innerHTML =
      '<path xmlns="http://www.w3.org/2000/svg" ' +
      'fill="#FA8072" stroke="#161313" stroke-width="0.75" d="' +
      pathText +
      '" ' +
      'style="fill: rgb(242, 242, 242); color: rgb(0, 0, 0); clip-rule: nonzero; display: inline; overflow: visible; visibility: visible; opacity: 1; isolation: auto; mix-blend-mode: normal; color-interpolation: srgb; color-interpolation-filters: linearrgb; fill-opacity: 1; fill-rule: nonzero; stroke: rgb(136, 136, 136); stroke-width: 1.5; stroke-linecap: butt; stroke-linejoin: round; stroke-miterlimit: 10; stroke-dasharray: none; stroke-dashoffset: 0; stroke-opacity: 1; color-rendering: auto; image-rendering: auto; shape-rendering: auto; text-rendering: auto;"></path>';
    document.querySelector('svg').appendChild(newNode.children[0]);
  };

  window.svgToPoints = () => {
    const points = [];
    const root = document.querySelector('svg');
    for (let child of root.children) {
      const raw = child.getAttribute(
        child.tagName === 'polygon' || child.tagName === 'polyline'
          ? 'points'
          : 'd'
      );
      let mode = 'commands';
      let instructions = raw.split(/(?=[mlhvcsqtaz])/i);
      if (instructions.length <= 1) {
        instructions = raw.split(/ /g);
        mode = 'absolute';
      }
      instructions = instructions.filter(i => i.replace(/\s/g, '').length > 0);
      for (let instruction of instructions) {
        //if (mode === 'absolute') console.log('INSTRUCTION', instruction);
        const cmd = instruction[0].toLowerCase();
        const current = points[points.length - 1];
        const argSets = split(instruction.substr(1), max[cmd]);
        console.log(instruction, ' argset ', argSets);
        for (let args of argSets) {
          if (mode === 'absolute') {
            const [x, y] = args;
            points.push({ x: parseFloat(x), y: parseFloat(y) });
          } else if (commands[cmd]) {
            if (cmd === 'c') console.log('FULL', instruction);
            points.push({
              ...commands[cmd](args, current, points[0]),
              //   cmd,
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
              raw.split(/(?=[mlhvcsqtaz])/i)
            );
            throw '';
          }
        }
      }

      window.paths.push(points);
      break;
    }
  };

  window.pointsToSvg = paths => {
    const neg = y => (y >= 0 ? ',' : '') + (y * 1.0).toString(); //.toFixed(4).replace(/\.0+$/, '');
    let pathText = '';
    let prevPoint = null;
    if (!paths) paths = window.paths;
    for (let path of paths) {
      for (let point of path) {
        pathText +=
          prevPoint === null
            ? `M${point.x}${neg(point.y)}`
            : ' l' +
              [
                add(point.x, prevPoint.x * -1),
                neg(add(point.y, prevPoint.y * -1)),
              ].join('');
        prevPoint = point;
      }
      appendSvg(pathText);
    }
  };

  window.pointsToSvgExact = paths => {
    const neg = y => (y >= 0 ? ',' : '') + (y * 1.0).toString(); //.toFixed(4).replace(/\.0+$/, '');
    let pathText = '';
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

      appendSvg(pathText);
    }
  };
})();
