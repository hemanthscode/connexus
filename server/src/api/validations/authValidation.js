import Joi from 'joi';

export const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(50).trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateChangePassword = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export default {
  validateRegister,
  validateLogin,
  validateChangePassword,
};
