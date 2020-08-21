'use strict';

const crypto = require('crypto');
const KeepTime = require('keeptime');

const rr = require('../index.js');

(function() {
	var srv, reqno = 0, url;
	return (Promise.resolve()
			.then(function() {
				return new Promise(function(resolve, reject) {
					crypto.randomBytes(5, function(e, b) {
						if (e) {
							return reject(e);
						}
						return resolve(b);
					});
				});
			})
			.then(function(ret) {
				return { host: ('127' +
								'.' +
								((ret[0] | 1) & 127).toString() +
								'.' +
								((ret[1] | 1) & 127).toString() +
								'.' +
								((ret[2] | 1) & 127).toString()),
						 port: (((ret[3] << 8) | ret[4]) | (1 << 15)) & (~1) };
			})
			.then(function(ret) {
				url = 'http://' + ret.host + ':' + ret.port + '/';
				return ret;
			})
			.then(function(ret) {
				console.log('Hello from ' + url);
				function cb(req, res) {
					reqno++;
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.write('Hello from ' + url);
					res.write("\n");
					res.write('Request #' + reqno);
					res.write("\n");
					res.end();
				}
				function ee(e) {
					console.log('ERROR!');
					console.log(e);
					process.exit(1);
				}
				srv = new rr.RawSrv(ret.host, ret.port, cb);
				srv.on('error', ee);
				return Promise.resolve();
			})
			.then(function() {
				var kt = new KeepTime(true);
				return Promise.all( [ rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  rr.rawReq(url).then(function(x) { console.log(x); return x; }).catch(function(e) { throw e; }),
									  new Promise(function(resolve, reject) {
										  function tt() {
											  if (reqno >= 16) {
												  return resolve();
											  }
											  console.log(kt.get());
											  if (kt.get() > 30) {
												  return reject(new Error('Server timeout'));
											  }
											  setTimeout(tt, 500);
										  }
										  tt();
									  }),
									] );
			})
			.then(function(ret) {
				srv.close();
				srv = undefined;
				//console.log(ret);
				console.log('All OK');
			})
			.catch(function(e) {
				console.log('ERROR!');
				console.log(e);
				process.exit(1);
			}));
})();

	 

/*
var srv;
srv = new RawSrv('127.0.0.1', 12321, cb);
srv.on('error', function(e) {
	console.log('Unable to start server.');
	console.log(e);
	process.exit(1);
});
console.log(srv);

function cb(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(JSON.stringify(req.headers, null, 2));
	return true;
}
*/
