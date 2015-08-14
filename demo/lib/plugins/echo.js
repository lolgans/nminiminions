var Promise = require('q').Promise;

var plugin = {
	name: 'echo',
	definitions: {
		get: {},
		post: {},
		put: {},
		delete: {}
	}
};
module.exports = plugin;

// app is your nminion-based application
plugin.init = function() {
	log.info('initializing plugin: ' + plugin.name);
	plugin.config = app.config[plugin.name];
	return plugin;
};


// --- YOU NEED TO DEFINE YOUR RPC-ENDPOINTS/RESOURCE SO THE API CAN EXPLAIN IT TO CLIENTS AND ROUTE IT ACCORDINGLY
plugin.resourceDefinition = function() {
	return {
		
	};
};


/* ==== this is what a incoming rpc message should look like:
{
	"realm": "any",
	"resource": "echo",
	"method": "GET",
	"specifier": "test",
	"document": {
		"data": "hello world"
	}
}
	options: {},  || optional, NOT SUPPORTED YET
	user: { ... } || optional, NOT SUPPORTED YET
*/


/* ==== this is what your rpc response should look like:
{
	message: {
		something: "else"
	}
}

*/
plugin.definitions.get.me =	{
	name: plugin.name,
	type: 'rpc',
	routing: plugin.config.rpcListeningRoute,
	rpc: app.get('mq', plugin.name),
	description: 'returns the input',
	parameters: {
		data: {
			description: 'the data you want to be echoed',
			type: 'string',
			optional: false,
			example: 'hello world'
		}
	},
	handler: function(next, reply) {
		if (
			typeof context.request.input !== 'object' 
			|| context.request.input === null 
			|| typeof context.request.input.document !== 'object'
			|| context.request.input.document === null
			|| typeof context.request.input.document.data !== 'string'
		) {
			var e =new Error('echo: required input not given. request.document.data needed');
			log.warn(e)
			return sendError(e);
		}
		var data = context.request.input.document.data;
		context.response.message = plugin.ensureContextMessage(context.message);
		context.response.message.data = data;
		context.session.echo_rpc1 = true;
		log.debug('echo.rpc1 successfully finished');
		return next();
	}
};




