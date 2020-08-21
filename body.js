'use strict';

function body(res, expectedSize, maxSize, timeoutMs) {
	return ((new Promise(function(resolve, reject) { setImmediate(function() { resolve() }); }))
			.then(function() {
				return new Promise(function(resolve, reject) {
					var body = undefined, completed = false, timeout = undefined;
					function error(e) {
						if (completed) {
							return;
						}
						completed = true;
						if (timeout) {
							clearTimeout(timeout);
							timeout = undefined;
						}
						if (! e) {
							e = 'Unknown error';
						}
						if (typeof(e) === 'string') {
							e = new Error(e);
						}
						return reject(e);
					}
					if (timeoutMs) {
						timeout = setTimeout(function() {
							timeout = undefined;
							return error('Timeout reading the payload');
						}, timeoutMs);
					}
					res.on('data', function(data) {
						if (completed) {
							return;
						}
						if (typeof(data) === 'string') {
							if (! body) {
								if (((expectedSize || (expectedSize === 0)) &&
									 (data.length > expectedSize)) ||
									((maxSize || (maxSize === 0)) &&
									 (data.length > maxSize))) {
									return error('Payload size mismatch');
								}
								body = data;
								return;
							} else if (typeof(body) === 'string') {
								if (((expectedSize || (expectedSize === 0)) &&
									 ((body.length + data.length) > expectedSize)) ||
									((maxSize || (maxSize === 0)) &&
									 ((body.length + data.length) > maxSize))) {
									return error('Payload size mismatch');
								}
								body += data;
								return;
							}
						} else if (Buffer.isBuffer(data)) {
							if (! body) {
								if (((expectedSize || (expectedSize === 0)) &&
									 (data.length > expectedSize)) ||
									((maxSize || (maxSize === 0)) &&
									 (data.length > maxSize))) {
									return error('Payload size mismatch');
								}
								body = Buffer.from(data);
								return;
							} else if (Buffer.isBuffer(body)) {
								if (((expectedSize || (expectedSize === 0)) &&
									 ((body.length + data.length) > expectedSize)) ||
									((maxSize || (maxSize === 0)) &&
									 ((body.length + data.length) > maxSize))) {
									return error('Payload size mismatch');
								}
								body = Buffer.concat( [ body, data ] );
								return;
							}
						}
						return error('Payload type mismatch');
					});
					res.on('end', function() {
						if (completed) {
							return;
						}
						if (timeout) {
							clearTimeout(timeout);
							timeout = undefined;
						}
						if (! body) {
							body = '';
						}
						if ((expectedSize || (expectedSize === 0)) &&
							(body.length != expectedSize)) {
							return error('Payload size mismatch');
						}
						completed = true;
						return resolve(body);
					});
					res.on('error', function(e) {
						return error(e);
					});
				});
			})
			.catch(function(e) {
				throw e;
			}));
}

module.exports = body;
