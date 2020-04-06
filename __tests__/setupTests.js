import '@djforth/jest-matchers';
import mockFetch from 'jest-fetch-mock';

import { isSameDay, format } from 'date-fns';

import { isDate, isElement, isMap, isPlainObject, isSet, isString, isWeakMap, isWeakSet } from 'lodash';
import 'fake-indexeddb/auto';

// global.I18n = {
//   t: (key, opts) => key,
// };

global.fetch = mockFetch;
// global.indexedDB = fakeIDB;

global.requestAnimationFrame = function(callback) {
  setTimeout(callback, 0);
};

expect.extend({
  toBeSameDay(received, date) {
    const pass = isSameDay(received, date);
    if (pass) {
      return {
        message: () => `expected ${format(received, 'yyyy-MM-dd')} to be the same day as ${format(date, 'yyyy-MM-dd')}`,
        pass: true,
      };
    }
    return {
      message: () =>
        `expected ${format(received, 'yyyy-MM-dd')} to not be the same day as ${format(date, 'yyyy-MM-dd')}`,
      pass: false,
    };
  },
});

const checkArray = (array, checker) =>
  array.reduce((ch, v) => {
    if (!checker(v)) return false;
    return ch;
  }, true);

expect.extend({
  anArrayOf(received, type) {
    const pass = (() => {
      if (!Array.isArray(received)) return false;
      switch (type.toLowerCase()) {
        case 'array':
          return checkArray(received, isArray);
        case 'date':
          return checkArray(received, isDate);
        case 'element':
          return checkArray(received, isElement);
        case 'map':
          return checkArray(received, isMap);
        case 'object':
          return checkArray(received, isPlainObject);
        case 'set':
          return checkArray(received, isSet);
        case 'string':
          return checkArray(received, isString);
        case 'weakmap':
          return checkArray(received, isWeakMap);
        case 'weakset':
          return checkArray(received, isWeakSet);
        default:
          return false;
      }
    })();
    if (pass) {
      return {
        message: () => `expected to be and array of ${type}`,
        pass: true,
      };
    }
    return {
      message: () => `expected to be and array of ${type}`,
      pass: false,
    };
  },
});
