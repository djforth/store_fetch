import { addDays, addHours, format } from 'date-fns';

const create_session = (i, date, title = 'Session', cancelled = false) => {
  const start = addHours(date, i);
  const finish = addHours(date, i + 1);

  return {
    id: start.getTime(),
    cancelled,
    start,
    finish,
    session: `${title} ${i}`,
    location: 'some location',
  };
};

export const jsonData = (start = 28) => {
  let i = 0;
  let date = new Date(2013, 0, start);
  const data = [];

  do {
    let n = 0;
    do {
      data.push(create_session(n, date));
      n++;
    } while (n < 10);
    i++;
    date = addDays(date, i);
  } while (i < 10);

  return JSON.stringify(data);
};

export const jsonUpdate = (date = new Date(2013, 0, 28)) => {
  let n = 0;

  const data = [];

  do {
    data.push(create_session(n, date, 'Session Update', n % 2 === 0));
    n++;
  } while (n < 10);

  return JSON.stringify(data);
};

export default () => {
  let i = 0;
  let date = new Date(2013, 0, 28);
  const data = [];

  do {
    const sessions = { id: `all-${format(date, 'yyyy-MM-dd')}`, items: [] };
    // console.log('id', sessions.id);
    let n = 0;
    do {
      sessions.items.push(create_session(n, date));
      n++;
    } while (n < 10);
    data.push(sessions);
    i++;
    date = addDays(date, i);
  } while (i < 10);

  return data;
};
