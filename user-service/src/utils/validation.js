import Joi from 'joi';

const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(4).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(4).max(20).required(),
    email: Joi.string().email().allow('').optional(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export { validateRegistration, validateLogin };
