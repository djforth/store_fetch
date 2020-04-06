// import { isPlainObject } from 'lodash';
import { isFullObject } from './index';

const createUpdated = db => {
  if (!db.objectStoreNames.contains('updated')) {
    const store = db.createObjectStore('updated', { keyPath: 'id', autoIncrement: true });

    store.createIndex('date', 'date', { unique: false });
    store.createIndex('store', 'store', { unique: false });
    store.createIndex('key', 'key', { unique: false });
  }
};

const setKeyPath = keyPath => {
  const keys = Object.keys(keyPath);
  if (keys.includes('autoIncrement') && keys.length === 1) {
    return { keyPath: 'id', ...keyPath };
  }

  if (keys.length === 0) return { keyPath: 'key' };

  return keyPath;
};

const createStore = db => ({ keyPath, store, indexes }) => {
  if (!db.objectStoreNames.contains(store)) {
    const objStore = db.createObjectStore(store, setKeyPath(keyPath));

    if (Array.isArray(indexes)) {
      indexes.forEach(i => {
        if (typeof i === 'string') {
          objStore.createIndex(i, i, { unique: false });
        } else if (isFullObject(i)) {
          const { index, unique } = i;
          objStore.createIndex(index, index, { unique });
        }
      });
    }
  }
};

export default schema => async (db, oldVersion, newVersion, tx) => {
  const storeNames = [...db.objectStoreNames];
  const newStores = schema.filter(({ store }) => !storeNames.includes(store));
  const currentStore = schema.filter(({ store }) => storeNames.includes(store));
  const oldStore = storeNames.filter(st => {
    const cs = schema.find(({ store }) => store === st);
    if (cs) return false;
    return true;
  });

  oldStore.forEach(store => db.deleteObjectStore(store));
  // currentStore.forEach(store => db.clear(store));
  // // const clearStores = storeNames
  // //   .map(st => {
  // //     const oldStore = schema.find(({ store }) => store === st);
  // //     if (oldStore) return oldStore.store;
  // //     return null;
  // //   })
  // //   .filter(st => st !== null);
  // console.log(oldVersion < newVersion, storeNames);
  // if (oldVersion < newVersion) {
  //   // flushes data
  //   // try {
  //   //   const storeClear = storeNames.map(store =>
  //   //     // if (clearStores.includes(store)) {
  //   //     //   const tx = db.transaction(store, 'readwrite');
  //   //     //   const st = tx.objectStore(store);
  //   //     //   return db.clear(store);
  //   //     // }
  //   //     // if (clearStores.includes(store)) {
  //   //     db.deleteObjectStore(store)
  //   //   );
  //   //   // if (!storeNames.includes('updated')) {
  //   //   //   storeClear.push(db.clear('updated'));
  //   //   // }
  //   //   // await Promise.all(storeClear);
  //   // } catch (e) {
  //   //   console.warn(e);
  //   // }
  // }
  if (!storeNames.includes('updated')) createUpdated(db);
  newStores.forEach(createStore(db, newVersion));
  await tx.done;
};
