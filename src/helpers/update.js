import { SetData } from './in_memory_data';
import { getKeyPath, isFullObject } from './index';

const checkKeys = keys => keys !== undefined && (typeof keys === 'string' || keys[0]);

const updateData = (data, keys, value) => {
  const [key, ...newKeys] = keys;

  if (keys.length === 1) {
    const v = isFullObject(value) ? { ...data[key], ...value } : value;
    return { ...data, [key]: v };
  }
  return { ...data, [key]: { ...data[key], ...updateData(data[key], newKeys, value) } };
};

export const DataUpdate = ({ data, keys, store, value }) => Promise.resolve(data.deepSet(keys, store, value));

export const DBUpdate = async ({ keys, manager, schema, store, value }) => {
  if (manager) {
    const kp = getKeyPath(schema, store);

    if (checkKeys(keys) && kp === 'key') {
      if (!Array.isArray(keys) || keys.length === 1) {
        const k = Array.isArray(keys) ? keys[0] : keys;
        return manager.set(store, { key: k, value: { [k]: value } });
      }

      const [key, ...newKeys] = keys;
      const currentData = await manager.get(store, key);

      return manager.set(store, { key, value: updateData(currentData.value, newKeys, value) });
    }

    if (isFullObject(value) && value.hasOwnProperty(kp)) {
      const currentData = await manager.get(store, value[kp]);

      return manager.set(store, { ...currentData, ...value });
    }

    return manager.set(store, value);
  }

  return Promise.resolve(SetData({ data, keys, store, value })).then(d => {
    data = d;
  });
};
