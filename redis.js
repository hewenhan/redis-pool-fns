var processRedisArray = function (redisArray, startRank) {
	var result = [];
	var rank = 0;
	for (var i = 0; i < redisArray.length; i++) {
		if (i % 2 === 0) {
			var tempUserData = {};
			tempUserData.member = redisArray[i];
		} else {
			tempUserData.scores = redisArray[i];
			if (startRank != null) {
				rank++;
				tempUserData.rank = startRank + rank;
			}
			result.push(tempUserData);
		}
	}
	return result
};

var redisInit = function (redisConfig) {
	this.redisPool = require('redis-connection-pool')(redisConfig.area || "", redisConfig);
	redisConfig.perfix = redisConfig.perfix || "";
	var _this = this;
	this.set = function (key, value, expireTime, callback) {
		if (callback == null) {
			callback = function () {};
		}
		key = redisConfig.perfix + key;
		var options = [];
		options.push(key);
		options.push(value);
		if (expireTime != null) {
			options.push('EX');
			options.push(expireTime);
		}
		_this.send_command('SET', options, function (err, reply) {
			if (err) {
				callback(err, reply);
				return;
			}
			callback(err, reply);
		});
	};
	this.get = function (key, callback) {
		key = redisConfig.perfix + key;
		_this.redisPool.get(key, function (err, reply) {
			if (typeof callback == 'function') {
				callback(err, reply);
			}
		});
	};
	this.del = function (key, callback) {
		key = redisConfig.perfix + key;
		_this.redisPool.del(key, function (err) {
			if (typeof callback == 'function') {
				callback(err);
			}
		});
	};
	// expireTime in second
	this.expire = function (key, expireTime) {
		key = redisConfig.perfix + key;
		_this.redisPool.expire(key, expireTime);
	};
	this.send_command = function (commandName, args, callback) {
		_this.redisPool.send_command(commandName, args, callback);
	};
	this.getPatt = function (keyPatt, callback, resultValue) {
		if (resultValue == null) {
			resultValue = true;
		}
		_this.send_command('keys', [redisConfig.perfix + keyPatt], function (err, keyName) {
			if (err) {
				callback(err);
				return;
			}

			if (!resultValue) {
				callback(null, keyName);
				return;
			}

			var getKey = function (key) {
				_this.redisPool.get(key, function (err, value) {
					if (err) {
						console.log(err);
						getValueCount++;
						return;
					}
					result[key] = value;
					getValueCount++;
					if (getValueCount == keyName.length) {
						callback(null, result);
					}
				});
			};
			var result = {};
			var getValueCount = 0;
			if (keyName.length == 0) {
				callback(null, result);
				return;
			}
			for (var i = 0; i < keyName.length; i++) {
				getKey(keyName[i]);				
			}
		});
	};
	this.delPatt = function (keyPatt, callback) {
		_this.send_command('keys', [redisConfig.perfix + keyPatt], function (err, keyName) {
			if (err) {
				if (typeof callback != 'function') {
					console.log(err);
				}
				callback(err);
				return;
			}
			var deleteKey = function (key) {
				_this.redisPool.del(key, function (err) {
					if (err) {
						console.log(err);
						getValueCount++;
						return;
					}
					delArr.push(key);
					getValueCount++;
					if (getValueCount == keyName.length) {
						if (typeof callback != 'function') {
							return;
						}
						callback(null, delArr);
					}
				});
			};
			var delArr = [];
			var getValueCount = 0;
			if (keyName.length == 0) {
				callback(null, delArr);
				return;
			}
			for (var i = 0; i < keyName.length; i++) {
				deleteKey(keyName[i]);				
			}
		});
	};
	this.zAdd = function (key, member, score, callback) {
		if (typeof callback != 'function') {
			callback = function () {};
		}
		key = redisConfig.perfix + key;
		_this.send_command('ZADD', [key, score, member], callback);
	};
	this.zRemRangeByRank = function (key, start, stop, callback) {
		key = redisConfig.perfix + key;
		_this.send_command('ZREMRANGEBYRANK', [key, start, stop], callback);
	};
	this.zRevRangeByScore = function (key, min, max, callback, withScores) {
		key = redisConfig.perfix + key;
		var options = [key, max, min];
		if (withScores) {
			options.push('WITHSCORES');
		}
		_this.send_command('ZREVRANGEBYSCORE', options, function (err, reply) {
			if (err) {
				callback(err, reply);
				return;
			}
			if (withScores && reply != null) {
				reply = processRedisArray(reply);
			}
			callback(err, reply);
		});
	};
	this.zRange = function (key, start, stop, callback, withScores) {
		key = redisConfig.perfix + key;
		var options = [key, start, stop];
		if (withScores) {
			options.push('WITHSCORES');
		}
		_this.send_command('ZRANGE', options, function (err, reply) {
			if (err) {
				callback(err, reply);
				return;
			}
			if (withScores && reply != null) {
				reply = processRedisArray(reply, start);
			}
			callback(err, reply);
		});
	};
	this.zRevRange = function (key, start, stop, callback, withScores) {
		var _this = this;
		key = redisConfig.perfix + key;
		var options = [key, start, stop];
		if (withScores) {
			options.push('WITHSCORES');
		}
		_this.send_command('ZREVRANGE', options, function (err, reply) {
			if (err) {
				callback(err, reply);
				return;
			}
			if (withScores && reply != null) {
				reply = processRedisArray(reply, start);
			}
			callback(err, reply);
		});
	};
	this.zRem = function (key, memberArr, callback) {
		key = redisConfig.perfix + key;
		var options = [key];
		for (var i = 0; i < memberArr.length; i++) {
			options.push(memberArr[i]);
		}
		_this.send_command('ZREM', options, callback);
	};
	this.hSet = function  (key, field, data, callback) {
		if (typeof callback != 'function') {
			callback = function () {};
		}
		key = redisConfig.perfix + key;
		_this.redisPool.hset(key, field, data, callback);
	};
	this.hSetObj = function (key, obj, callback) {
		if (typeof callback != 'function') {
			callback = function () {};
		}
		key = redisConfig.perfix + key;

		var hsetArr = [];
		hsetArr.push(key);
		for (var i in obj) {
			hsetArr.push(i);
			hsetArr.push(obj[i]);
		}
		_this.send_command('HSET', hsetArr, callback);
	};
	this.hGet = function (key, field, callback) {
		key = redisConfig.perfix + key;
		_this.redisPool.hget(key, field, callback);
	};
	this.hGetAll = function (key, callback) {
		key = redisConfig.perfix + key;
		_this.redisPool.hgetall(key, callback);
	};
	this.hDel = function (key, fields, callback) {
		key = redisConfig.perfix + key;
		_this.redisPool.hdel(key, fields, callback);
	};
	this.zRevRank = function (key, member, callback) {
		key = redisConfig.perfix + key;
		_this.send_command('ZREVRANK', [key, member], callback);
	};
	this.zRank = function (key, member, callback) {
		key = redisConfig.perfix + key;
		_this.send_command('ZRANK', [key, member], callback);
	};
	this.zScore = function (key, member, callback) {
		key = redisConfig.perfix + key;
		_this.send_command('ZSCORE', [key, member], callback);
	}
};

module.exports = function (redisConfig) {
	return new redisInit(redisConfig);
};
