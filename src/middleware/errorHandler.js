export function notFound(req, res, next) {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const status = error.status ?? error.statusCode ?? 500;
  const message = status >= 500 ? 'Internal server error' : error.message;

  if (status >= 500) console.error(error);
  res.status(status).json({ error: { message } });
}
