
var enc = encodeURIComponent;

function serialize(obj) {
  var pairs = [];
  for (var key in obj) {
    if (null !== obj[key]) {
      pairs.push(enc(key)
        + '=' + enc(obj[key]));
    }
  }
  return pairs.join('&');
}

module.exports = serialize;
