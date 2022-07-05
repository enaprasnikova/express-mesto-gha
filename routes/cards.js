const router = require('express').Router();

const { celebrate, Joi } = require('celebrate');

const { urlPattern } = require('../utils/utils');

const {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
} = require('../controllers/cards');

router.get('/', getCards);

router.post('/', celebrate({
  body: Joi.object().keys({
    link: Joi.string().required().pattern(urlPattern),
    name: Joi.string().required().min(2).max(30),
  }),
}), createCard);

router.delete('/:cardId', deleteCard);

router.put('/:cardId/likes', likeCard);

router.delete('/:cardId/likes', dislikeCard);

module.exports = router;
