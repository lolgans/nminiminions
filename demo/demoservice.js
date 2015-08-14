var Nminion = require('../');

var startup = Nminion.start()
	.then(
		function() {
			console.log('========= INIT COMPLETE ============');
			// console.log(arguments);
		},
		function() {
			console.log('========= INIT FAIL ============');
			// console.log(arguments);
		}
	)
;







