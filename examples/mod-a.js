
console.log("I am in a");

$import("./mod-b.js").then(function (b) {
	console.log(b);
	$export("I am from mod-a.js");
});

