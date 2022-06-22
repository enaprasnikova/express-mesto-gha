const Cards = require('../models/card');

const CardNotFoundError = require('../errors/cardNotFoundError');

const createResponse = (card) => {
  card = {
    "createdAt": card.createdAt,
    "likes": card.likes,
    "link": card.link,
    "name": card.name,
    "owner": card.owner,
    "_id": card._id
  }

  return card;
}

const processError = (res, err) => {
  if (err.name === 'ValidationError') {
    return res.status(400).send({message: 'Ошибка валидации'})
  }

  if (err.name === 'CardNotFoundError') {
    return res.status(err.statusCode).send({message: err.message})
  }

  return res.status(500).send({message: 'Внутренняя ошибка сервера'})
}

module.exports.getCards = (req, res) => {
  Cards.find({})
    .then((cards) => {
      cards.forEach((card, index) => {
        cards[index] = createResponse(card)
      })
    res.status(200).send(cards)
  })
    .catch(err => processError(res, err))
};

module.exports.createCard = (req, res) => {

  const {name, link} = req.body;
  const owner = req.user._id;

  Cards.create({name, link, owner})
    .then((card) => res.status(201).send(createResponse(card)))
    .catch(err => processError(res, err))
};

module.exports.deleteCard = (req, res) => {
  Cards.findByIdAndRemove(req.params.cardId)
    .then((card) => {
      if (!card) {
        throw new CardNotFoundError('Карточка не найдена')
      }
      res.status(200).send(createResponse(card))
    })
    .catch(err => processError(res, err))
};

module.exports.likeCard = (req, res) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .then((card) => {

      if (!card) {
        throw new CardNotFoundError('Карточка не найдена')
      }

      res.status(200).send(createResponse(card))
    })
    .catch(err => processError(res, err))
};

module.exports.dislikeCard = (req, res) => {
  Cards.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .then((card) => {

      if(!card) {
        throw new CardNotFoundError('Карточка не найдена')
      }

      res.status(200).send(createResponse(card))
    })
    .catch(err => processError(res, err))
};