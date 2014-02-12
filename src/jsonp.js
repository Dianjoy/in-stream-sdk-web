/**
 * Module exports.
 */

module.exports = jsonp;

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
 * JSONP handler
 *
 * @param {String} url
 * @param {Object|Function} optional params
 * @param {Function} optional callback
 */

function jsonp(url, params, fn){
  if ('function' == typeof params) {
    fn = params;
    params = {};
  }


  var timeout = 60000;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName('script')[0] || document.head;
  var script;
  var timer;

  // generate a unique id for this request
  var id = count++;
  params.callback = enc('__jp' + id + '');

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      if (fn) fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    script.parentNode.removeChild(script);
    window['__jp' + id] = noop;
  }

  window['__jp' + id] = function(data){
    if (timer) clearTimeout(timer);
    cleanup();
    if (fn) fn(null, data);
  };

  // add qs component
  url += (url.indexOf('?') !== -1 ? '&' : '?') + serialize(params);
  url = url.replace('?&', '?');

  // create script
  script = document.createElement('script');
  script.src = url;
  target.parentNode.insertBefore(script, target);
}
