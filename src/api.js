var request = require('request');
var jsonp = require('jsonp');
var util = require('util');
var send = require('native').send;
var md5 = require('md5');

var LIST_URL, NOTICE_URL;
LIST_URL = 'http://n.dianjoy.com/dev/api/lobster/adlist.php';
NOTICE_URL = 'http://n.dianjoy.com/dev/api/lobster/show.php';

var device_info;

//异步获取设备信息，只调用一次
function getDeviceInfo(fn) {
  if(device_info) return fn(null, device_info);
  send('dollar://deviceinfo', function(err, str) {
    if(err) return fn(err);
    device_info = util.parse(str);
    fn(null, device_info);
  })
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
