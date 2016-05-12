'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractChanges = extractChanges;
exports.extractChangesBetweenArrays = extractChangesBetweenArrays;
exports.changesFromObservableArrays = changesFromObservableArrays;
exports.changesFromObservableArrays2 = changesFromObservableArrays2;
exports.transformEquals = transformEquals;
exports.colorsEqual = colorsEqual;
exports.entityVisualComparer = entityVisualComparer;

var _utils = require('./utils');

function compareHash(obj) {
  if (obj.uuid) return obj.uuid;
  // return JSON.stringify(obj)
  // return typeof(obj)+obj.name
}

var jsondiffpatch = require('jsondiffpatch').create({ objectHash: compareHash });

function extractChanges(prev, cur) {
  var delta = jsondiffpatch.diff(prev, cur);
  // console.log("delta",delta)
  var result = { added: [], removed: [], changed: [] };

  if (delta && '_t' in delta) {
    (function () {
      var removed = []; // delta["_0"][0]//delta[0][0]
      var added = []; // delta[0][0]//delta[0][1]

      Object.keys(delta).map(function (key) {
        // console.log("AAA",key)
        // "_t": "a",	Array delta (member names indicate array indices)

        if (key[0] === '_') {
          if (key !== '_a' && key !== '_t') {
            removed.push(delta[key][0]);
          }
        } else {
          added.push(delta[key][0]);
        }
      });

      result.added = (0, _utils.toArray)(added).filter(function (i) {
        return i !== undefined;
      });
      result.removed = (0, _utils.toArray)(removed).filter(function (i) {
        return i !== undefined;
      });

      // console.log("added",result.added)
      // console.log("removed",result.removed)
    })();
  } else if (prev === undefined) {
      // not handled right in the above case for some reason ??
      result.added = cur;
    }

  return result;
}

var instance = require('jsondiffpatch').create({
  objectHash: function objectHash(obj, index) {
    if (typeof obj._id !== 'undefined') {
      return obj._id;
    }
    if (typeof obj.id !== 'undefined') {
      return obj.id;
    }
    if (typeof obj.name !== 'undefined') {
      return obj.name;
    }
    return '$$index:' + index;
  }
});
// to ignore functions
instance.processor.pipes.diff.before('trivial', function ignoreFunctionDiffFilter(context) {
  if (typeof context.left === 'function' || typeof context.right === 'function') {
    context.setResult(undefined);
    context.exit();
  }
});

function extractChangesBetweenArrays(prev, cur) {
  var delta = instance.diff(prev, cur);
  // console.log("delta",delta)
  // console.log("diff",delta)//JSON.stringify(delta, null, 2))

  var result = { added: [], removed: [], changed: [], upserted: [] };

  if (delta && '_t' in delta) {
    (function () {
      var removed = []; // delta["_0"][0]//delta[0][0]
      var added = []; // delta[0][0]//delta[0][1]
      var upserted = [];

      if (delta['_t'] === 'a') {
        // array diff
        // "_t": "a",	Array delta (member names indicate array indices)
        Object.keys(delta).map(function (key) {
          if (key !== '_t') {
            if (key.length > 0 && key.indexOf('_') > -1) {
              var realKey = parseInt(key.replace('_', ''), 10);
              // console.log("removed",delta, realKey)//,key,delta)
              removed.push(prev[realKey]);
            } else {
              // added or changed
              // console.log("added or changed",delta, key)
              var _realKey = parseInt(key, 10);
              upserted.push(cur[_realKey]);
            }
          }
        });
      }
      result.added = (0, _utils.toArray)(added).filter(function (i) {
        return i !== undefined;
      });
      result.removed = (0, _utils.toArray)(removed).filter(function (i) {
        return i !== undefined;
      });
      result.upserted = (0, _utils.toArray)(upserted).filter(function (i) {
        return i !== undefined;
      });
      // console.log("added",result.added)
      // console.log("removed",result.removed)
    })();
  } else if (prev === undefined) {
      // not handled right in the above case for some reason ??
      result.upserted = cur;
    }

  return result;
}

function changesFromObservableArrays(data$) {
  return data$.scan(function (acc, cur) {
    return { cur: cur, prev: acc.cur };
  }, { prev: undefined, cur: undefined }).map(function (typeData) {
    var cur = typeData.cur;
    var prev = typeData.prev;

    var changes = extractChangesBetweenArrays(prev, cur);
    return changes;
  }).share();
}

function changesFromObservableArrays2(data$) {
  return data$.scan(function (acc, x) {
    var cur = x;
    var prev = acc.cur;

    cur = Object.keys(cur).map(function (key) {
      return cur[key];
    });
    return { cur: cur, prev: prev };
  }, { prev: undefined, cur: undefined }).map(function (typeData) {
    var cur = typeData.cur;
    var prev = typeData.prev;
    // console.log("diffing",cur,prev)

    var changes = extractChanges(prev, cur);
    return changes;
  }).share();
}

function transformEquals(a, b) {
  if (!a || !b) return true;
  for (var j = 0; j < a.length; j++) {
    if (a[j] !== b[j]) {
      return false;
    }
  }
  return true;
}

function colorsEqual(a, b) {
  if (!a || !b) return true;
  return a === b;
}

function entityVisualComparer(prev, cur) {
  // console.log("prev",prev,"cur",cur)

  if (!cur) {
    return false;
  }

  // compare lengths - can save a lot of time
  if (cur.length !== prev.length) {
    return false;
  }

  var sortedCur = cur.sort();
  var sortedPrev = prev.sort();
  for (var i = 0; i < cur.length; i++) {
    if (sortedCur[i].typeUid !== sortedPrev[i].typeUid) {
      return false;
    }

    if (sortedCur[i].id !== sortedPrev[i].id) {
      return false;
    }

    var curVal = sortedCur[i];
    var preVal = sortedPrev[i];

    /*
      sortedCur[i].color === sortedPrev[i].color
      )*/

    var posEq = transformEquals(curVal.pos, preVal.pos);
    var rotEq = transformEquals(curVal.rot, preVal.rot);
    var scaEq = transformEquals(curVal.sca, preVal.sca);
    var colEq = colorsEqual(curVal.color, preVal.color);
    var allEqual = posEq && rotEq && scaEq && colEq;
    if (!allEqual) return false;
  }

  return true;
}