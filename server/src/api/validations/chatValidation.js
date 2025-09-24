import Joi from 'joi';

export const validateSendMessage = (data) => {
  const schema = Joi.object({
    conversationId: Joi.string().required(),
    content: Joi.string().max(2000).trim().required(),
    type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
    replyTo: Joi.string().optional().allow(null),
    attachments: Joi.array().items(Joi.object()).default([]),
  });

  return schema.validate(data);
};

export const validateEditMessage = (data) => {
  const schema = Joi.object({
    messageId: Joi.string().required(),
    newContent: Joi.string().max(2000).trim().required(),
  });

  return schema.validate(data);
};

export const validateCreateGroup = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(100).trim().required(),
    description: Joi.string().max(500).trim().optional().allow(''),
    participants: Joi.array().items(Joi.string()).default([]),
    avatar: Joi.string().optional().allow(null),
  });

  return schema.validate(data);
};

export const validateUpdateGroup = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(100).trim().optional(),
    description: Joi.string().max(500).trim().optional(),
    avatar: Joi.string().optional().allow(null),
  });

  return schema.validate(data);
};

export default {
  validateSendMessage,
  validateEditMessage,
  validateCreateGroup,
  validateUpdateGroup,
};
