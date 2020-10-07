const clc = require('cli-color');
const ansiStrip = require('cli-color/strip');
const trace = require('./trace');

const connectionId = function (data) {
  const { src, tgt } = data;

  if (src.process) {
    return `${src.process} ${src.port.toUpperCase()} -> ${tgt.port.toUpperCase()} ${tgt.node}`;
  }
  return `-> ${tgt.port.toUpperCase()} ${tgt.node}`;
};

const renderText = function (msg, options = {}) {
  if (msg.protocol !== 'network') { return null; }

  const identifier = function (data) {
    const id = connectionId(data);
    let result = '';
    if (data.subgraph) { result += `${clc.magenta.italic(data.subgraph.join(':'))} `; }
    result += clc.blue.italic(id);
    return result;
  };

  if (msg.error) {
    return `TRACE ERROR: ${msg.error}`;
  }

  const data = msg.payload;
  let text = (() => {
    switch (msg.command) {
      case 'connect': return `${identifier(data)} ${clc.yellow('CONN')}`;
      case 'disconnect': return `${identifier(data)} ${clc.yellow('DISC')}`;
      case 'begingroup': return `${identifier(data)} ${clc.cyan(`< ${data.group}`)}`;
      case 'endgroup': return `${identifier(data)} ${clc.cyan(`> ${data.group}`)}`;
      case 'data':
        if (options.verbose) {
          return `${identifier(data)} ${clc.green('DATA')} ${data.data}`;
        }
        return `${identifier(data)} ${clc.green('DATA')}`;

      default: return null;
    }
  })();

  if (!(typeof process !== 'undefined' && process !== null ? process.stdout.isTTY : undefined)) {
    // in case we are redirected to a file or similar
    text = ansiStrip(text);
  }

  return text;
};

exports.main = function () {
  const filepath = process.argv[2];

  const options = { verbose: true };

  return trace.loadFile(filepath, (err, tr) => {
    if (err) { throw err; }
    // TODO: Render graphs to FBP?
    const result = [];
    tr.events.forEach((e) => {
      const text = renderText(e, options);
      if (text) { result.push(console.log(text)); } else {
        result.push(undefined);
      }
    });
    return result;
  });
};