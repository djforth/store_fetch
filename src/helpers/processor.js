import { parseJSON, parseISO } from 'date-fns';

import { isFullObject } from './index';

const ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const RJSON_DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d+)$/;

const JSON_DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d+)Z$/;

const setDates = str => {
  if (ISO_REGEX.test(str)) return parseISO(str);
  if (RJSON_DATE.test(str)) return parseJSON(str);
  if (JSON_DATE.test(str)) return parseJSON(str);

  return str;
};

const processJson = data => {
  if (Array.isArray(data)) {
    return traverseArray(data);
  }

  if (isFullObject(data)) {
    return traverseObject(data);
  }

  if (typeof data === 'string') {
    return setDates(data);
  }

  return data;
};

const traverseObject = jsonData =>
  Object.entries(jsonData).reduce((data, [key, value]) => ({ ...data, [key]: processJson(value) }), {});

const traverseArray = jsonData => jsonData.map(data => processJson(data));

export default jsonData => processJson(jsonData);
