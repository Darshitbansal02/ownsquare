/** Keep one payload/key while a network failure leaves the outcome uncertain. */
export function createInvestmentIntent(createKey = () => crypto.randomUUID()) {
  let intent = null;
  return {
    prepare(body) {
      if (intent && (intent.body.propertyId !== body.propertyId || intent.body.units !== body.units)) throw new Error('Resolve the previous purchase before changing its units.');
      if (!intent) intent = Object.freeze({ body: Object.freeze({ ...body }), key: createKey() });
      return intent;
    },
    current: () => intent,
    settle(error) { if (!error || (error.status >= 400 && error.status < 500)) intent = null; },
  };
}
