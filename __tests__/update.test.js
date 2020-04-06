import Fido from '../src';
import hasIndexDB from '../src/helpers/check_ie';
import getData, { jsonData, jsonUpdate } from './__helpers__/data.helper';

export const isFullObject = obj =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length > 0;

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

const schemaSessions = [
  {
    store: 'sessions',
    keyPath: { keyPath: 'id' },
    indexes: ['id'],
  },
];

const setUpdate = (fido, timeSub, sub) => {
  const promises = [];
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'sessions',
        updated: timeSub(new Date(), sub + 10).getTime(),
        key: format(new Date(2013, 0, 30), "'all-'yyyy-MM-dd"),
      },
    })
  );
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'sessions',
        updated: timeSub(new Date(), sub).getTime(),
        key: format(new Date(2013, 0, 30), "'all-'yyyy-MM-dd"),
      },
    })
  );
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'sessions',
        updated: timeSub(new Date(), sub).getTime(),
        key: format(new Date(2013, 0, 29), "'all-'yyyy-MM-dd"),
      },
    })
  );
  promises.push(
    fido.set({
      store: 'updated',
      value: {
        store: 'anotherStore',
        updated: timeSub(new Date(), 10).getTime(),
        key: format(new Date(2013, 0, 30), "'all-'yyyy-MM-dd"),
      },
    })
  );

  return Promise.all(promises).catch(e => {
    console.error('error', e);
  });
};

const updateChecksWithKeys = (getFido, data, timeSub, title) => {
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

      fetch.mockResponseOnce(jsonUpdate(new Date(2013, 0, 30)));
      await fido.update({ api: 'http://www.sessions.co.uk', store: 'sessions', keys: ['all-2013-01-30'] });

      // expect(fetch.mock.calls.length).toEqual(2);
      // expect(fetch.mock.calls[0][0]).toEqual('http://www.sessions.co.uk');

      const d = await fido.getJS('sessions', 'all-2013-01-30');
      // console.log('data', d.items[1]);
      expect(d).toEqual(expect.objectContaining({ id: 'all-2013-01-30' }));
      expect(d.items).toContainEqual(
        expect.objectContaining({
          id: expect.any(Number),
          cancelled: true,
          start: expect.any(Date),
          finish: expect.any(Date),
          session: expect.stringContaining('Session Update'),
          location: 'some location',
        })
      );
    });

    test(`should not update if less than 7 ${title}`, async () => {
      await setUpdate(fido, timeSub, 5);
      fetch.mockResponseOnce(jsonUpdate(new Date(2013, 0, 31)));
      await fido.update({ api: 'http://www.sessions.co.uk', store: 'sessions', keys: ['all-2013-01-29'] });
      // check no more calls
      expect(fetch.mock.calls.length).toEqual(2);

      const d = await fido.getJS('sessions', 'all-2013-01-29');
      // console.log('data', d.items[1]);
      expect(d).toEqual(expect.objectContaining({ id: 'all-2013-01-29' }));
      expect(d.items).toContainEqual(
        expect.objectContaining({
          id: expect.any(Number),
          cancelled: false,
          start: expect.any(Date),
          finish: expect.any(Date),
          session: expect.not.stringContaining('Session Update'),
          location: 'some location',
        })
      );
    });
  });
};

describe('Update with keys', () => {
  let fido, data;
  describe('check if updated with keys', () => {
    let items;

    beforeAll(async () => {
      hasIndexDB.mockImplementationOnce(() => true);

      fido = await Fido({ schema: schemaSessions, db: 'sessionsDB', version: 1 });
      fido.setFetch({
        processor: sessions => {
          if (!sessions || !sessions[0].start) return sessions;

          const processed = sessions.reduce((list, session) => {
            const key = format(session.start, "'all-'yyyy-MM-dd");

            const ses = list.find(({ id }) => id === key);
            if (ses) {
              const index = list.indexOf(ses);
              list[index].items = [...list[index].items, session];
              return list;
            }

            return [...list, { id: key, items: [session] }];
          }, []);

          return processed;
        },

        url: 'http://www.sessions.co.uk',
        useKeys: true,
      });
      fetch.mockResponseOnce(jsonData());
      await fido.fetch('sessions', 'http://www.sessions.co.uk');
      // items = await fido.get('sessions');
    });

    beforeEach(async () => {
      fetch.resetMocks();
      fetch.mockResponseOnce(jsonData());
      await fido.fetch('sessions', 'http://www.sessions.co.uk');
      await fido.clear('updated');
    });

    afterAll(async () => {
      await fido.clear('sessions');
      await fido.clear('updated');
      fido.close();
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
      updateChecksWithKeys(getFido, getData(), timeSub, title);
    });
  });
});
