import Processor from '../../src/helpers/processor';

const isFullObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

const DATA = {
  array: [1, 2, new Date(), true],
  number: 3,
  string: 'string',
  date: new Date(),
  obj: { foo: 'foo', bar: { foo: new Date(), boolean: false, bar: { foo: new Date() } } },
  boolean: true,
};

const testData = processed => (data, keys = []) => {
  if (isFullObject(data)) {
    Object.entries(data).forEach(([k, v]) => {
      testData(processed)(v, [...keys, k]);
    });
    return;
  }

  if (keys === []) return;

  test(`Data data.${keys.join('.')} equals ${data}`, () => {
    const processedData = keys.reduce((d, k) => d[k], processed());
    expect(processedData).toEqual(data);
  });
};

describe('Processor', () => {
  let json, processed;
  beforeAll(() => {
    json = JSON.parse(JSON.stringify(DATA));

    processed = Processor(json);
  });

  testData(() => processed)(DATA);
});
