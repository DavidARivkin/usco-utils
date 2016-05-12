'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('utils', function () {
  describe('isEmpty', function () {
    it('should determine if a string is empty', function () {
      var emptyInput = '';
      var notEmptyInput = 'foo';
      _assert2.default.strictEqual((0, _utils.isEmpty)(emptyInput), true);
      _assert2.default.strictEqual((0, _utils.isEmpty)(notEmptyInput), false);
    });

    it('should not fail with a non string input ', function () {
      var input = { foo: 42 };
      _assert2.default.strictEqual((0, _utils.isEmpty)(input), false);
    });
  });

  describe('getNameAndExtension', function () {
    it('should return the name and the extension from a dotted string', function () {
      var input = 'foo.bar.STL';
      _assert2.default.deepEqual((0, _utils.getNameAndExtension)(input), { name: 'foo.bar.STL', ext: 'stl' });
    });
  });
});