var Promise = require('q').Promise;

var plugin = {
	name: 'resourceReceiver',
	resources: {}
};
module.exports = plugin;


plugin.init = function() {
	log.info('loaded plugin: ' + plugin.name);
	return Promise(
		function(resolve, reject) {
			// creates a listener
			plugin.config = app.config[plugin.name];
			log.info('initializing plugin: ' + plugin.name);
			app.mqs.resourceReceiver.handleMessage(
				function(message, next) {
					log.debug('====== ' + plugin.name + ' Received message');
					// log.debug(message);
					/*
  resources: {
    "users": {
      "get": {
        "byId": {
          "description": "Get a User by their unique ID",
          "parameters": {
            "_id": {
              "description": "a stringified mongoDB type id. user._id is the field name.",
              "optional": true,
              "type": "string",
              "example": "4f39e4f12ce81f09340002b9"
            }
          },
          "tests": [
            {
              "name": "/users/get/byId[+]",
              "index": 9999,
              "parameters": "function () {\n\t\t\t\t\treturn {\n\t\t\t\t\t\t\"clientId\": \"cid1426859972031fjv1omdt58ccxfdt\",\n\t\t\t\t\t\t\"resourceVersion\": \"1.0.0\",\n\t\t\t\t\t\t\"resource\": \"users\",\n\t\t\t\t\t\t\"method\": \"get\",\n\t\t\t\t\t\t\"specifier\": \"byId\",\n\t\t\t\t\t\t\"document\": {\n\t\t\t\t\t\t\t\"_id\": \"545ddbc11cc357b22aa5ede0\"\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}",
              "validate": "function (answer) {\n\t\t\t\t\texpect(answer).to.be.an('object');\n\t\t\t\t\texpect(answer.errors).to.equal(null);\n\t\t\t\t\treturn null;\n\t\t\t\t}"
            },
            {
              "name": "/users/get/byId[-]",
              "index": 9999,
              "parameters": "function () {\t\t\t\n\t\t\t\t\treturn {\n\t\t\t\t\t\t\"clientId\": \"cid1426859972031fjv1omdt58ccxfdt\",\n\t\t\t\t\t\t\"resourceVersion\": \"1.0.0\",\n\t\t\t\t\t\t\"resource\": \"users\",\n\t\t\t\t\t\t\"method\": \"get\",\n\t\t\t\t\t\t\"specifier\": \"byId\",\n\t\t\t\t\t\t\"document\": {\n\t\t\t\t\t\t\t\"id\": \"545ddbc11cc357b22aa5ede0\"\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}",
              "validate": "function (answer) {\n\t\t\t\t\texpect(answer).to.be.an('object');\n\t\t\t\t\texpect(answer.errors).to.not.equal(null);\n\t\t\t\t\treturn null;\n\t\t\t\t}"
            }
          ]
        },

				*/
					next();
				}
			);
			resolve(plugin);
		}
	);
};


plugin.updateResources = function(resource) {
	plugin.resources[resource._name] = resource._parent._documentation[resource._name];
	log.debug('=======updateResources: ', resource._name);
	return this.resources;
};



