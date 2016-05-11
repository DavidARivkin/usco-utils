import Rx from 'rx';
const Observable = Rx.Observable;
const Subject = Rx.Subject;
const merge = Rx.Observable.merge;

/* create an action that is both an observable AND
a function/callable*/
export function createAction(paramsMap) {
  function action(params) {
    // use rest parameters or not ? ...params
    if (paramsMap && typeof paramsMap === 'function') {
      params = paramsMap(params);
    }
    action.onNext(params);
  }
  // assign prototype stuff from Subject
  for (let key in Rx.Subject.prototype) {
    action[key] = Rx.Subject.prototype[key];
  }

  Rx.Subject.call(action);

  return action;
}

/* From https://github.com/staltz/combineLatestObj*/
export function combineLatestObj(obj) {
  var sources = [];
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key.replace(/\$$/, ''));
      sources.push(obj[key]);
    }
  }
  return Rx.Observable.combineLatest(sources, function () {
    var argsLength = arguments.length;
    var combination = {};
    for (var i = argsLength - 1; i >= 0; i--) {
      combination[keys[i]] = arguments[i];
    }
    return combination;
  });
}

// From https://github.com/futurice/power-ui/blob/85d09645ecadc85bc753ba42fdd841d22d8bdd10/src/utils.js
export function replicateStream(origin$, proxy$) {
  origin$.subscribe(proxy$.asObserver());
}

/* merges an array of action objects into a single object :ie
 [{doBar$, doFoo$}, {doBaz$, doBar$}] => {doBar$, doFoo$, doBaz$}
*/
export function mergeActionsByName(actionSources, validActions = []) {
  return actionSources.reduce(function (result, actions) {
    // console.log("acions",Object.keys(actions),validActions)
    Object.keys(actions).filter(key => validActions.length === 0 || validActions.indexOf(key.replace('$', '')) > -1).map(function (key) {
      const action = actions[key];
      if (key in result) {
        result[key] = merge(result[key], action);
      } else {
        result[key] = action;
      }
    });

    return result;
  }, {});
}

export function logNext(next) {
  log.info(next);
}
export function logError(err) {
  log.error(err);
}
export function onDone(data) {
  log.info('DONE', data);
}

export function preventDefault(event) {
  event.preventDefault();
  return event;
}

export function formatData(data, type) {
  return { data, type };
}

export function isTextNotEmpty(text) {
  return text !== '';
}

export function exists(input) {
  return input !== null && input !== undefined;
}

Observable.prototype.onlyWhen = function (observable, selector) {
  return this.withLatestFrom(observable, (self, other) => {
    /*console.log("here in onlyWhen",self,other);*/return [self, other];
  }).filter(function (args) {
    return selector(args[1]);
  }).map(data => data[0]);
};

export { Observable };

// utility to run multiple ones in parallel, see here :
// https://github.com/Reactive-Extensions/RxJS/blob/master/doc/mapping/async/comparing.md#asyncparallel
function wrapArrayParallel(items) {
  // let __items = Rx.Observable.from()
  return Rx.Observable.forkJoin.apply(null, items);
}

/*TODO: implement, we need to find a way to do inverted filtering*/
function opposite(method) {}