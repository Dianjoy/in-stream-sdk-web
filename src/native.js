/**
 * Module exports.
 */

exports.send = send;

var serialize = require('serialize');

/**
 * Callback index.
 */

var count = 0;

/**
 * Noop function.
 */

function noop(){}

/**
 * Send request to native
 *
 * @param {String} url
 * @param {Object|Function} optional params
 * @param {Function} optional callback
 */

function send(url, params, fn){
  if ('function' == typeof params) {
    fn = params;
    params = {};
  }

  var timeout = 1000;
  var enc = encodeURIComponent;
  var timer;

  // generate a unique id for this request
  var id = count++;
  params.callback = enc('__dianjoy' + id + '');

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      if (fn) fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    window['__dianjoy' + id] = noop;
  }

  window['__dianjoy' + id] = function(data){
    if (timer) clearTimeout(timer);
    cleanup();
    if (fn) fn(null, data);
  };

  // add qs component
  url += (url.indexOf('?') !== -1 ? '&' : '?') + serialize(params);
  url = url.replace('?&', '?');
  window.location.href = url;
}
