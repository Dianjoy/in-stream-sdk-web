//从网上抓取笑话列表
var request = require ('superagent');
var parallel = require('node-parallel');

var tmpl = '<div class="item">' +
          '<div class="title">' +
            '<div class="author">{{author}}</div>' +
            '<div class="date">{{date}}</div>' +
          '</div>' +
          '<div class="content">{{con}}</div>' +
        '</div>';

var p = parallel();

[1, 2, 3, 4].forEach(function(i) {
  p.add(function(done) {
    request
      .get('http://z.turbopush.com/jokelist.php?p=' + i)
      .end(function(err, res) {
        if (err) return done(err);
        var o = JSON.parse(res.text);
        var data = o.data;
        done(null, data);
      })
  })
})

p.done(function(err, results) {
  if(err) throw err;
  var data = flatten(results);
  var html = toHtml(data);
  console.log(html);
})

function toHtml(data) {
  var arr = [];
  data.forEach(function(item) {
    var html = tmpl.replace(/\{\{(\w+)\}\}/g, function(m, key) {
      return item[key];
    });
    arr.push(html);
  });
  return arr.join('\n');
}

function flatten(arr) {
  var res = [];
  arr.forEach(function(a) {
    res = res.concat(a);
  })
  return res;
}
