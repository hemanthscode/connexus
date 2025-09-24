import Joi from 'joi';

export const validateUpdateProfile = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(50).trim().optional(),
    email: Joi.string().email().trim().optional(),
    status: Joi.string().valid('online', 'away', 'offline').optional(),
    avatar: Joi.string().optional().allow(null),
    bio: Joi.string().max(250).trim().optional(),
    location: Joi.string().max(100).trim().optional(),
    socialLinks: Joi.object().pattern(Joi.string(), Joi.string().uri()).optional(),
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
