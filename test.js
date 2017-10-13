var config = {
	host: '127.0.0.1',
	port: 6379,
	max_clients: 30,
	perform_checks: false,
	perfix: "hello_",
	database: 0,
	options: {
		auth_pass: '033481033481'
	}
};

var redis = require("./redis")(config);

var key = "asd6";
var value = "hello world6";

redis.set(key, value, null, function (err) {
	if (err) {
		console.log(err);
		return;
	}
	redis.get(key, function (err, reply) {
		if (err) {
			console.log(err);
			return;
		}
		console.log(reply);
	});
});

redis.getPatt("asd*", function (err, reply) {
	if (err) {
		console.log(err);
		return;
	}
	console.log(reply);
});

redis.zAdd("zasd", "aac", "115", function (err, reply) {
	if (err) {
		console.log(err);
		return;
	}
});

redis.zRange("zasd", 0, -1, function (err, reply) {
	if (err) {
		console.log(err);
		return;
	}
	console.log(reply);
}, true);