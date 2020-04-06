import Fido from '../src';
import hasIndexDB from '../src/helpers/check_ie';
import getData, { jsonData, jsonUpdate } from './__helpers__/data.helper';

import {
  addDays,
  isDate,
  format,
  parseJSON,
  startOfDay,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
} from 'date-fns';
/* eslint-enable */

export const isFullObject = obj =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length > 0;

const DATA_ARRAY = (() => {
  const d = [];
  const date = new Date();
  let i = 20;
  while (i > 0) {
    d.push({ title: `Title ${i}`, id: i, date: addDays(date, i) });
    i--;
  }
  return d.reverse();
})();

jest.mock('../src/helpers/check_ie');

const schemaArray = [
  {
    store: 'arrayList',
    keyPath: { keyPath: 'id', autoIncrement: true },
    indexes: ['id'],
  },
];

const setUpdate = (fido, timeSub, sub) => {
  const promises = [];
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'arrayList',
        updated: timeSub(new Date(), sub + 10).getTime(),
      },
    })
  );
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'arrayList',
        updated: timeSub(new Date(), sub).getTime(),
      },
    })
  );

  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'anotherStore',
        updated: timeSub(new Date(), 10).getTime(),
      },
    })
  );

  return Promise.all(promises).catch(e => {
    console.error('error', e);
  });
};

const updateChecks = (getFido, data, timeSub, title) => {
  describe(`Update in ${title} `, () => {
    let fido;
    beforeAll(() => {
      fido = getFido();
    });

    afterEach(async () => {
      await fido.clear('updated');
    });

    test(`should update if older than 7 ${title}`, async () => {
      await setUpdate(fido, timeSub, 10);

      fetch.mockResponseOnce(JSON.stringify(data));
      await fido.update({ store: 'arrayList', url: 'http://www.test.co.uk' }, { unit: title, value: 7 });

      expect(fetch.mock.calls.length).toEqual(2);

      expect(fetch.mock.calls[0][0]).toEqual('http://www.test.co.uk');

      const d = await fido.getJS('arrayList', 1);
      const last = await fido.getJS('arrayList', 21);
      expect(d).toEqual(expect.objectContaining({ title: 'Title 1-update' }));

      expect(last).toEqual(expect.objectContaining({ title: 'new item' }));
    });

    test(`should not update if less than 7 ${title}`, async () => {
      await setUpdate(fido, timeSub, 5);

      fetch.mockResponseOnce(JSON.stringify(data));
      await fido.update({ store: 'arrayList', url: 'http://www.test.co.uk' }, { unit: title, value: 7 });

      expect(fetch.mock.calls.length).toEqual(1);
      const d = await fido.getJS('arrayList', 1);
      expect(d).toEqual(expect.objectContaining({ title: 'Title 1' }));
    });
  });
};

describe('check if updated no keys', () => {
  const newData = DATA_ARRAY.map(d => ({ ...d, title: `${d.title}-update` })).concat([
    { title: 'new item', date: new Date(), id: 21 },
  ]);
  let fido;

  beforeAll(async () => {
    fetch.mockResponseOnce(JSON.stringify(DATA_ARRAY));
    hasIndexDB.mockImplementationOnce(() => true);
    fido = await Fido({ schema: schemaArray, db: 'arrayDB', version: 1 });
    fido.setFetch({ url: 'http://www.test.co.uk', useKeys: false });
  });

  afterAll(async () => {
    await fido.clear('sessions');
    await fido.clear('updated');
    fido.close();
  });

  beforeEach(async () => {
    fetch.resetMocks();
    fetch.mockResponseOnce(JSON.stringify(DATA_ARRAY));
    await fido.fetch('arrayList', 'http://www.test.co.uk');
    await fido.clear('updated');
  });

  afterEach(async () => {
    fetch.resetMocks();
  });

  const getFido = () => fido;

  [
    {
      timeSub: subDays,
      title: 'days',
    },
    {
      timeSub: subHours,
      title: 'hours',
    },
    {
      timeSub: subMinutes,
      title: 'minutes',
    },
    {
      timeSub: subMonths,
      title: 'months',
    },
    {
      timeSub: subSeconds,
      title: 'seconds',
    },
  ].forEach(({ timeSub, title }) => {
    updateChecks(getFido, newData, timeSub, title);
  });
});
