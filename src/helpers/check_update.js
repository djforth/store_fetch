import {
  // isDate,
  isAfter,
  // isBefore,
  isValid,
  isWithinInterval,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
} from 'date-fns';

import { curry } from '@djforth/utilities';

const checkArray = array => array && Array.isArray(array) && array.length > 1;

const setTimeChange = ({ unit, value }) => {
  switch (unit.toLowerCase()) {
    case 'days':
      return subDays(new Date(), value);
    case 'hours':
      return subHours(new Date(), value);
    case 'minutes':
      return subMinutes(new Date(), value);
    case 'months':
      return subMonths(new Date(), value);
    case 'seconds':
      return subSeconds(new Date(), value);
    default:
      return subDays(new Date(), value);
  }
};

const getUpdatedList = async (k, manager, store) => {
  const keys = Array.isArray(k) ? k : [k];
  const list = await manager.where('updated', { store }).catch(e => {
    console.error(e);
  });
  const filtered = list.filter(({ key }) => keys.includes(key));
  return filtered;
};

const getRecentArray = data =>
  data.reduce((date, { updated }) => {
    const localUpdated = new Date(updated);
    if (isValid(date) || isAfter(localUpdated, date)) return localUpdated;
    return date;
  }, new Date(data[0].updated));

const getRecentObject = data => {
  const localUpdated = new Date(data.updated);
  /* eslint-disable */
  if (isValid(localUpdated)) return false;
  return localUpdated;
}

const getRecent = (data)=>{
  const recent = Array.isArray(data) ? getRecentArray(data) : getRecentObject(data);
  return recent;
}
  

const getLocalUpdated = async (manager, store) => {
  const data = await manager.where('updated', { store }).catch(e => {
    console.error(e);
  });
  if (!checkArray(data)) return false;
  const localUpdated = getRecent(data);
  /* eslint-disable */
  if (!isValid(localUpdated)) return false;
  /* eslint-enable */
  return localUpdated;
};

const getLocalUpdatedKeys = async (keys, manager, store) => {
  const data = await getUpdatedList(keys, manager, store).catch(e => {
    console.error(e);
  });
  if (!checkArray(data)) return false;
  const date = getRecent(data);
  return date;
};

const checkLocalUpdated = (localUpdated, timeScale) => {
  const earliest = setTimeChange(timeScale);
  return !isWithinInterval(localUpdated, { start: earliest, end: new Date() });
};

export default async ({ checker, keys, manager, store, timescales }) => {
  if (!manager) return true;
  const getLocal = keys ? curry(getLocalUpdatedKeys, keys) : getLocalUpdated;
  const localUpdated = await getLocal(manager, store);
  if (!localUpdated) return true;
  if (checker) return checker(localUpdated, timescales);
  const update = checkLocalUpdated(localUpdated, timescales);
  return update;
};
