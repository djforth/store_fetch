/*eslint-disable */
import manageDB from '../src/manage_db.js';

import { addDays, startOfDay } from 'date-fns'

/* eslint-enable */
describe('fetch_data/manage_db', () => {
  const schema = [
    {
      store: 'updated',
      keyPath: { autoIncrement: true },
      indexes: ['store'],
    },
    {
      store: 'main-test',
      keyPath: { autoIncrement: true },
      indexes: ['data'],
    },
    {
      store: 'sub-test',
      keyPath: { autoIncrement: true },
      indexes: [{ index: 'data', unique: true }],
    },
    {
      store: 'key-test',
      keyPath: { keyPath: 'key' },
      indexes: ['key'],
    },
  ];

  const schemaUpdate = [
    {
      store: 'updated',
      keyPath: { autoIncrement: true },
      indexes: ['store'],
    },
    {
      store: 'main-update-test',
      keyPath: { keyPath: 'key' },
      indexes: ['data'],
    },
    {
      store: 'sub-updated-test',
      keyPath: { autoIncrement: true },
      indexes: [{ index: 'data', unique: true }],
    },
  ];

  let database, manager, stores;
  const date = startOfDay(new Date(2013, 0, 28));

  beforeAll(async () => {
    manager = await manageDB('test', schema, 1);
    const db = await manager.getDB();
    stores = db.objectStoreNames;
    await manager.add('updated', [
      { store: 'main-test', date: date.getTime() },
      { store: 'sub-test', date: date.getTime() },
      { store: 'key-test', date: date.getTime() },
    ]);
  });

  describe('check functions returned', () => {
    ['add', 'clear', 'delete', 'first', 'find', 'get', 'getAll', 'getDB', 'keys', 'last', 'set', 'update'].forEach(
      method => {
        test(`should have function ${method}`, async () => {
          expect(manager).hasKey(method);
          expect(manager[method]).toBeFunction();
        });
      }
    );
  });

  describe('Check schema creates', () => {
    schema.forEach(({ store }) => {
      test(`should create ${store} store`, () => {
        expect(stores.contains(store)).toBeTrue();
      });
    });
  });

  describe('Check data flushed on upgrade', () => {
    beforeAll(async () => {
      manager.close();
      manager = await manageDB('test', schemaUpdate, 2);
      const db = await manager.getDB();
      stores = db.objectStoreNames;
    });

    afterAll(async () => {
      manager.close();
      manager = await manageDB('test', schema, 3);
      const db = await manager.getDB();
      stores = db.objectStoreNames;
      await manager.add('updated', [
        { store: 'main-test', date: date.getTime() },
        { store: 'sub-test', date: date.getTime() },
        { store: 'key-test', date: date.getTime() },
      ]);
    });

    test('should have deleted old object stores', () => {
      expect(stores).toHaveLength(3);
    });

    schemaUpdate.forEach(({ store }) => {
      test(`should create ${store} store`, () => {
        expect(stores.contains(store)).toBeTrue();
      });
    });
  });

  describe('check actions', () => {
    beforeEach(async () => {
      await manager.add('updated', [
        { store: 'main-test', date: date.getTime() },
        { store: 'sub-test', date: date.getTime() },
        { store: 'key-test', date: date.getTime() },
      ]);
      await manager.add('main-test', [{ data: 'foo' }, { data: 'bar' }, { data: 'foobar' }]);
      await manager.add('sub-test', [
        { data: 'foo', date },
        { data: 'bar', date: addDays(date, 1) },
        { data: 'foobar', date: addDays(date, 2) },
      ]);

      await manager.add('key-test', [
        { data: 'foo', key: 'key1' },
        { data: 'bar', key: 'key2' },
        { data: 'foobar', key: 'key3' },
      ]);
    });

    afterEach(async () => {
      await manager.clear('updated');
      await manager.clear('main-test');
      await manager.clear('sub-test');
      await manager.clear('key-test');
    });

    describe('Get actions', () => {
      test('should get an item from the store if incremental', async () => {
        const d = await manager.get('updated', 1);
        expect(d.date).toEqual(date.getTime());
      });

      test('should get an item from the store if not incremental', async () => {
        const d = await manager.get('key-test', 'key2', 'key');
        expect(d.data).toEqual('bar');
      });

      test('should getAll from store', async () => {
        const updated = await manager.getAll('updated');

        expect(updated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ store: 'main-test', date: date.getTime() }),
            expect.objectContaining({ store: 'sub-test', date: date.getTime() }),
            expect.objectContaining({ store: 'key-test', date: date.getTime() }),
          ])
        );
      });

      test('should get first data', async () => {
        const data = await manager.first('main-test');

        expect(data).toEqual(expect.objectContaining({ data: 'foo' }));
      });

      test('should get last data', async () => {
        const data = await manager.last('main-test');

        expect(data).toEqual(expect.objectContaining({ data: 'foobar' }));
      });
    });

    describe('Find data', () => {
      test('should find data', async () => {
        const updated = await manager.getAll('main-test');
        const data = await manager.find('main-test', { data: 'foobar' });
        expect(data).toEqual(expect.objectContaining({ data: 'foobar' }));
      });

      test('should find updated', async () => {
        const data = await manager.find('updated', { store: 'main-test' });

        expect(data).toEqual(expect.objectContaining({ store: 'main-test', date: date.getTime() }));
      });

      test('should search data', async () => {
        const data = await manager.where('main-test', { data: ['bar', 'foo'] });
        expect(data).toHaveLength(2);
        expect(data).toEqual(
          expect.arrayContaining([expect.objectContaining({ data: 'bar' }), expect.objectContaining({ data: 'foo' })])
        );
      });
    });

    describe('Add, set and update data', () => {
      test('should add data', async () => {
        await manager.add('main-test', [{ data: 'foo2' }]);
        const data = await manager.find('main-test', { data: 'foo2' });
        expect(data).toEqual(expect.objectContaining({ data: 'foo2' }));
      });

      test('should set data', async () => {
        await manager.set('main-test', { id: 1, data: 'foo2' });

        const data = await manager.find('main-test', { data: 'foo2' });
        expect(data).toEqual(expect.objectContaining({ data: 'foo2' }));
      });

      test('should set data with key', async () => {
        // await manager.add('key-test', [
        //   { data: 'foo', key: 'key1' },
        //   { data: 'bar', key: 'key2' },
        //   { data: 'foobar', key: 'key3' },
        // ]);

        await manager.set('key-test', { data: 'foobar', key: 'key1' });

        const data = await manager.find('key-test', { key: 'key1' });
        expect(data).toEqual(expect.objectContaining({ data: 'foobar', key: 'key1' }));
      });

      test('should update data', async () => {
        const allData = await manager.getAll('main-test');

        const st = new Date();
        const updated = allData.map((d, i) => ({
          ...d,
          title: `${d}2`,
          date: addDays(st, i),
        }));

        await manager.update('main-test', updated, 'id');
        const data = await manager.getAll('main-test');
        expect(data).toEqual(updated);
      });
    });

    describe('delete', () => {
      test('should delete item', async () => {
        await manager.delete('main-test', 29);

        const allData = await manager.getAll('main-test');
        expect(allData).not.toContain(expect.objectContaining({ data: 'foo' }));
      });
    });

    describe('getAllKeys', () => {
      test('should delete item', async () => {
        const keys = await manager.keys('main-test');

        const allData = await manager.getAll('main-test');
        allData.forEach(({ id }) => {
          expect(keys).toContain(id);
        });
      });
    });
  });
});
