
/**
 * check if the element in the viewport
 * @param {Element} el
 * @param {Number} threshold in pixel
 * @api public
 */
exports.inviewport = function (el, threshold) {
  threshold = threshold || 0

  var rect = el.getBoundingClientRect()
  var height = (rect.height || el.clientHeight || 0) + threshold
  var width = (rect.width || el.clientWidth || 0) + threshold

  return rect.top >= - height
    && rect.left >= - width
    && rect.bottom <= height + window.innerHeight
    && rect.right <= width + window.innerWidth
}

/**
 * throttle a function all
 * @param {String} func
 * @param {String} wait in milisecound
 * @api public
 */
exports.throttle = function (func, wait) {
  var rtn; // return value
  var last = 0; // last invokation timestamp
  return function throttled () {
    var now = new Date().getTime();
    var delta = now - last;
    if (delta >= wait) {
      rtn = func.apply(this, arguments);
      last = now;
    }
    return rtn;
  };
}

/**
 * parse a url string to query object
 *
 * @param {String} str
 * @api public
 */
exports.parse = function(str) {
  if ('string' != typeof str) return {};
  str = str.trim();
  if ('' === str) return {};
  if ('?' == str.charAt(0)) str = str.slice(1);

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    obj[parts[0]] = null === parts[1]
      ? ''
      : decodeURIComponent(parts[1]);
  }
  return obj;
}
