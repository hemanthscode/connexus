export const errorHandler = (err, req, res, next) => {
  console.error(
    JSON.stringify({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  )

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  })
}

export default errorHandler
