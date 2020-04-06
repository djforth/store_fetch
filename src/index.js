// import checkUpdate from './check_update';
import { curry } from '@djforth/utilities';

import { manageData, createData } from './helpers/in_memory_data';
import { DataUpdate, DBUpdate } from './helpers/update';
import { findAllData, findData } from './helpers/find_data';
import { processedData } from './helpers/data_format';
import checkUpdated from './helpers/check_update';
import convertToJS from './helpers/convert_to_js';
import GetData from './helpers/get_data';
import hasIndexDB from './helpers/check_ie';
import manageDB from './manage_db';
import Processor from './helpers/processor';

const getData = ({ data, manager, store, indexes }) => {
  if (manager) {
    return findData({ manager, store, indexes });
  }
  console.log('data', data);
  const d = data.get(store, indexes);
  console.log('d >>>>>', data.get(store));
  return Promise.resolve(d);
};

const fetcher = async (url, processor, store) => {
  const json = await GetData(url);
  return processor ? processor(json, store) : json;
};

const updatedOn = async ({ manager, store, data, keys }) => {
  if (!keys) return manager.add('updated', { store, updated: new Date().getTime(), updatedDate: new Date().toJSON() });
  const primaryKey = await manager.primaryKey(store);
  const promises = data.map(value => {
    const key = value[primaryKey];
    const d = { store, updated: new Date().getTime(), updatedDate: new Date().toJSON(), key };
    manager.add('updated', d);
  });

  return Promise.all(promises);
};

const storeData = async (manager, store, data, keys = false) => {
  // if (!data || data.length === 0) Promise.resolve('no data');
  const pd = processedData(data);
  await updatedOn({ manager, store, data: pd, keys });
  // await Promise.all(pd.map(manager.add('updated', { store, updated: new Date().getTime(), updatedDate: new Date().toJSON() });
  return Promise.all(pd.map(value => manager.set(store, value))).then(() => 'Updated');
};

export default async ({ db, fetch, schema, version }) => {
  const data = manageData(schema);
  let manager = null;
  let fetchInfo = fetch || {
    checker: null,
    updater: null,
    processor: null,
    timescales: { value: 7, unit: 'days' },
    url: '',
    useKeys: false,
  };
  if (hasIndexDB()) {
    manager = await manageDB(db, schema, version || 1);
  }

  return Promise.resolve({
    clear: store => {
      /* istanbul ignore next */
      if (manager) {
        return manager.clear(store);
      }
      data.clear();
      return Promise.resolve(data);
    },
    close: () => {
      if (manager) manager.close();
    },
    fetch: async (store, api, pro) => {
      const { processor, url, useKeys } = fetchInfo;
      const json = await fetcher(api || url, pro || processor, store);
      if (!manager) {
        data.set(store, createData(json));
      } else {
        await storeData(manager, store, json, useKeys);
      }
    },
    find: async (store, value) => {
      let d;
      if (manager) {
        d = await manager.get(store, value);
        return createData(d);
      }

      d = await Promise.resolve(data.find(store, value));
      return d;
    },
    findJS: async (store, value) => {
      let d;
      if (manager) {
        d = await manager.get(store, value);
        return Processor(d);
      }

      d = await Promise.resolve(data.find(store, value));
      console.log('data>>>>', d, data);
      return convertToJS(d);
    },
    get: async (store, indexes = null) => getData({ data, manager, store, indexes }),
    getJS: async (store, indexes = null) => {
      const d = await getData({ data, manager, store, indexes });
      return convertToJS(d);
    },
    getAll: async () => {
      if (manager) {
        const fd = curry(findAllData, manager);
        const dataPromises = schema.map(fd);
        return Promise.all(dataPromises).then(values =>
          values.reduce((combines, map) => new Map([...combines, ...map]), new Map())
        );
      }

      return Promise.resolve(data.getAll());
    },
    set: ({ store, keys, value }) => {
      const dp = Processor(value);
      if (manager) {
        return DBUpdate({ keys, manager, schema, store, value: dp });
      }
      console.log('setting', dp);
      return DataUpdate({ data, keys, store, value: dp });
    },
    setFetch: fi => {
      fetchInfo = { ...fetchInfo, ...fi };
    },
    update: async ({ keys, store, api }, ts) => {
      const { checker, processor, timescales, url, useKeys } = fetchInfo;
      const checked = await checkUpdated({ checker, keys, manager, store, timescales: ts || timescales });
      if (checked) {
        const json = await fetcher(api || url, processor, store);
        console.log('json', json);
        if (manager === null) {
          data.deepSet(keys, store, json, useKeys);
        } else {
          await storeData(manager, store, json, useKeys);
        }
      }

      // const d = await getData({ data, manager, store, indexes: keys });
      // console.log(JSON.stringify(d));
      // return convertToJS(d);
    },
    where: async (store, search) => {
      if (manager) {
        const d = await manager.find(store, search);
        return d;
      }
    },
  });
};
