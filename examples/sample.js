
var pmod = require("../index.js");

pmod.import(__dirname + "/mod-a.js").then(function (a) {
	console.log(a);
});

