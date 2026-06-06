const success = (res, data, message = 'Success', statusCode = 200, pagination = null) => {
  const response = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const error = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const response = { success: false, error: { code, message } };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
};

module.exports = { success, error };
