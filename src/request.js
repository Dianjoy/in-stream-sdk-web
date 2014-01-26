
var serialize = require('serialize');

/**
 * Send a get request with optional params
 * @param {String} url
 * @param {Object} params [optional]
 * @param {String} done
 * @api public
 */
function request(url, params, done) {
  var xhr = new XMLHttpRequest();
  if (typeof params == 'function') {
    done = params;
    params = null;
  }
  if (params) {
    url += '?' + serialize(params);
  }
  xhr.open('GET', url);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    if ([200, 304, 0].indexOf(xhr.status) === -1) {
      done(new Error('Server responded with a status of ' + xhr.status));
    } else {
      var data = JSON.parse(xhr.responseText);
      done(null, data);
    }
  }
  xhr.send();
}

module.exports = request;
