//  lets create an endpoint that returns an array of all users.

// lib/api.js

var models = require('../models');

exports.users = {
  all: function(request, reply) {
    models.User.findAll()
      .then(function(users) {
        reply(users).code(200);
      });
  }
};
