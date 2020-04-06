import { isFullObject } from './index';

const getKeys = d => Object.keys(Array.isArray(d) ? d[0] : d);

export const checkObject = data => {
  if (!data) return false;
  const keys = getKeys(data);
  return ['key', 'value'].reduce((check, key) => {
    if (!check) return false;
    return keys.includes(key);
  }, true);
};

export const formatData = data => {
  if (!checkObject(data)) return data;

  if (Array.isArray(data)) {
    return data.reduce((obj, { key, value, ...attrs }) => {
      if (value) return { ...obj, [key]: value };
      return {
        ...obj,
        [key]: attrs,
      };
    }, {});
  }

  return data.value;
};

export const processedData = json => {
  if (Array.isArray(json)) return json;

  if (isFullObject(json)) {
    const obj = Object.entries(json).map(([key, value]) => ({ key, value }));
    return obj;
  }

  return { key: json, data: json };
};
