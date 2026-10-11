export function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const message =
    err.name === 'ValidationError'
      ? Object.values(err.errors)
          .map((item) => item.message)
          .join(', ')
      : err.message || 'Something went wrong';

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
