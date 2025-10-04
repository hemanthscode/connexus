import Joi from 'joi';

export const validateUpdateProfile = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(50).trim().optional(),
    email: Joi.string().email().trim().optional(),
    phone: Joi.string()
      .pattern(/^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/)
      .allow('')
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be in valid format (e.g., +1-555-123-4567, (555) 123-4567, 555-123-4567)'
      }),
    status: Joi.string().valid('online', 'away', 'offline').optional(),
    avatar: Joi.string().optional().allow(null),
    bio: Joi.string().max(250).trim().optional(),
    location: Joi.string().max(100).trim().optional(),
    socialLinks: Joi.object().pattern(
      Joi.string(), 
      Joi.string().uri().allow('')
    ).optional(),
  });

  return schema.validate(data);
};

export const validateSearchUsers = (data) => {
  const schema = Joi.object({
    q: Joi.string().min(2).required(),
    limit: Joi.number().min(1).max(50).default(10),
  });

  return schema.validate(data);
};

export default {
  validateUpdateProfile,
  validateSearchUsers,
};
