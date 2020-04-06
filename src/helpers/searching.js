import { createCursor } from '.';

export const find = async (opener, storeName, findData) => {
  const [[key, value]] = Object.entries(findData);
  const findRange = IDBKeyRange.only(value);
  const op = await opener(storeName, 'readonly');

  const data = [];
  let cursor = await createCursor(op, key, findRange);
  while (cursor) {
    data.push(cursor.value);
    cursor = await cursor.continue();
  }
  return data[data.length - 1];
};

export const where = async (opener, store, search) => {
  const [[key, value]] = Object.entries(search);
  const range = Array.isArray(value) ? value : [value, [value, '']];
  const op = await opener(store, 'readonly');
  const findRange = IDBKeyRange.bound(range[0], range[1]);

  let cursor = await createCursor(op, key, findRange);
  const data = [];
  while (cursor) {
    data.push(cursor.value);
    cursor = await cursor.continue();
  }

  return data;
};
