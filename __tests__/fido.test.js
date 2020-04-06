/*eslint-disable */
import Fido from '../src';
import hasIndexDB from '../src/helpers/check_ie';
import getData, {jsonData, jsonUpdate} from './__helpers__/data.helper'

export const isFullObject = obj => Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length > 0;

import { addDays, isDate, format, parseJSON, startOfDay, subDays, subHours, subMinutes, subMonths, subSeconds  } from 'date-fns';
/* eslint-enable */

const DATA = {
  items: [1, 2, 3, 4, 5],
  version: 3,
  title: 'Test',
  updated: new Date(),
  additional: {
    foo: 'foo',
    bar: {
      foo: new Date(),
      boolean: false,
      bar: { foo: new Date() },
    },
  },
  boolean: true,
};

const DATA_ARRAY = (() => {
  const d = [];
  const date = new Date();
  let i = 20;
  while (i > 0) {
    d.push({ title: `Title ${i}`, id: i, date: addDays(date, i) });
    i--;
  }
  return d.reverse();
})();

jest.mock('../src/helpers/check_ie');

const schemaArray = [
  {
    store: 'arrayList',
    keyPath: { keyPath: 'id', autoIncrement: true },
    indexes: ['id'],
  },
];

const schemaSessions = [
  {
    store: 'sessions',
    keyPath: { keyPath: 'id' },
    indexes: ['id'],
  },
];

const schemaObject = [
  {
    store: 'objectList',
    keyPath: { keyPath: 'key' },
    indexes: ['key'],
  },
];

const isMap = value => value instanceof Map;

const checkMap = (data, expected) => {
  data.forEach((v, k) => {
    if (isMap(v)) {
      checkMap(v, expected[k]);
    } else {
      expect(v).toEqual(expected[k]);
    }
  });
};

const checkStore = (data, expectedData) => {
  const iterator = data.entries();
  let map = iterator.next().value;
  while (map && map[0]) {
    const [key, value] = map;

    if (isMap(value)) {
      checkMap(value, expectedData[key]);
    } else {
      expect(value).toEqual(expectedData[key]);
    }

    map = iterator.next().value;
  }
};

const updateChecks = (getFido, data, timeSub, title) => {
  describe(`Update in ${title} `, () => {
    let fido;
    beforeAll(() => {
      fido = getFido();
    });

    test(`should update if older than 7 ${title}`, async () => {
      await fido.set({
        store: 'updated',
        value: { store: 'arrayList', updated: timeSub(new Date(), 10).getTime() },
      });

      fetch.mockResponseOnce(JSON.stringify(data));
      await fido.update({ store: 'arrayList', url: 'http://www.test.co.uk' }, { unit: title, value: 7 });

      expect(fetch.mock.calls.length).toEqual(2);

      expect(fetch.mock.calls[0][0]).toEqual('http://www.test.co.uk');

      const d = await fido.getJS('arrayList', 1);
      const last = await fido.getJS('arrayList', 21);
      expect(d).toEqual(expect.objectContaining({ title: 'Title 1-update' }));

      expect(last).toEqual(expect.objectContaining({ title: 'new item' }));
    });

    test(`should not update if less than 7 ${title}`, async () => {
      await fido.set({
        store: 'updated',
        value: { store: 'arrayList', updated: timeSub(new Date(), 5).getTime() },
      });
      fetch.resetMocks();

      fetch.mockResponseOnce(JSON.stringify(data));
      await fido.update({ store: 'arrayList', url: 'http://www.test.co.uk' }, { unit: title, value: 7 });

      expect(fetch.mock.calls.length).toEqual(0);
      const d = await fido.getJS('arrayList', 1);
      expect(d).toEqual(expect.objectContaining({ title: 'Title 1' }));
    });
  });
};

describe('fido tests', () => {
  let fido, data;
  describe('If no indexedDB', () => {
    describe('if data an array', () => {
      beforeAll(async () => {
        fetch.mockResponseOnce(JSON.stringify(DATA_ARRAY));
        hasIndexDB.mockImplementationOnce(() => false);
        fido = await Fido({ schema: schemaArray, db: 'objectDB', version: 1 });
        await fido.fetch('arrayList', 'http://www.test.co.uk');
        data = await fido.getAll();
      });

      test('should set fido if no indexedDB', () => {
        checkStore(data.get('arrayList'), DATA_ARRAY);
      });

      describe('Get data', () => {
        test('should find store', async () => {
          const st = await fido.get('arrayList');
          checkStore(st, DATA_ARRAY);
        });

        test('should find store + index', async () => {
          const d = await fido.get('arrayList', 2);
          checkStore(d, DATA_ARRAY[2]);
        });

        test('should find store + index + date', async () => {
          const d = await fido.get('arrayList', [2, 'date']);
          expect(d).toEqual(DATA_ARRAY[2].date);
        });
      });

      describe('Get data as JS', () => {
        test('should find store', async () => {
          const st = await fido.getJS('arrayList');
          expect(Array.isArray(st)).toBeTrue();
        });

        test('should find store + index', async () => {
          const d = await fido.getJS('arrayList', 2);
          expect(d).toEqual(DATA_ARRAY[2]);
        });

        test('should find store + index + date', async () => {
          const d = await fido.getJS('arrayList', [2, 'date']);
          expect(d).toEqual(DATA_ARRAY[2].date);
        });
      });

      describe('set data', () => {
        test('should set data', async () => {
          await fido.set({ store: 'arrayList', keys: [2, 'title'], value: 'Updated Title' });

          const title = await fido.get('arrayList', [2, 'title']);
          expect(title).toEqual('Updated Title');
        });
      });

      describe('find in data', () => {
        let sessions;
        beforeAll(async () => {
          fetch.mockResponseOnce(JSON.stringify(getData()));
          hasIndexDB.mockImplementationOnce(() => false);

          fido = await Fido({ schema: schemaSessions, db: 'sessionsDB', version: 1 });

          await fido.fetch('sessions', 'http://www.sessions.co.uk');
          sessions = await fido.get('sessions');
          // console.log(sessions.get(0), getData()[0].id);
        });

        test('should return the correct data', async () => {
          const session = await fido.find('sessions', 'all-2013-01-28');
          expect(session.get('id')).toEqual('all-2013-01-28');
        });

        test('should return the correct data in JS', async () => {
          const session = await fido.findJS('sessions', 'all-2013-01-28');
          expect(session.id).toEqual('all-2013-01-28');
        });
      });
    });

    describe('if data an object', () => {
      beforeAll(async () => {
        fetch.mockResponseOnce(JSON.stringify(DATA));
        hasIndexDB.mockImplementationOnce(() => false);
        fido = await Fido({ schema: schemaObject, db: 'testDB', version: 1 });
        await fido.fetch('objectList', 'http://www.test.co.uk');
        data = await fido.getAll();
      });

      test('should set fido if no indexedDB', () => {
        checkStore(data.get('objectList'), DATA);
      });

      describe('Get data', () => {
        test('should find store', async () => {
          const st = await fido.get('objectList');
          checkStore(st, DATA);
        });

        test('should find store + key', async () => {
          const d = await fido.get('objectList', 'updated');
          expect(d).toEqual(DATA.updated);
        });

        test('should find store + key + date', async () => {
          const d = await fido.get('objectList', ['additional', 'bar']);
          checkStore(d, DATA.additional.bar);
          // expect(d).toEqual(DATA.additional.bar);
        });
      });

      describe('Get data to JS', () => {
        test('should find store', async () => {
          const st = await fido.getJS('objectList');
          expect(isFullObject(st)).toBeTrue();
        });

        test('should find store + key', async () => {
          const d = await fido.getJS('objectList', 'updated');
          expect(d).toEqual(DATA.updated);
        });

        test('should find store + key + date', async () => {
          const d = await fido.getJS('objectList', ['additional', 'bar']);
          expect(d).toEqual(DATA.additional.bar);
        });
      });

      describe('set data', () => {
        test('should set data', async () => {
          await fido.set({ store: 'objectList', keys: ['additional', 'bar', 'bar', 'title'], value: 'Some title' });

          const title = await fido.get('objectList', ['additional', 'bar', 'bar', 'title']);
          expect(title).toEqual('Some title');
        });
      });
    });
  });

  describe('if indexedDB', () => {
    describe('If object', () => {
      beforeAll(async () => {
        fetch.mockResponseOnce(JSON.stringify(DATA));
        hasIndexDB.mockImplementationOnce(() => true);
        fido = await Fido({ schema: schemaObject, db: 'testDB', version: 1 }).catch(e => {
          console.error(e);
        });
        await fido.fetch('objectList', 'http://www.test.co.uk').catch(e => {
          console.error(e);
        });
        data = await fido.getAll();
      });

      afterAll(() => {
        fido.clear('objectList');
        fido.clear('updated');
        fido.close();
        fido = null;
      });

      test('should set fido if indexedDB', () => {
        checkStore(data.get('objectList'), DATA);
      });

      test('should have set updated', async () => {
        const d = await fido.getJS('updated');
        const updated = d[d.length - 1];
        expect(updated).toEqual(
          expect.objectContaining({
            store: 'objectList',
            updated: expect.any(Number),
          })
        );
      });

      describe('Get data', () => {
        test('should find store', async () => {
          const st = await fido.get('objectList');
          checkStore(st, DATA);
        });

        test('should find store + key', async () => {
          const d = await fido.get('objectList', 'updated');

          expect(d).toEqual(DATA.updated);
        });

        test('should find store + key + date', async () => {
          const d = await fido.get('objectList', ['additional', 'bar', 'bar', 'foo']);

          expect(d).toEqual(DATA.additional.bar.bar.foo);
        });
      });

      describe('Get data to JS', () => {
        test('should find store', async () => {
          const st = await fido.getJS('objectList');
          expect(isFullObject(st)).toBeTrue();
        });

        test('should find store + key', async () => {
          const d = await fido.getJS('objectList', 'updated');
          expect(d).toEqual(DATA.updated);
        });

        test('should find store + key + date', async () => {
          const d = await fido.getJS('objectList', ['additional', 'bar']);
          expect(d).toEqual(DATA.additional.bar);
        });
      });

      describe('set data', () => {
        test('should set data', async () => {
          await fido.set({ store: 'objectList', keys: 'version', value: 4 });

          const version = await fido.get('objectList', 'version');
          expect(version).toEqual(4);
        });

        test('should set data if keys is Array', async () => {
          await fido.set({ store: 'objectList', keys: ['version'], value: 5 });

          const version = await fido.get('objectList', 'version');
          expect(version).toEqual(5);
        });

        test('should set data', async () => {
          await fido.set({ store: 'objectList', keys: ['additional', 'bar', 'bar'], value: { title: 'Some title' } });

          const d = await fido.get('objectList');

          const title = await fido.get('objectList', ['additional', 'bar', 'bar', 'title']);

          expect(title).toEqual('Some title');
        });
      });
    });

    describe('If array', () => {
      // let data;
      beforeAll(async () => {
        fetch.mockResponseOnce(JSON.stringify(DATA_ARRAY));
        hasIndexDB.mockImplementationOnce(() => true);
        fido = await Fido({ schema: schemaArray, db: 'arrayDB', version: 1 });
        await fido.fetch('arrayList', 'http://www.test.co.uk');
        data = await fido.getAll();
      });

      afterAll(() => {
        ido.clear('arrayList');
        fido.clear('updated');
        fido.close();
        fido = null;
      });

      test('should set fido if no indexedDB', () => {
        checkStore(data.get('arrayList'), DATA_ARRAY);
      });

      test('should have set updated', async () => {
        const d = await fido.getJS('updated');
        const updated = d[d.length - 1];
        expect(updated).toEqual(
          expect.objectContaining({
            store: 'arrayList',
            updated: expect.any(Number),
          })
        );
      });

      describe('Get data', () => {
        test('should find store', async () => {
          const d = await fido.get('arrayList');
          checkStore(d, DATA_ARRAY);
        });

        test('should find store + index', async () => {
          const d = await fido.get('arrayList', 3);
          checkStore(d, DATA_ARRAY[2]);
        });

        test('should find store + index + date', async () => {
          const d = await fido.get('arrayList', [2, 'date']);
          expect(d).toEqual(DATA_ARRAY[1].date);
        });
      });

      describe('Get data as JSON', () => {
        test('should find store', async () => {
          const st = await fido.getJS('arrayList');
          expect(Array.isArray(st)).toBeTrue();
          // checkStore(st, DATA_ARRAY);
        });

        test('should find store + index', async () => {
          const d = await fido.getJS('arrayList', 1);
          expect(d).toEqual(DATA_ARRAY[0]);
        });

        test('should find store + index + date', async () => {
          const d = await fido.getJS('arrayList', [2, 'date']);
          expect(d).toEqual(DATA_ARRAY[1].date);
        });
      });

      describe('Get data as JS', () => {
        test('should find store', async () => {
          const st = await fido.getJS('arrayList');
          expect(Array.isArray(st)).toBeTrue();
        });

        test('should find store + index', async () => {
          const d = await fido.getJS('arrayList', 1);
          expect(d).toEqual(DATA_ARRAY[0]);
        });

        test('should find store + index + date', async () => {
          const d = await fido.getJS('arrayList', [2, 'date']);
          expect(d).toEqual(DATA_ARRAY[1].date);
        });
      });

      describe('set data', () => {
        test('should set data', async () => {
          await fido.set({ store: 'arrayList', value: { title: `Update Title`, id: 4 } });

          const title = await fido.get('arrayList', 4);
          expect(title.get('title')).toEqual('Update Title');
        });
      });

      describe('find in data', () => {
        let sessions;
        beforeAll(async () => {
          fetch.mockResponseOnce(JSON.stringify(getData()));
          hasIndexDB.mockImplementationOnce(() => true);

          fido = await Fido({ schema: schemaSessions, db: 'sessionsDB', version: 1 });

          await fido.fetch('sessions', 'http://www.sessions.co.uk');
          sessions = await fido.get('sessions');
        });

        test('should return the correct data', async () => {
          const session = await fido.find('sessions', 'all-2013-01-28');
          expect(session.get('id')).toEqual('all-2013-01-28');
        });

        test('should return the correct data in JS', async () => {
          const session = await fido.findJS('sessions', 'all-2013-01-28');
          expect(session.id).toEqual('all-2013-01-28');
        });
      });
    });
  });
});
