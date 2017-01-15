const adler32 = require('./adler32');

const TAG_END = /\/?>/;
const COMMENT_START = /^<\!\-\-/;


const ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: markup => {
    const checksum = adler32(markup);

    // Add checksum (handle both parent tags, comments and self-closing tags)
    if (COMMENT_START.test(markup)) {
      return markup;
    } else {
      return markup.replace(
        TAG_END,
        ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '"$&'
      );
    }
  },
  checksum(markup) {
    return adler32(markup);
  }
};

module.exports = ReactMarkupChecksum;
