import { openDB } from 'idb';

import { curry } from '@djforth/utilities';

import AddingData from './helpers/adding_data';
import CreateStore from './helpers/create_stores';

import { openStore } from './helpers';

import { find, where } from './helpers/searching';

export default async (dbName, schema, version) => {
  /* istanbul ignore if  */
  if (!indexedDB) return Promise.resolve(null);
  /* istanbul ignore next */
  const name = `${dbName}-store`;

  const dbPromise = await openDB(name, version, {
    upgrade: CreateStore(schema),
    blocked(e) {
      console.log('blocked', e);
    },
    blocking(e) {
      console.log('blocking', e);
    },
    terminated() {
      console.log('teminated');
    },
  });

  const opener = curry(openStore, dbPromise);

  const adder = curry(AddingData, opener);

  return {
    add: async (storeName, val) => {
      await adder(storeName, val);
    },
    clear: async store => (await dbPromise).clear(store),
    close: () => dbPromise.close(),
    delete: async (store, key) => await dbPromise.delete(store, key),
    first: async store => {
      const data = await (await dbPromise).getAll(store);
      return data[0];
    },
    find: async (store, data) => find(opener, store, data),
    get: (store, key) => dbPromise.get(store, key),
    getAll: async store => await (await dbPromise).getAll(store),
    getDB: () => dbPromise,
    keys: async store => (await dbPromise).getAllKeys(store),
    primaryKey: async storeName => {
      const store = dbPromise.transaction(storeName).objectStore(storeName);
      return store.keyPath;
    },
    last: async store => {
      const data = await (await dbPromise).getAll(store);
      return data[data.length - 1];
    },
    set: async (store, val, key = null) => {
      await dbPromise.put(store, val);
    },
    update: async (storeName, data, key) => {
      const { store, tx } = await opener(storeName);
      for (let i = 0; i < data.length; i++) {
        store.put(data[i]);
      }

      await tx.done;
    },
    where: async (store, data) =>
      // const db = await dbPromise;
      where(opener, store, data),
  };
};
