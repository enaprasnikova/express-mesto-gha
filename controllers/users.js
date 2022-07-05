const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const Users = require('../models/user');

const SALT_ROUNDS = 10;

const SECRET_KEY = 'very-secret';

const {
  STATUS_SUCCESS,
  STATUS_SUCCESS_CREATED,
} = require('../utils/statusCodes');

const createResponse = (user) => {
  const formattedUser = {
    _id: user._id,
    about: user.about,
    avatar: user.avatar,
    name: user.name,
    email: user.email,
  };
  return formattedUser;
};

const throwError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throwError(400, 'Не передан емейл или пароль');
  }

  Users.findOne({ email }).select('+password')
    .then((foundUser) => {
      if (!foundUser) {
        throwError(403, 'Неправильный емейл или пароль');
      }

      return Promise.all([
        foundUser,
        bcrypt.compare(password, foundUser.password),
      ]);
    })
    .then(([user, isPasswordCorrect]) => {
      if (!isPasswordCorrect) {
        throwError(403, 'Неправильный емейл или пароль');
      }

      return jwt.sign(
        { _id: user._id },
        SECRET_KEY,
        { expiresIn: '7d' },
      );
    })
    .then((token) => {
      res.send({ token });
    })
    .catch((err) => {
      res
        .status(401)
        .send({ message: err.message });
    });
};

module.exports.getUserInfo = (req, res, next) => {
  Users.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throwError(404, 'Пользователь не найден');
      }
      res.send(createResponse(user));
    })
    .catch(next);
};

module.exports.getUser = (req, res, next) => {
  Users.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        throwError(404, 'Пользователь не найден');
      }
      res.send(createResponse(user));
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name,
    about,
    avatar,
    email,
    password,
  } = req.body;

  if (!email || !password) {
    throwError(400, 'Не передан емейл или пароль');
  }

  bcrypt.hash(password, SALT_ROUNDS)
    .then((hash) => Users.create({
      name,
      about,
      avatar,
      email,
      password: hash,
    }))
    .then((user) => res.status(STATUS_SUCCESS_CREATED).send(createResponse(user)))
    .catch(next);
};

module.exports.getUsers = (req, res) => {
  Users.find({})
    .then((users) => {
      users.forEach((user, index) => {
        users[index] = createResponse(user);
      });
      res.status(STATUS_SUCCESS).send(users);
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
    },
  )
    .then((user) => {
      if (!user) {
        throwError(404, 'Пользователь не найден');
      }
      res.send(createResponse(user));
    });
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
    },
  )
    .then((user) => {
      if (!user) {
        throwError(404, 'Пользователь не найден');
      }
      res.send(createResponse(user));
    });
};

module.exports.createResponseUser = createResponse;
