
var CORS_PROXY = 'http://cors.io/';

var done = function(){
  status.innerHTML = "OK";
};

var error = function(err){
  status.innerHTML = "Can't visualize document due to error (error: " +
    err.error + "; reason: " + err.reason + ")";
  done();
  return;
};

function parseUrl(str) {

  var url = document.createElement('a');
  url.href = str;
  var path = url.pathname.split('/');

  // Remove '' cause by preceeding /
  path.shift();

  url.db = path.shift();
  url.doc = path.join('/');

  url.dbUrl = url.protocol + '//' + url.hostname + '/' + url.db;

  return url;
}

function initDB(dbUrl, callback) {

  new Pouch(dbUrl, function(err, db) {

    // Likely a CORS problem
    if (err && err.status === 0) {
      dbUrl = CORS_PROXY + dbUrl.replace(/^https?:\/\//, '');
      return new Pouch(dbUrl, callback);
    }

    callback(err, db);
  });
}

function formSubmitted(e) {

  e.preventDefault();

  var url = parseUrl(document.getElementById('url').value);

  initDB(url.dbUrl, function(err, db) {

    if (err) {
      return error(err);
    }

    visualizeRevTree(db, url.doc, function(err, box) {
      if(err) {
        return error(err);
      }

      status.innerHTML = "OK";
      var svg = box.getElementsByTagName('svg')[0];
      svg.style.width = svg.getAttribute('viewBox').split(' ')[2] * 7 + 'px';
      svg.style.height = svg.getAttribute('viewBox').split(' ')[3] * 7 + 'px';
      svg.style.border = '2px solid';
      document.body.appendChild(box);
      done();
    });
  });
}

function exportDocs(e) {

  e.preventDefault();

  var url = parseUrl(document.getElementById('url').value);

  initDB(url.dbUrl, function(err, db) {

    if (err) {
      return error(err);
    }

    db.get(url.doc, {revs: true, open_revs: "all"}, function(err, results) {
      var docs = [];
      results.forEach(function(row){
        docs.push(row.ok);
      });
      console.log("Exported docs: ", JSON.stringify(docs));
      console.log("Pouchdb format: ", "db.bulkDocs({docs:" +
                  JSON.stringify(docs) +
                  "}, {new_edits:false}, function(err, res){})");
      done();
    });
  });

}

document.getElementById('form').addEventListener('submit', formSubmitted);
document.getElementById('export').addEventListener('click', exportDocs);
