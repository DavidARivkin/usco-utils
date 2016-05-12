'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeData = mergeData;
exports.applyDefaults = applyDefaults;
exports.applyTransform = applyTransform;
exports.makeModifications = makeModifications;
exports.smartStateFold = smartStateFold;
exports.makeModel = makeModel;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _assign = require('fast.js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _Rx$Observable = _rx2.default.Observable;
var merge = _Rx$Observable.merge;
var just = _Rx$Observable.just;

// import Immutable from 'seamless-immutable'
// hack stand in as we don't really need any immutable lib

function Immutable() {}

// faster object.assign

// TODO: this needs to be an external lib, for re-use
// merge the current data with any number of input data
function mergeData(currentData) {
  for (var _len = arguments.length, inputs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    inputs[_key - 1] = arguments[_key];
  }

  if ('merge' in currentData) {
    return currentData.merge(inputs);
  }
  return _assign2.default.apply(undefined, [{}, currentData].concat(inputs));
}

// need to make sure source data structure is right
function applyDefaults(data$, defaults) {
  return data$.map(function (data) {
    return mergeData(defaults, data);
  });
}

// need to make sure the "type" (immutable) is right
function applyTransform(data$, transform) {
  return data$.map(function (data) {
    return transform(data);
  });
}

function logHistory(currentData, history) {
  var past = [currentData].concat(history.past);
  var future = [];

  console.log('currentData', past);
  history = mergeData(history, { past: past, future: future });
  return history;
}

// history
function makeUndoMod$(actions) {
  return actions.undo$.map(function (toggleInfo) {
    return function (_ref) {
      var state = _ref.state;
      var history = _ref.history;

      console.log('Undoing');

      var nState = history.past[0];
      var past = history.past.slice(1);
      var future = [state].concat(history.future);

      history = mergeData(history, { past: past, future: future });

      return Immutable({ state: nState, history: history });
    };
  });
}

function makeRedoMod$(actions) {
  return actions.redo$.map(function (toggleInfo) {
    return function (_ref2) {
      var state = _ref2.state;
      var history = _ref2.history;

      console.log('Redoing');

      var nState = history.future[0];
      var past = [state].concat(history.past);
      var future = history.future.slice(1);

      history = mergeData(history, { past: past, future: future });

      return Immutable({ state: nState, history: history });
    };
  });
}

var transform = Immutable;

function makeModifications(actions, updateFns, options) {
  var mods$ = Object.keys(actions).map(function (key) {
    var op = actions[key];
    var opName = key.replace(/\$/g, '');
    var modFn = updateFns[opName];

    // FIXME: how to make this better?
    if (opName === 'undo') return makeUndoMod$(actions);
    if (opName === 'redo') return makeRedoMod$(actions);

    // here is where the "magic happens"
    // for each "operation/action" we map it to an observable with history & state

    // console.log("op",op,"opName",opName,"modFn",modFn)
    if (modFn && op) {
      var mod$ = op.map(function (input) {
        return function (state) {
          if (options.history) {
            var _history = logHistory(state, state.history);
          }
          state = modFn(state, input); // call the adapted function

          if (options.history) {
            state = { state: state, history: history };
          }

          if (options.doApplyTransform) {
            // if we need to coerce data  to immutable etc
            state = transform(state);
          }

          return state;
        };
      });

      return mod$;
    }
  }).filter(function (e) {
    return e !== undefined;
  });

  return merge(mods$);
}

// from futurice/power-ui
/**
* smartStateFold is supposed to be given as the argument a
* `scan` operation over a stream of state|updateFn. State is
* expected to be an object, and updateFn is a function that
* takes old state and produces new state.
* Example:
* --s0---fn1----fn2----s10------>
*      scan(smartStateFold)
* --s0---s1-----s2-----s10------>
*
* where s1 = fn1(s0)
* where s2 = fn2(s1)
*/
function smartStateFold(prev, curr) {
  // console.log("prev",prev,"cur",curr)
  if (typeof curr === 'function') {
    return curr(prev);
  } else if (typeof curr === 'function') {
    return prev(curr);
  } else {
    return prev;
  }
}

function makeModel(defaults, updateFns, actions, source) {
  var options = arguments.length <= 4 || arguments[4] === undefined ? { doApplyTransform: false } : arguments[4];

  var mods$ = makeModifications(actions, updateFns, options);

  // console.log("defaults",defaults)
  var source$ = source || just(defaults);
  //  .tap(e=>console.log("source",e))

  source$ = applyDefaults(source$, defaults);

  if (options.doApplyTransform) {
    source$ = applyTransform(source$, transform);
  }

  return mods$.merge(source$).scan(smartStateFold, defaults) // combine existing data with new one
  // .distinctUntilChanged()
  .shareReplay(1);
}