//lets add a route for our api in our routes.js:
// lib/routes.js

var api = require('./api');

module.exports = [
  {
    method: 'GET',
    path: '/api/users',
    handler: api.users.all
  }
];
