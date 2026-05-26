const validateZod = (schema, property = 'body') => (req, res, next) => {
  try {
    req[property] = schema.parse(req[property]);
    next(); 
  } catch (error) {
    return res.status(400).json({ error: error.errors });
  }
};

module.exports = validateZod;