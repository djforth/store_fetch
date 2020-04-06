export default async (opener, storeName, val) => {
  const { store, tx } = await opener(storeName);
  if (Array.isArray(val)) {
    val.map(v => store.add(v));
    /* eslint-disable no-return-await */
    return await tx.done;
    /* eslint-enable no-return-await */
  }

  store.add(val);
  /* eslint-disable no-return-await */
  return await tx.done;
  /* eslint-enable no-return-await */
};
