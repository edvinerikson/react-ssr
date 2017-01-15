const MOD = 65521;

function adler32(data) {
  var a = 1;
  var b = 0;
  var i = 0;
  var l = data.length;
  var m = l & ~0x3;
  while (i < m) {
    var n = Math.min(i + 4096, m);
    for (; i < n; i += 4) {
      b += (
        (a += data.charCodeAt(i)) +
        (a += data.charCodeAt(i + 1)) +
        (a += data.charCodeAt(i + 2)) +
        (a += data.charCodeAt(i + 3))
      );
    }
    a %= MOD;
    b %= MOD;
  }
  for (; i < l; i++) {
    b += (a += data.charCodeAt(i));
  }
  a %= MOD;
  b %= MOD;
  return a | (b << 16);
}

module.exports = adler32;
