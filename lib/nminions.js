var pmx = require('pmx');

var nminions = {
	config: {
		maxLogHistoryEntries: 400
	},
	_allMinions: [
		pmx_restart,
		pmx_log,
		pmx_error
	],
	_initiatedMinions: {},
	init: init
};

module.exports = nminions;

function init(myMinions) {
	if (typeof myMinions !== 'object' || ! (myMinions instanceof Array)) {
		myMinions = nminions._allMinions;
	}
	for (var n=0; n<myMinions.length; n+=1) {
		myMinions[n]();
	}
	return nminions;
};


function pmx_error() {	
	global.errorHandler = function (err) {
		// handle the error safely
		console.log('============ UNCAUGHT EXCEPTION ============');
		console.error(err);
		log.add(err.toString() + '   STACK: ' + err.stack, 'red', 'uncaughtException', 99);
		pmx.notify(err);
	};
	process.on(
		'uncaughtException', 
		errorHandler
	);
	nminions._initiatedMinions['errorHandler'] = errorHandler;
	return nminions._initiatedMinions['errorHandler'];
};


function pmx_restart() {
	nminions._initiatedMinions['restart'] = pmx.action(
		'restart', 
		function(reply) {
			reply(true);
			process.exit(0);
		}
	);
	return nminions._initiatedMinions['restart'];
};


function pmx_log() {	
	log.history = [];
	log.on(
		'log',
		function(data) {
			log.history.unshift(data);
			while (log.history.length > nminions.config.maxLogHistoryEntries) {
				log.history.pop();
			}
		}
	);
	nminions._initiatedMinions['log'] = pmx.action(
		'log', 
		function(reply) {
			reply(log.history);
			process.exit(0);
		}
	);
	return nminions._initiatedMinions['log'];
};

