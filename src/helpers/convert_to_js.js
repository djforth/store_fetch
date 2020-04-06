const isMap = value => value instanceof Map;

const convertToArray = data => {
  const array = [];
  const iterator = data.entries();
  let map = iterator.next().value;
  do {
    const [key, value] = map;
    if (isMap(value)) {
      const v = convertToJS(value);
      array.push(v);
    } else {
      array.push(value);
    }

    map = iterator.next().value;
  } while (map && map[0]);

  return array;
};

const convertToObject = data => {
  let obj = {};
  const iterator = data.entries();
  let map = iterator.next().value;
  do {
    let [key, value] = map;
    if (isMap(value)) {
      value = convertToJS(value);
    }

    obj = { ...obj, [key]: value };
    map = iterator.next().value;
  } while (map && map[0]);

  return obj;
};

const convertToJS = data => {
  // console.log(data, isMap(data));
  if (!isMap(data)) return data;
  if (data.size === 0) return [];
  const keys = data.keys();
  const key = keys.next().value;
  if (typeof key === 'number' || key === '0') {
    return convertToArray(data);
  }
  const obj = convertToObject(data);
  return obj;
};

export default convertToJS;
