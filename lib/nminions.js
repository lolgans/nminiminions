var path = require('path');
var Q = require('q');
var Promise = Q.Promise;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var argv = require('minimist')(process.argv.slice(2));
var bunyan = require('bunyan');
var fs = require("fs");
var path = require("path");

global.log = console;
var app = {};
global.app = app;
app.pmx = require('pmx').init(
		{
			errors: false,
			http: false
		}
);

app._data = {};
app.events = new EventEmitter();
// TODO: fix path!
app.packageJson = require(__dirname + '/../package.json');
app.argv = argv;
app.start = start;
app.stop = stop;
app.errorHandler = errorHandler;
process.on('uncaughtException', app.errorHandler);
process.on('SIGTERM', app.stop.bind(this));
process.on('SIGINT', app.stop.bind(this));
app.get = function(parentKey, childKey) {
	return app._data[parentKey][childKey];
};
app.set = function(parentKey, childKey, value) {
	if (!app._data[parentKey]) {
		app._data[parentKey] = {};
	}
	app._data[parentKey][childKey] = value;
	return app._data[parentKey][childKey];
};


function start(startupPromisesToChain) {
	return Promise(
			function(startupResolve, startupReject) {
				var init = Q(true)
						.then(
								loadConfig
						).then(
								function() {
									// Shortcut to the app name
									app.config = require(__dirname + '/baseconfig.js')(app.config);
									app.name = app.config.name;
									return app.config;
								}
						).then(
								function() {
									return Promise(
											function (resolve, reject) {
												return ensureExists(path.normalize(app.config.directories.logs), 0744, function(err) {
													if (err){
														return reject(err);
													} // handle folder creation error
													else {
														return resolve(true);
													}
												});
											}
									)
								}
						).then(
								function () {
									log = bunyan.createLogger(app.config.logger);
									log.info('logger active: bunyan');
									return log;
								}
						).then(
								function() {
									return load('plugins', app.config.plugins);
								}
						).then(
								function() {
									log.info('registering pmx_actions');
									return pmx_actions();
								}
						).then(
								function() {
									if (Array.isArray(startupPromisesToChain) !== true || startupPromisesToChain.length === 0) {
										return true;
									}
									log.info('running startupPromisesToChain :' + startupPromisesToChain.length);
									var P = chainPromises('startupPromisesToChain', startupPromisesToChain);
									return P;
								}
						).then(
								function() {
									log.info('init complete. v' + app.packageJson.version);
									app.events.emit('init.complete', app);
									startupResolve(app);
									return true;
								}
						).catch(
								function(err) {
									log.error('========== STARTUP FAILED !!! ', arguments);
									startupReject(err);
									errorHandler(err);
								}
						);
			}
	);
};

function ensureExists(path, mask, cb) {
	if (typeof mask == 'function') { // allow the `mask` parameter to be optional
		cb = mask;
		mask = 0777;
	}
	fs.mkdir(path, mask, function(err) {
		if (err) {
			if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
			else cb(err); // something else went wrong
		} else cb(null); // successfully created folder
	});
};

function stop() {
	log.info('service shutdown triggered - 2sec max | ' + Date.now() + '');
	setTimeout(
			function() {
				process.disconnect && process.disconnect();
				process.exit(1);
			},
			2000
	);
};



// -------- HELPERS
//--[[ load the config file
function loadConfig() {
	try {
		var configArgument = argv.config || argv.c || argv._[0];
		var configPath = path.resolve(process.cwd(), configArgument);
		app.config = require(configPath);
	} catch(err) {
		console.error('! failed to load config [%s]', configPath);
		app.errorHandler(err);
		process.exit(1);
	}
	log.info('loaded config [' + configPath + ']');
	return true;
};


//--[[ load all plugins and wait for their init to complete
function load(name, list) {
	app[name] = {};
	return Promise(
			function(loadResolve, loadReject) {
				log.info('loading ' + name);
				if (typeof list !== 'object' || typeof list.length !== 'number' || list.length <1) {
					return loadResolve('nothing to load');
				}
				var eHandler = function(err) {
					if (!err) {
						err = new Error('unknown problem')
					}
					log.error('load error ', err.stack);
					loadReject(err);
				};
				var result = Q('load init');
				var promises = [];
				list.map(
						function(item) {
							try {
								if (typeof item !== 'object' || typeof item.file !== 'string' && typeof item.name !== 'string') {
									log.debug('load skipped item: ', item);
									return item;
								}
								var r = require(item.file);
								promises.push(r.init);
								return item;
							} catch(erro) {
								console.error('load map error: ', erro.stack || erro);
							}
						}
				);
				promises.push(
						function() {
							return Promise(
									function(resolve, reject) {
										log.info('completed loading ' + name);
										loadResolve(app[name]);
										return resolve('complete');
									}
							)
						}
				);
				promises.forEach(
						function (p) {
							result = result.then(p).catch(eHandler);
						}
				);
				return result;
			}
	);
};



function errorHandler(err) {
	console.error('============ UNCAUGHT EXCEPTION ============');
	console.error(err.stack || err);
	// pmx.notify(err);
	return err;
};



function chainPromises(name, list) {
	return Promise(
			function(chainResolve, chainReject) {
				var eHandler = function(err) {
					log.error('chainPromises error ', err.stack);
					chainReject(err);
					// app.errorHandler(err);
				};
				var result = Q('chainPromises init');
				// result.catch(eHandler);
				list.unshift(
						function() {
							return Promise(
									function(resolve, reject) {
										log.info('chainPromises start ' + name);
										resolve('chainPromises start ' + name);
									}
							)
						}
				);
				list.push(
						function() {
							Promise(
									function(resolve, reject) {
										chainResolve(result);
										log.info('chainPromises complete ' + name);
										resolve('chainPromises complete ' + name);
									}
							)
						}
				);
				list.forEach(
						function (p) {
							result = result.then(p).catch(eHandler);
						}
				);
				return result;
			}
	);
};


module.exports = app;




function pmx_actions() {
	app.pmx.action(
			'printConfig',
			function(reply) {
				reply(app.config);
			}
	);
	return true;
};

