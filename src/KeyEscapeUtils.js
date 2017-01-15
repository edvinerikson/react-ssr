/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */
function escape(key) {
  const escapeRegex = /[=:]/g;
  const escaperLookup = {
    '=': '=0',
    ':': '=2',
  };
  const escapedString = ('' + key).replace(escapeRegex, match => escaperLookup[match]);
  return '$' + escapedString;
}

/**
 * Unescape and unwrap key for human-readable display
 *
 * @param {string} key to unescape.
 * @return {string} the unescaped key.
 */
function unescape(key) {
  const unescapeRegex = /(=0|=2)/g;
  const unescaperLookup = {
    '=0': '=',
    '=2': ':',
  };
  const keySubstring = (key[0] === '.' && key[1] === '$')
    ? key.substring(2) : key.substring(1);

  return ('' + keySubstring).replace(unescapeRegex, match => unescaperLookup[match]);
}

const KeyEscapeUtils = {
  escape,
  unescape,
};

module.exports = KeyEscapeUtils;
