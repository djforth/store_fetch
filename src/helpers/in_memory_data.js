import { isFullObject } from './index';
import { curry } from '@djforth/utilities';

let dbData = new Map();

const isMap = map => Object.getPrototypeOf(map) === Map.prototype;

const createDataObject = json => {
  const data = new Map();
  // console.log(Object.keys(json));
  Object.entries(json).forEach(([k, v]) => {
    data.set(k, createData(v));
  });

  return data;
};

const createDataArray = json => {
  const data = new Map();
  json.forEach((d, i) => {
    data.set(i, createData(d));
  });
  return data;
};

export const createData = json => {
  if (isFullObject(json)) return createDataObject(json);
  if (Array.isArray(json)) return createDataArray(json);

  return json;
};

const searchData = (iterator, id, hasData) => {
  let data;
  let found = null;
  do {
    data = iterator.next().value;
    console.log('data', data);
    if (data) {
      const [key, value] = data;
      console.log('data', data);
      if (hasData(value)) {
        found = value;
      } else if (isMap(value)) {
        found = searchData(value[Symbol.iterator](), id, hasData);
      }
    }
  } while (data !== undefined && found === null);
  return found;
};

const Find = schema => (db, store, id) => {
  const iterator = db.get(store)[Symbol.iterator]();
  const primaryKey = getPrimaryKey(schema, store);

  const hasData = curry(HasData, primaryKey, id);
  console.log(db.get(store), id);
  let data;
  const found = searchData(iterator, id, hasData);
  return found;
};

export const finder = (data, store, keys) => {
  console.log('data', data, store, keys);
  if (data.size === 0) return data;
  const st = store ? data.get(store) : data;
  if (!keys) return st;

  if (Array.isArray(keys)) {
    return keys.reduce((v, k) => {
      if (v instanceof Map && v.has(k)) {
        return v.get(k);
      }

      return null;
    }, st);
  }
  return st.get(keys);
};

const setter = ({ data, keys, value }) => {
  if (Array.isArray(keys)) {
    if (data.has(keys[0])) {
      const k = keys.length > 2 ? keys.slice(1, keys.length) : keys[1];
      return setter({ data: data.get(keys[0]), keys: k, value });
    }

    // console.warn('Key not found');
    data.set(keys, value);
    return data;
  }
  data.set(keys, value);
  console.log('setter data', data);
  return data;
};

const setUpdated = (store, data, primaryKey) => {
  if (!primaryKey) return [{ store, updated: new Date().getTime() }];

  return data.map(item => ({ key: item[primaryKey], store, updated: new Date().getTime() }));
};

const getPrimaryKey = (schema, st) => {
  const key = schema.find(({ store }) => store === st);
  return key.keyPath.keyPath || 'id';
};

const HasData = (primaryKey, id, value) => value.has(primaryKey) && value.get(primaryKey) === id;

export const SetData = ({ data, keys, store, value }) => {
  if (keys) {
    const st = data.get(store);
    st.set(keys, value);
    data.set(store, st);
  } else {
    data.set(store, value);
  }
  return data;
};

export const manageData = schema => {
  if (dbData.size === 0) {
    schema.forEach(({ store }) => {
      dbData.set(store, new Map());
    });
    dbData.set('updated', new Map());
  }
  const find = Find(schema);
  return {
    clear: () => {
      dbData.set(store, new Map());
    },
    deepSet: (keys, store, value, useKeys) => {
      const d = createData(value);
      dbData = SetData({ data: dbData, keys, store, value: d });

      const primaryKey = useKeys ? getPrimaryKey(schema, store) : false;
      dbData.set('updated', createData(setUpdated(store, value, primaryKey)));
    },
    find: (store, id) => find(dbData, store, id),
    get: (store, indexes) => finder(dbData, store, indexes),
    getAll: () => dbData,
    set: (store, value, useKeys) => {
      const d = createData(value);
      dbData.set(store, createData(value));
      const primaryKey = useKeys ? getPrimaryKey(schema, store) : false;
      dbData.set('updated', createData(setUpdated(store, d, primaryKey)));
      console.log(dbData);
    },
  };
};
