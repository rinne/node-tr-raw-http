'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');

const readBody = require('./body.js');

const defaultOpts = {
	headersTimeout: 5000,
	payloadTimeout: 10000,
	payloadMaxSize: 1048576,
	key: null,
	cert: null
};


function err(res, code, text) {
	res.writeHead(code, { 'Content-Type': 'text/plain' });
	res.write(text);
	res.end("\n");
}

var RawSrv = function(host, port, requestCb, opts) {
    if (! (this instanceof RawSrv)) {
		throw new Error('RawSrv constructor called without new');
	}
	this.opts = Object.assign({ host: host, port: port, requestCb: requestCb }, defaultOpts);
	if (opts) {
		this.opts = Object.assign(this.opts, opts);
	}
	var reqCb = function(req, res) {
		var completed = false;
		return (Promise.resolve()
				.then(function() {
					var len = req.headers['content-length'];
					if ((typeof(len) === 'string') &&
						(len.match(/^(0|[1-9][0-9]{1,12})$/))) {
						len = Number.parseInt(len);
					} else {
						len = undefined;
					}
					if (len && this.opts.payloadMaxSize && (len > this.opts.payloadMaxSize)) {
						err(res, 413, 'Payload too big');
						completed = true;
						throw new Error('Request payload too big');
					}
					return (readBody(req, len, this.opts.payloadMaxSize, this.opts.payloadTimeout)
							.catch(function(e) {
								err(res, 400, 'Bad request');
								completed = true;
								throw e;
							}.bind(this)));
				}.bind(this))
				.then(function(body) {
					req.body = body;
					if (! this.dead) {
						return this.opts.requestCb(req, res);
					} else {
						err(res, 503, 'Service unavailable');
						completed = true;
						throw e;
					}
				}.bind(this))
				.then(function() {
					completed = true;
				})
				.catch(function (e) {
					if (! completed) {
						try {
							err(res, 500, 'Internal error');
						} catch (e) {
							//NOTHING;
						}
						completed = true;
					}
				}.bind(this)));
	}.bind(this);
	this.dead = false;
	{
		let h;
		if (this.opts.key && this.opts.cert) {
			//console.log('https');
			this.server = https.createServer({ key: this.opts.key, cert: this.opts.cert }, reqCb);
			h = https;
		} else {
			//console.log('http');
			this.server = http.createServer(reqCb);
		}
	}
	this.server.on('error', function(e) {
		if (! this.dead) {
			this.dead = true;
			this.server.close();
			this.server = undefined;
			this.emit('error', e);
		}
	}.bind(this));
	this.server.headersTimeout = this.opts.headersTimeout;
	this.server.listen(this.opts.port, this.opts.host);
}

require('util').inherits(RawSrv, require('events').EventEmitter);

RawSrv.prototype.close = function() {
	if (this.dead) {
		return;
	}
	this.dead = true;
	this.server.close();
	this.server = undefined;
	this.emit('end');
}

module.exports = RawSrv;
