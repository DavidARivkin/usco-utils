'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Observable = undefined;
exports.createAction = createAction;
exports.combineLatestObj = combineLatestObj;
exports.replicateStream = replicateStream;
exports.mergeActionsByName = mergeActionsByName;
exports.logNext = logNext;
exports.logError = logError;
exports.onDone = onDone;
exports.preventDefault = preventDefault;
exports.formatData = formatData;
exports.isTextNotEmpty = isTextNotEmpty;
exports.exists = exists;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Observable = _rx2.default.Observable;
var Subject = _rx2.default.Subject;
var merge = _rx2.default.Observable.merge;

/* create an action that is both an observable AND
a function/callable*/
function createAction(paramsMap) {
  function action(params) {
    // use rest parameters or not ? ...params
    if (paramsMap && typeof paramsMap === 'function') {
      params = paramsMap(params);
    }
    action.onNext(params);
  }
  // assign prototype stuff from Subject
  for (var key in _rx2.default.Subject.prototype) {
    action[key] = _rx2.default.Subject.prototype[key];
  }

  _rx2.default.Subject.call(action);

  return action;
}

/* From https://github.com/staltz/combineLatestObj*/
function combineLatestObj(obj) {
  var sources = [];
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key.replace(/\$$/, ''));
      sources.push(obj[key]);
    }
  }
  return _rx2.default.Observable.combineLatest(sources, function () {
    var argsLength = arguments.length;
    var combination = {};
    for (var i = argsLength - 1; i >= 0; i--) {
      combination[keys[i]] = arguments[i];
    }
    return combination;
  });
}

// From https://github.com/futurice/power-ui/blob/85d09645ecadc85bc753ba42fdd841d22d8bdd10/src/utils.js
function replicateStream(origin$, proxy$) {
  origin$.subscribe(proxy$.asObserver());
}

/* merges an array of action objects into a single object :ie
 [{doBar$, doFoo$}, {doBaz$, doBar$}] => {doBar$, doFoo$, doBaz$}
*/
function mergeActionsByName(actionSources) {
  var validActions = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  return actionSources.reduce(function (result, actions) {
    // console.log("acions",Object.keys(actions),validActions)
    Object.keys(actions).filter(function (key) {
      return validActions.length === 0 || validActions.indexOf(key.replace('$', '')) > -1;
    }).map(function (key) {
      var action = actions[key];
      if (key in result) {
        result[key] = merge(result[key], action);
      } else {
        result[key] = action;
      }
    });

    return result;
  }, {});
}

function logNext(next) {
  log.info(next);
}
function logError(err) {
  log.error(err);
}
function onDone(data) {
  log.info('DONE', data);
}

function preventDefault(event) {
  event.preventDefault();
  return event;
}

function formatData(data, type) {
  return { data: data, type: type };
}

function isTextNotEmpty(text) {
  return text !== '';
}

function exists(input) {
  return input !== null && input !== undefined;
}

Observable.prototype.onlyWhen = function (observable, selector) {
  return this.withLatestFrom(observable, function (self, other) {
    /*console.log("here in onlyWhen",self,other);*/return [self, other];
  }).filter(function (args) {
    return selector(args[1]);
  }).map(function (data) {
    return data[0];
  });
};

exports.Observable = Observable;

// utility to run multiple ones in parallel, see here :
// https://github.com/Reactive-Extensions/RxJS/blob/master/doc/mapping/async/comparing.md#asyncparallel

function wrapArrayParallel(items) {
  // let __items = Rx.Observable.from()
  return _rx2.default.Observable.forkJoin.apply(null, items);
}

/*TODO: implement, we need to find a way to do inverted filtering*/
function opposite(method) {}