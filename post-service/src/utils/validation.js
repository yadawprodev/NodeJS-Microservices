import Joi from 'joi';

const validatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(5).max(500).required(),
    mediaIds: Joi.array().items(Joi.string()).optional(),
  });

  return schema.validate(data);
};

export default validatePost;
