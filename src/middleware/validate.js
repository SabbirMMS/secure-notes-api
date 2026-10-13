export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};

    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (!result.success) {
        return res.status(400).json({ error: { message: 'Invalid request', details: result.error.flatten() } });
      }
      validated[key] = result.data;
    }

    req.validated = validated;
    next();
  };
}
