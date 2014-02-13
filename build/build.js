(function() {
var modules = {};
var dependency = {};
var require = function(name) {
  return modules[name];
}

var factories = {};
var mods = [];

var define = function(id, fn) {
  mods.push(id);
  factories[id] = function() {
    var module = {};
    module.exports = {};
    fn(module, module.exports);
    modules[id] = module.exports;
  }
}

/**
 * check if all element in a is in b
 * @param {String} a
 * @param {String} b
 * @api public
 */
function within(a, b) {
  for (var i = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) === -1) return false;
  }
  return true;
}

function run() {
  var called = [];
  var l = mods.length;
  while (l > 0) {
    var j = l;
    for (var i = 0; i < l; i++) {
      var id = mods[i];
      var deps = dependency[id];
      if (within(deps, called)) {
        factories[id].call(null);
        called.push(id);
        mods.splice(i, 1);
        l = l - 1;
      }
    }
    if (j !== 0 && j === l) throw new Error('circle dependency');
  }
}
define('api', function(module, exports){
var request = require('request');
var jsonp = require('jsonp');
var util = require('util');
var send = require('native').send;
var md5 = require('md5');

var LIST_URL, NOTICE_URL;
LIST_URL = 'http://n.dianjoy.com/dev/api/lobster/adlist.php';
NOTICE_URL = 'http://n.dianjoy.com/dev/api/lobster/show.php';

var device_info = window.device_info;

var ready;
document.addEventListener("DOMContentLoaded", function(event) {
  ready = true;
});

//异步获取设备信息，只调用一次
function getDeviceInfo(fn) {
  if(device_info) return fn(null, device_info);
  function load() {
    send('dollar://deviceinfo', function(err, str) {
      if(err) return fn(err);
      device_info = util.parse(str);
      fn(null, device_info);
    })
  }
  if (ready) {
    load();
  } else {
    document.addEventListener("DOMContentLoaded", function(event) {
      load();
    });
  }
}

/**
 * 获取广告列表
 * @param {String} cb
 * @api public
 */
exports.list = function(cb) {
  getDeviceInfo(function(err, info) {
    if (err) throw err;
    info['output'] = 'JSONP';
    jsonp(LIST_URL, info, cb);
  })
}

/**
 * 曝光通知接口
 * @param {String} ad_id
 * @param {String} cb
 * @api public
 */
exports.notice = function(ad_id, cb) {
  getDeviceInfo(function(err, info) {
    if (err) return cb(err);
    var source = info['device_id'] + ad_id + 'dianjoyjoy&*$';
    jsonp(NOTICE_URL, {
      output: 'jsonp',
      device_id: info['device_id'],
      imsi: info['imsi'],
      os_version: info['os_version'],
      app_id: info['app_id'],
      token: md5(source),
      ad_id: ad_id
    }, cb);
  })
}

exports.download = function(url) {
  getDeviceInfo(function(err, info) {
    send('dollar://download', {
      url: url
    },function(err) {
      if(err) throw err;
    })
  })
}
})
define('jsonp', function(module, exports){
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
})
define('logic', function(module, exports){
var util = require('util');
var inviewport = util.inviewport;
var throttle = util.throttle;
var api = require('api');
var noticed = [];
var advs = [];
var all_advs = [];
var styles = window.getComputedStyle;

//获取广告列表
api.list(function(err, data) {
  if (err) throw err;
  all_advs = data.offers;
  var divs = document.querySelectorAll('.sexy_ad');
  //console.log('ads length:' + ads.length);
  //console.log('divs length:' + divs.length);
  for (var i = 0; i < divs.length; i++) {
    if (all_advs[i]) {
      addAd(divs[i], all_advs[i]);
    }
  }
})

//function log(str) {
//  var result = document.getElementById('result');
//  result.innerHTML = result.innerHTML + '\r\n' + str;
//}

function checkAd(ad) {
  var id = ad.ad_id;
  //return if noticed
  if (noticed.indexOf(id) !== -1) return;
  var node = ad.node;
  var shown = inviewport(node, 20);
  if (shown) {
    noticed.push(id);
    api.notice(id, function(err) {
      if(err) throw err;
      //log('noticed: ' + id);
    })
  }
}

window.addEventListener('scroll', throttle(function() {
  var divs = document.querySelectorAll('.sexy_ad');
  for (var i = 0; i < divs.length; i++) {
    var node = divs[i];
    //ad not included
    if (node.childNodes.length === 0) {
      var adv = all_advs[advs.length];
      if (!adv) return;
      addAd(node, adv)
    }
  }
  for ( i = 0; i < advs.length; i++) {
    var ad = advs[i];
    checkAd(ad);
  }
}, 100))

function addAd(node, ad) {
  //banner_url 图片
  //download 下载链接
  var width = styles(node).width;
  var link = document.createElement('a');
  link.href = '#';
  node.appendChild(link);
  link.style.display = 'block';
  link.style.outline = 'none';
  link.style.boxShadow = 'none';
  link.style.textDecoration = 'none';
  var img = document.createElement('img');
  img.width = parseInt(width, 10);
  img.src = ad.banner_url;
  link.appendChild(img);
  link.addEventListener('click', function(e) {
    e.preventDefault();
    api.download(ad.download);
  })
  ad.node = img;
  advs.push(ad);
  img.onload = function() {
    checkAd(ad);
  }
}
})
define('md5', function(module, exports){
/**
*
*  MD5 (Message-Digest Algorithm)
*  http://www.webtoolkit.info/
*
**/
 
var MD5 = function (string) {
 
	function RotateLeft(lValue, iShiftBits) {
		return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
	}
 
	function AddUnsigned(lX,lY) {
		var lX4,lY4,lX8,lY8,lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
 	}
 
 	function F(x,y,z) { return (x & y) | ((~x) & z); }
 	function G(x,y,z) { return (x & z) | (y & (~z)); }
 	function H(x,y,z) { return (x ^ y ^ z); }
	function I(x,y,z) { return (y ^ (x | (~z))); }
 
	function FF(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function GG(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function HH(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function II(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function ConvertToWordArray(string) {
		var lWordCount;
		var lMessageLength = string.length;
		var lNumberOfWords_temp1=lMessageLength + 8;
		var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
		var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
		var lWordArray=Array(lNumberOfWords-1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while ( lByteCount < lMessageLength ) {
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount-(lByteCount % 4))/4;
		lBytePosition = (lByteCount % 4)*8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
		lWordArray[lNumberOfWords-2] = lMessageLength<<3;
		lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
		return lWordArray;
	};
 
	function WordToHex(lValue) {
		var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
		for (lCount = 0;lCount<=3;lCount++) {
			lByte = (lValue>>>(lCount*8)) & 255;
			WordToHexValue_temp = "0" + lByte.toString(16);
			WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
		}
		return WordToHexValue;
	};
 
	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	};
 
	var x=Array();
	var k,AA,BB,CC,DD,a,b,c,d;
	var S11=7, S12=12, S13=17, S14=22;
	var S21=5, S22=9 , S23=14, S24=20;
	var S31=4, S32=11, S33=16, S34=23;
	var S41=6, S42=10, S43=15, S44=21;
 
	string = Utf8Encode(string);
 
	x = ConvertToWordArray(string);
 
	a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
 
	for (k=0;k<x.length;k+=16) {
		AA=a; BB=b; CC=c; DD=d;
		a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
		d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
		c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
		b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
		a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
		d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
		c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
		b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
		a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
		d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
		c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
		b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
		a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
		d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
		c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
		b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
		a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
		d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
		c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
		b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
		a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
		d=GG(d,a,b,c,x[k+10],S22,0x2441453);
		c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
		b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
		a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
		d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
		c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
		b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
		a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
		d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
		c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
		b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
		a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
		d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
		c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
		b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
		a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
		d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
		c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
		b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
		a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
		d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
		c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
		b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
		a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
		d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
		c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
		b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
		a=II(a,b,c,d,x[k+0], S41,0xF4292244);
		d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
		c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
		b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
		a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
		d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
		c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
		b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
		a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
		d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
		c=II(c,d,a,b,x[k+6], S43,0xA3014314);
		b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
		a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
		d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
		c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
		b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
		a=AddUnsigned(a,AA);
		b=AddUnsigned(b,BB);
		c=AddUnsigned(c,CC);
		d=AddUnsigned(d,DD);
	}
 
	var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
 
	return temp.toLowerCase();
}

module.exports = MD5;
})
define('native', function(module, exports){
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
})
define('request', function(module, exports){

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
})
define('serialize', function(module, exports){

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
})
define('util', function(module, exports){

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
})
dependency['api'] = ['request', 'jsonp', 'util', 'native', 'md5']
dependency['jsonp'] = ['serialize']
dependency['logic'] = ['util', 'api']
dependency['md5'] = []
dependency['native'] = ['serialize']
dependency['request'] = ['serialize']
dependency['serialize'] = []
dependency['util'] = []
run();})();