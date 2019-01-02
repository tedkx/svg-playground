(() => {
  const keepNodes = ['polygon', 'polyline', 'path', 'g'];
  const applyStyle = node => {
    node.style.fill = '#f2f2f2';
    node.style.stroke = '#888';
    node.style['stroke-width'] = 1.5;
  };
  let offset = 0;

  for (let i = 0; i < document.rootElement.childElementCount - offset; i++) {
    const child = document.rootElement.children[i];
    if (!keepNodes.includes(child.tagName)) {
      child.remove();
      i--;
    } else if (child.tagName === 'g' && child.getAttribute('id') !== 'layer5') {
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
})();
/*
polygon - points
polyline - points
path - d