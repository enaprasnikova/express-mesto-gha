const Users = require('../models/user');

const UserNotFoundError = require('../errors/userNotFoundError');

const STATUS_VALIDATION_ERROR = 400;

const STATUS_INTERNAL_ERROR = 500;

const STATUS_SUCCESS = 200;

const STATUS_SUCCESS_CREATED = 201;

const processError = (res, err) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(STATUS_VALIDATION_ERROR).send({ message: 'Ошибка валидации' });
  }

  if (err.name === 'UserNotFoundError') {
    return res.status(err.statusCode).send({ message: err.message });
  }

  return res.status(STATUS_INTERNAL_ERROR).send({ message: 'Внутренняя ошибка сервера' });
};

const createResponse = (user) => {
  const formattedUser = {
    _id: user._id,
    about: user.about,
    avatar: user.avatar,
    name: user.name,
  };
  return formattedUser;
};

module.exports.createUser = (req, res) => {
  const { name, about, avatar } = req.body;

  Users.create({ name, about, avatar })
    .then((user) => res.status(STATUS_SUCCESS_CREATED).send(createResponse(user)))
    .catch((err) => {
      processError(res, err);
    });
};

module.exports.getUsers = (req, res) => {
  Users.find({})
    .then((users) => {
      users.forEach((user, index) => {
        users[index] = createResponse(user);
      });
      res.status(STATUS_SUCCESS).send(users);
    })
    .catch((err) => processError(res, err));
};

module.exports.getUser = (req, res) => {
  Users.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        throw new UserNotFoundError('Пользователь не найден');
      }
      res.send(createResponse(user));
    })
    .catch((err) => {
      processError(res, err);
    });
};

module.exports.updateUser = (req, res) => {
  const { name, about } = req.body;
  const owner = req.user._id;

  Users.findByIdAndUpdate(
    owner,
    { name, about },
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
      upsert: true, // если пользователь не найден, он будет создан
    },
  )
    .then((user) => res.send(createResponse(user)))
    .catch((err) => processError(res, err));
};

module.exports.updateUserAvatar = (req, res) => {
  const { avatar } = req.body;
  const owner = req.user._id;

  Users.findByIdAndUpdate(
    owner,
    { avatar },
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
      upsert: true, // если пользователь не найден, он будет создан
    },
  )
    .then((user) => res.send(createResponse(user)))
    .catch((err) => processError(res, err));
};
