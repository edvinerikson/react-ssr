const escapeTextContentForBrowser = require('./escapeTextContentForBrowser');
/**
 * Escapes attribute value to prevent scripting attacks.
 *
 * @param {*} value Value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return `"${escapeTextContentForBrowser(value)}"`;
}

module.exports = quoteAttributeValueForBrowser;
