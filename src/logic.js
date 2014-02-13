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
