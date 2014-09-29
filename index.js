
/*
  module_require = require('module').require

  pmod.engine.js = pmod.engine.node = function (filename) {
    return new Promise(function (resolve, reject) {
      try {
        resolve(require(filename));
      } catch (e) {
        reject(e);
      }
    });
  };

  pmod.engine["jeml"] = function () {};

  pmod.engine["jisp"] = function () {};


  pmod.import("name").then

  // node-resolve

  jeml.import(__dirname + "/name.jeml").then(function () {


  });

*/

var resolve = require('resolve');

var fs = require("fs")
  , path = require("path")
  , Module = require("module")
  , Promise = require("es6-promise").Promise
  ;

var pmod = {};

var defined_modules = {};
var load_resolvers = {};

pmod.define = function (filename, text) {
    if (filename in defined_modules) {
        throw new Error("Can only define module once!");
    }

    defined_modules[filename] = text;

    if (Array.isArray(load_resolvers[filename])) {
        load_resolvers[filename].forEach(function (resolve) {
            resolve(text);
        });
        delete load_resolvers[filename];
    }
};

pmod.load = function (filename) {
    return new Promise(function (resolve, reject) {
        if (filename in defined_modules) {
            resolve(defined_modules[filename]);
        } else {
            // first time loading
            if (!(filename in load_resolvers)) {
                load_resolvers[filename] = [];

                pmod.get(filename).then(function (text) {
                    pmod.define(filename, text);
                });
            }
            load_resolvers[filename].push(resolve);
        }
    });
};

var exported_modules = {};
var import_resolvers = {};

pmod.export = function (filename, obj) {
    if (filename in exported_modules) {
        throw new Error("Can only export module once!");
    }

    exported_modules[filename] = obj;

    if (Array.isArray(import_resolvers[filename])) {
        import_resolvers[filename].forEach(function (resolve) {
            resolve(obj);
        });
        delete import_resolvers[filename];
    }
};

pmod.import = function (filename) {
    return new Promise(function (resolve, reject) {
        if (filename in exported_modules) {
            resolve(exported_modules[filename]);
        } else {
            if (!(filename in import_resolvers)) {
                import_resolvers[filename] = [];

                pmod.get(filename).then(function (text) {

                    var __dirname = path.dirname(filename);
                    var __filename = filename;
                    var $import = function (filepath) {
                        if (filepath[0] === ".") {
                            return pmod.import(path.resolve(__dirname, filepath));
                        } else if (filepath[0] === "/") {
                            return pmod.import(filename);
                        }
                    };
                    var $load = function (filepath) {
                        if (filepath[0] === ".") {
                            return pmod.load(path.resolve(__dirname, filepath));
                        } else if (filepath[0] === "/") {
                            return pmod.load(filepath);
                        }
                    };
                    var $export = function (obj) {
                        pmod.export(filename, obj);
                    };

                    var $module = new Module(filename);

                    var script = new Function("$load", "$import", "$export", "__dirname", "__filename", "require", text);
                    script($load, $import, $export, __dirname, __filename, $module.require.bind($module));
                });
            }
            import_resolvers[filename].push(resolve);
        }
    });
};

// used for import js file
pmod.engine("js", function () {

});

pmod.engine("html", function () {

});

// defult engines for .js and .node
pmod.engine.js = function () {

};

pmod.engine.node = function () {

};

// get file, return a promise
// may support http request
pmod.get = function (filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, function (err, file) {
            err ? reject(err) : resolve(file.toString());
        });
    });
};

module.exports = pmod;
