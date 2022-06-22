const Cards = require('../models/card');

const { createResponseUser } = require('./users');

const {
  STATUS_VALIDATION_ERROR,
  STATUS_INTERNAL_ERROR,
  STATUS_SUCCESS,
  STATUS_SUCCESS_CREATED,
} = require('../utils/statusCodes');

const CardNotFoundError = require('../errors/cardNotFoundError');

const createResponse = (card) => {
  card.likes.forEach((like, index) => {
    card.likes[index] = createResponseUser(like);
  });

  const formattedCard = {
    createdAt: card.createdAt,
    likes: card.likes,
    link: card.link,
    name: card.name,
    owner: createResponseUser(card.owner),
    _id: card._id,
  };

  return formattedCard;
};

const processError = (res, err) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(STATUS_VALIDATION_ERROR).send({ message: 'Ошибка валидации' });
  }

  if (err.name === 'CardNotFoundError') {
    return res.status(err.statusCode).send({ message: err.message });
  }

  return res.status(STATUS_INTERNAL_ERROR).send({ message: 'Внутренняя ошибка сервера' });
};

module.exports.getCards = (req, res) => {
  Cards.find({})
    .populate(['owner', 'likes'])
    .then((cards) => {
      cards.forEach((card, index) => {
        cards[index] = createResponse(card);
      });
      res.status(STATUS_SUCCESS).send(cards);
    })
    .catch((err) => processError(res, err));
};

module.exports.createCard = (req, res) => {
  const { name, link } = req.body;
  const owner = req.user._id;

  Cards.create({ name, link, owner })
    .then((card) => {
      card.populate('owner')
        .then((populatedCard) => {
          res.status(STATUS_SUCCESS_CREATED).send(createResponse(populatedCard));
        });
    })
    .catch((err) => processError(res, err));
};

module.exports.deleteCard = (req, res) => {
  Cards.findByIdAndRemove(req.params.cardId)
    .populate(['owner', 'likes'])
    .then((card) => {
      if (!card) {
        throw new CardNotFoundError('Карточка не найдена');
      }
      res.status(STATUS_SUCCESS).send(createResponse(card));
    })
    .catch((err) => processError(res, err));
};

module.exports.likeCard = (req, res) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .populate(['owner', 'likes'])
    .then((card) => {
      if (!card) {
        throw new CardNotFoundError('Карточка не найдена');
      }

      res.status(STATUS_SUCCESS).send(createResponse(card));
    })
    .catch((err) => processError(res, err));
};

module.exports.dislikeCard = (req, res) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .populate(['owner', 'likes'])
    .then((card) => {
      if (!card) {
        throw new CardNotFoundError('Карточка не найдена');
      }

      res.status(STATUS_SUCCESS).send(createResponse(card));
    })
    .catch((err) => processError(res, err));
};
