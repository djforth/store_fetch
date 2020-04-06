export const openStore = async (dbPromise, store, method = 'readwrite') => {
  const db = await dbPromise;
  const tx = db.transaction(store, method);
  return {
    db,
    store: tx.objectStore(store),
    tx,
  };
};

export const createCursor = async ({ store }, key, range) => {
  let cursor = null;
  try {
    const indexer = Array.isArray(key) ? store.index(...key) : store.index(key);
    cursor = await indexer.openCursor(range);
  } catch (e) {
    /* istanbul ignore next */
    console.log(e);
    // cursor = await store.openCursor(range);
  }
  if (cursor === null) {
    cursor = await store.openCursor(range);
  }

  return cursor;
};

export const isFullObject = obj =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length > 0;

export const getKeyPath = (schema, storeName) => {
  const st = schema.find(({ store }) => store === storeName);

  if (st && st.hasOwnProperty('keyPath')) {
    const kp = st.keyPath;
    if (kp.hasOwnProperty('keyPath')) {
      return kp.keyPath;
    }
  }
  return 'id';
};
