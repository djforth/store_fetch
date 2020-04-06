import Processor from './processor';

export default async url => {
  const request = await fetch(url).catch(err => {
    /* istanbul ignore next */
    console.error(err);
  });
  const response = await request.json();
  return Processor(response);
};
