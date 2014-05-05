
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
                
                fs.readFile(filename, function (err, file) {
                    if (err) throw err;
                    pmod.define(filename, file.toString());
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



                pmod.load(filename).then(function (file) {

                    var __dirname = path.dirname(filename);
                    var __filename = filename;
                    var $import = function (filepath) {

//                        console.log("$import", filepath);

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

                    var script = new Function("$load", "$import", "$export", "__dirname", "__filename", "require", file);
                    script($load, $import, $export, __dirname, __filename, $module.require.bind($module));
                });
            }
            import_resolvers[filename].push(resolve);
        }
    });
};

module.exports = pmod;



