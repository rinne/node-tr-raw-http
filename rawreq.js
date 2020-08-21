'use strict';

const Http = require('http');
const Https = require('https');
const crypto = require('crypto');
const u = require('url');
const KeepTime = require('keeptime');

const readBody = require('./body.js');

function rawReq(url, options) {
	var http, urlParsed, opts, req, res;
	return (Promise.resolve()
			.then(function() {
				urlParsed = u.parse(url);
				//console.log(urlParsed);
				switch (urlParsed.protocol) {
				case 'http:':
					http = Http;
					break;
				case 'https:':
					http = Https;
					break;
				default:
					throw new Error('Validator called with invalid URL');
				}
				opts = {
					method: null,
					host: urlParsed.hostname, // Sic!
					port: urlParsed.port ? urlParsed.port : undefined,
					path: urlParsed.path,
					auth: null,
					headers: null,
					body: null,
					timeout: null,
					requestTimeout: 60000,
					payloadMaxSize: 1048576,
					payloadEncoding: 'buffer'
				};
				if (options) {
					opts = Object.assign(opts, options);
					if (options.headers) {
						opts.headers = Object.assign({}, opts.headers);
					} else {
						opts.headers = {};
					}
				}
				if (opts.body || (opts.body === '')) {
					if (! ((typeof(opts.body) === 'string') || Buffer.isBuffer(opts.body))) {
						throw new Error('Bad payload type');
					}
					if (opts.body.length == 0) {
						opts.body = null;
					}
				}
				if (! opts.method) {
					opts.method = (opts.body || (opts.body === '')) ? 'POST' : 'GET';
				}
				if (opts.requestTimeout && (! opts.timeout)) {
					opts.timeout = opts.requestTimeout;
				}
				return new Promise(function(resolve, reject) {
					var completed = false;
					var ro = {};
					[ 'method',
					  'host',
					  'port',
					  'path',
					  'auth',
					  'timeout',
					  'headers',
					  'agent',
					  'key',
					  'cert',
					  'family',
					  'localAddress',
					  'defaultPort',
					  'setHost'].forEach(function(k) {
						  if (! ((opts[k] === undefined) || (opts[k] === null))) {
							  ro[k] = opts[k];
						  }
					  });
					//console.log(ro);
					req = http.request(ro, function(r) {
						if (completed) {
							return;
						}
						completed = true;
						res = r;
						resolve();
					});
					req.on('error', function(e) {
						if (completed) {
							return;
						}
						completed = true;
						reject(e);
					});
					req.on('aborted', function(e) {
						if (completed) {
							return;
						}
						completed = true;
						reject(new Error('Aborted'));
					});
					req.on('close', function() {
					});
					if (opts.body) {
						req.write(opts.body);
					}
					req.end();
				});
			})
			.then(function() {
				var len = res.headers['content-length'];
				if ((typeof(len) === 'string') &&
					(len.match(/^(0|[1-9][0-9]{1,12})$/))) {
					len = Number.parseInt(len);
				} else {
					len = undefined;
				}
				if (len && opts.payloadMaxSize && (len > opts.payloadMaxSize)) {
					throw new Error('Request payload too big');
				}
				return (readBody(res,
								 len,
								 opts.payloadMaxSize,
								 opts.requestTimeout));
			})
			.then(function(ret) {
				var body = ((opts.payloadEncoding && (opts.payloadEncoding !== 'buffer')) ?
							ret.toString(opts.payloadEncoding) :
							ret);
				return { statusCode: res.statusCode,
						 statusMessage: res.statusMessage,
						 headers: Object.assign({}, res.headers),
						 rawHeaders: Object.assign({}, res.rawHeaders),
						 body: body,
						 httpVersionMajor: res.httpVersionMajor,
						 httpVersionMinor: res.httpVersionMinor,
						 httpVersion: res.httpVersion };
			})
			.catch(function(e) {
				if (req) {
					req.abort();
					req = undefined;
				}
				throw e;
			}));
}

module.exports = rawReq;
