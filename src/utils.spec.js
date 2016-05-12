import test from 'ava'
import 'babel-core/register'
import { isEmpty, getNameAndExtension } from './utils'

test.cb('utils: isEmpty: should determine if a string is empty', t => {
  const emptyInput = ''
  const notEmptyInput = 'foo'
  t.deepEqual(isEmpty(emptyInput), true)
  t.deepEqual(isEmpty(notEmptyInput), false)
  t.end()
})

test.cb('utils: isEmpty: should not fail with a non string input', t => {
  const input = {foo: 42}
  t.deepEqual(isEmpty(input), false)
  t.end()
})

test.cb('utils: getNameAndExtension: should return the name and the extension from a dotted string', t => {
  const input = 'foo.bar.STL'
  t.deepEqual(getNameAndExtension(input), {name: 'foo.bar.STL', ext: 'stl'})
  t.end()
})
