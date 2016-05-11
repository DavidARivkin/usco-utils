'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('utils', function () {
  describe('isEmpty', () => {
    it('should determine if a string is empty', function () {
      const emptyInput = '';
      const notEmptyInput = 'foo';
      _assert2.default.strictEqual((0, _utils.isEmpty)(emptyInput), true);
      _assert2.default.strictEqual((0, _utils.isEmpty)(notEmptyInput), false);
    });

    it('should not fail with a non string input ', function () {
      const input = { foo: 42 };
      _assert2.default.strictEqual((0, _utils.isEmpty)(input), false);
    });
  });

  describe('getNameAndExtension', () => {
    it('should return the name and the extension from a dotted string', function () {
      const input = 'foo.bar.STL';
      _assert2.default.deepEqual((0, _utils.getNameAndExtension)(input), { name: 'foo.bar.STL', ext: 'stl' });
    });
  });
});