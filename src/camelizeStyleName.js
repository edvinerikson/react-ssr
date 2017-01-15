const _hyphenPattern = /-(.)/g;
const msPattern = /^-ms-/;

function camelizeStyleName(string) {
  return string
    .replace(_hyphenPattern, (_, character) => character.toUpperCase())
    .replace(msPattern, 'ms-');
}

module.exports = camelizeStyleName;
