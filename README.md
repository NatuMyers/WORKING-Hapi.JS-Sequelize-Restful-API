# WORKING-Hapi.JS-Sequelize-Restful-API


Today we are going to build a simple blog REST API using the [hapi](http://hapijs.com/) framework and some other various libraries as well. The source for this demo can be found [here](https://github.com/niix/hapi-rest-demo).

Our `package.json` will look something like this:

    {
      "name": "hapi-rest-demo",
      "version": "0.0.0",
      "description": "A simple REST API demo using hapi",
      "main": "index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "repository": {
        "type": "git",
        "url": "git@github.com:niix/hapi-rest-demo.git"
      },
      "author": "Nick Justice",
      "license": "MIT",
      "dependencies": {
        "hapi": "^8.1.0",
        "joi": "^5.1.0",
        "sequelize": "^2.0.0-rc7",
        "sqlite3": "^3.0.4"
      },
      "devDependencies": {
        "gulp": "^3.8.10",
        "gulp-nodemon": "^1.0.5",
        "sequelize-cli": "^1.0.3"
      }
    }

Create this file in an empty directory and run `npm install`. This will install some various dependencies that we will be using throughout the demo. Which are **hapi** (of course), **joi** for vaildation, **Sequelize** a Node ORM and **sqlite3** as a database to use with **Sequelize** for development purposes.

* * *

If you’re not familiar with ORMs or Sequelize, I highly recommend checking out [their website](http://sequelizejs.com/) for more info. In short, Sequelize allows you to write the same syntax for your database code but plug-and-play various SQL databases (MySQL, PostgreSQL, etc.)

* * *

Okay, now that we have our dependencies installed lets create our server file `index.js`

    var Hapi = require('hapi');

    // create the server
    var server = new Hapi.Server();
    server.connection({ port : 3000 })

    server.route({
      method: 'GET',
      path: '/api',
      handler: function(request, reply) {
        reply({ 'api' : 'hello!' });
      }
    });

    server.start(function() {
      console.log('Running on 3000');
    });

Go ahead and create your `index.js` file and run it by typing `node index.js`. If you visit [http://localhost:3000/api](http://localhost:3000/api) in your web browser you should be presented with a simple object displaying:

    {
      api: "hello!"
    }

What we have done is created an extremely simple hapi server with a basic route. Routes in hapi are created by passing objects into the `route` method. In their most simple form these objects contain an HTTP method (`GET, PUT, POST, DELETE`), a path for your route and then the handler for what you want the route to respond with. Route handlers can respond with templates as well, but that is out of scope of this demo since we are writing an API.

So we don’t have to keep restarting our server when we make changes, lets create a Gulpfile that uses **nodemon** to monitor our files and restart the server for us automatically.

Create your `Gulpfile.js` with the following setup:

    var gulp = require('gulp');
    var nodemon = require('gulp-nodemon');

    gulp.task('default', function() {
      nodemon({ script : './index.js', ext : 'js' });
    });

This may be a bit overkill for such a simple demo, but as your API extends you can add various Gulp tasks to your project including linting, minification, etc.

Now to run your project you can simply type `gulp` and Gulp will run the server and monitor any JavaScript files that we change.

* * *

Alright lets get down to business.

Sequelize’s command line interface will create some basic boilerplate code for us and get us quickly running. The next step is to initialize Sequelize and you can do so by typing the following in our project directory:

`node_modules/.bin/sequelize init`

You should notice that this has created a couple of directories for us. The models directory which has a `index.js` file inside, the config directory that contains a basic `config.json` and an empty migrations directory. For more info on the boilerplate `index.js`, I again recommend checking out Sequelize’s website.

Now that we have Sequelize initialized, type the following to create our `Post` model for our blog API.

`node_modules/.bin/sequelize model:create --name Post --attributes title:string,body:string`

Next to the `models/index.js` file Sequelize has created a `post.js` file for us and should look like the following:

    "use strict";
    module.exports = function(sequelize, DataTypes) {
      var Post = sequelize.define("Post", {
        title: DataTypes.STRING,
        body: DataTypes.STRING
      }, {
        classMethods: {
          associate: function(models) {
            // associations can be defined here
          }
        }
      });
      return Post;
    };

This file defines a `Post` model that has two fields: `title` and `body`. Both of which are strings. Next we are going to create our `User` model, by typing:

`node_modules/.bin/sequelize model:create --name User --attributes username:string`.

Similar to the previous command, this creates a `User` model for us which a field of `username` that is a `String`. Let’s add a relationship between the two models. In the `user.js` file there is a `classMethods` object which has an auto-generated `associate` method, within that method we will insert our relationship to `Post`:

    "use strict";
    module.exports = function(sequelize, DataTypes) {
      var User = sequelize.define("User", {
        username: DataTypes.STRING
      }, {
        classMethods: {
          associate: function(models) {
            // create one to many relationship
            User.hasMany(models.Post);
          }
        }
      });
      return User;
    };

This creates a one to many relationship, meaning a single `User` has many `Post`.

Lets take a look at the `config.json` file. At this point Sequelize has created some various boilerplate code for different environments. We are going to replace the `development` environment object with the following, to setup our sqlite3 development database:

      "development": {
        "dialect": "sqlite",
        "storage": "./db.development.sqlite"
      }

Now that all of our models are setup, we need to synchronize them. Thankfully sequelize gives us a simple way to do so, lets update our `index.js` and wrap the `server.start` code with the sequelize sync promise:

    var Hapi = require('hapi');
    var models = require('./models');

    // create the server
    var server = new Hapi.Server();
    server.connection({ port : 3000 })

    server.route({
      method: 'GET',
      path: '/api',
      handler: function(request, reply) {
        reply({ 'api' : 'hello!' });
      }
    });

    models.sequelize.sync().then(function() {
      server.start(function() {
        console.log('Running on 3000');
      });
    });

Note we are including the `models` directory at the top of the file now. If we stop and start our server, you will see Sequelize consoling out some info about executing some SQL code. This is creating our models, if they don’t exist.

Let start our simple API. I’m big on organization, so first lets make a `lib` directory and create two files within that directory called `api.js` and `routes.js`.

In our `api.js`, lets create an endpoint that returns an array of all users.

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

And lets add a route for this in our `routes.js`:

    // lib/routes.js

    var api = require('./api');

    module.exports = [
      {
        method: 'GET',
        path: '/api/users',
        handler: api.users.all
      }
    ];

In addition, we want to update our `index.js` to pull in these new routes to the following:

    var Hapi = require('hapi');
    var models = require('./models');

    // create the server
    var server = new Hapi.Server();
    server.connection({ port : 3000 })

    // routes
    server.route(require('./lib/routes'));

    models.sequelize.sync().then(function() {
      server.start(function() {
        console.log('Running on 3000');
      });
    });

By visiting [http://localhost:3000/api/users](http://localhost:3000/api/users) we should now see that an empty array of users are being returned (because we don’t have any yet!).

This is part one of a multiple part blog post. At this point we have created a `GET` method to return an array of users. In our next tutorial we will be moving on to creating a `POST` method to input users into our database.

<figure class="postend kudo able clearfix" id="kudo_vdW8d4sJFJpbzbgAkZpI">[](#kudo)

<div class="num">288</div>

<div class="txt">Kudos</div>

</figure>

<figure class="side kudo able clearfix" id="kudo_side_vdW8d4sJFJpbzbgAkZpI">[](#kudo)

<div class="num">288</div>

<div class="txt">Kudos</div>

</figure>

<section id="readnext">[

#### Now read this

### Hoisting

One of the tricky concepts that stumps newcomers to JavaScript is hoisting. Even seasoned developers coming from other languages can be bitten by this feature. In most C based languages developers are used to the concept of block based... <span class="continue_btn">Continue →</span>

](//nickolus.svbtle.com/hoisting)</section>

<footer id="blog_foot" class="cf">

*   [@nickolus](https://twitter.com/nickolus)

<figure id="user_foot">[Svbtle](/)</figure>

##### [Nick olus](//nickolus.svbtle.com)

</footer>

<footer id="foot">

<figure id="logo_foot">[Svbtle](https://svbtle.com)</figure>

[Terms](https://svbtle.com/terms) <span style="color: #ccc;">•</span> [Privacy](https://svbtle.com/privacy)  

</footer>

<script>var _sf_async_config = { uid: 1721, domain: 'svbtle.com'}; (function() { function loadChartbeat() { window._sf_endpt = (new Date()).getTime(); var e = document.createElement('script'); e.setAttribute('language', 'javascript'); e.setAttribute('type', 'text/javascript'); e.setAttribute('src','//static.chartbeat.com/js/chartbeat.js'); document.body.appendChild(e); }; var oldonload = window.onload; window.onload = (typeof window.onload != 'function') ? loadChartbeat : function() { oldonload(); loadChartbeat(); }; })();</script>
