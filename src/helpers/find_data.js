import { openStore } from './index';

import { createData, finder } from './in_memory_data';
import Processor from './processor';

import { formatData } from './data_format';

const splitIndexes = indexes => {
  if (Array.isArray(indexes)) {
    const [index, ...keys] = indexes;
    return { index, keys };
  }

  return { index: indexes };
};

export const findAllData = (manager, { store }) =>
  manager
    .getAll(store)
    .then(d => formatData(d))
    .then(d => createData(d))
    .then(d => {
      const map = new Map();
      map.set(store, d);
      return map;
    })
    .catch(err => {
      console.error('Error:', err);
    });

const checkKeys = async ({ manager, store, indexes }) => {
  const dbPromise = await manager.getDB();
  const { store: st } = await openStore(dbPromise, store);

  let { index, keys } = splitIndexes(indexes);
  if (st.keyPath === 'key') {
    const key = Array.isArray(indexes) ? indexes[0] : indexes;
    index = [key, 'key'];
  }

  return {
    index,
    keys,
  };
};

export const findData = async ({ manager, store, indexes }) => {
  const { data: d, keys } = await getData({ manager, store, indexes });
  if (d.length === 0) return new Map();
  const formattedData = formatData(d);
  const mappedData = createData(formattedData);
  if (!keys) {
    if (mappedData.size === 1 && mappedData.has(indexes)) return mappedData.get(indexes);
    return mappedData;
  }

  return finder(mappedData, null, keys);
};

export const getData = async ({ manager, store, indexes }) => {
  let data;

  if (indexes === null) {
    data = await manager.getAll(store);
    return { data, keys: null };
  }
  const { index, keys } = await checkKeys({ manager, store, indexes });
  if (Array.isArray(index)) {
    data = await manager.get(store, ...index).catch(err => {
      console.error('error>>>>', err);
    });
  } else {
    data = await manager.get(store, index).catch(err => {
      console.error('error>>>>', err);
    });
  }

  return { data, keys };
};
