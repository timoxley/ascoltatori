var EventEmitter = require('events').EventEmitter;
var Set = require("./set");
var util = require("./util");

function MemoryAscoltatore() {
  this._event = new EventEmitter();
  this._set = new Set();
}

MemoryAscoltatore.prototype.subscribe = function subscribe(topic, callback, done) {
  if(containsWildcard(topic)) {
    var regexp = new RegExp(topic.replace("*", ".+"));
    var that = this;
    var handler = function(e) {
      if(e.match(regexp)) {
        that._event.on(e, callback);
      }
    };
    callback._ascoltatori_global_handler = handler;
    this._set.forEach(handler);
    this._event.on("newTopic", handler);
  } else {
    if(!this._set.include(topic)) {
      this._set.add(topic);
      this._event.emit("newTopic", topic);
    }
    this._event.on(topic, callback);
  }

  if(typeof done === 'function') {
    done();
  }
};

MemoryAscoltatore.prototype.publish = function publish(topic, done) {
  if(!this._set.include(topic)) {
    this._set.add(topic);
    this._event.emit("newTopic", topic);
  }
  var args = Array.prototype.slice.call(arguments);
  args.unshift(topic);
  this._event.emit.apply(this._event, args);

  if(typeof done === 'function') {
    done();
  }
};

MemoryAscoltatore.prototype.removeListener = function removeListener(topic, callback, done) {
  if(callback._ascoltatori_global_handler !== undefined) {
    this._event.removeListener("newTopic", callback._ascoltatori_global_handler);
    this._set.forEach(function(e) {
      if(e.match(regexp)) {
        this._event.removeListener(e, callback._ascoltatori_global_handler);
      }
    });
  } else {
    this._event.removeListener(topic, callback);
  }

  if(typeof done === 'function') {
    done();
  }
};

MemoryAscoltatore.prototype.reset = function reset(done) {
  this._set.clear();
  this._event.removeAllListeners();

  if(typeof done === 'function') {
    done();
  }
};

util.aliasAscoltatore(MemoryAscoltatore.prototype);

function containsWildcard(topic) {
  return topic.indexOf("*") >= 0;
}

module.exports = MemoryAscoltatore;