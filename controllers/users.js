const Users = require("../models/user");

const UserNotFoundError = require('../errors/userNotFoundError');

const processError = (res, err) => {

  if (err.name === 'ValidationError') {
    return res.status(400).send({message: 'Ошибка валидации'})
  }

  if (err.name === 'UserNotFoundError') {
    return res.status(err.statusCode).send({message: err.message})
  }

  return  res.status(500).send({message: 'Внутренняя ошибка сервера'})
}

const createResponse = (user) => {
  user = {
    "_id": user._id,
    "about": user.about,
    "avatar": user.avatar,
    "name": user.name
  };

  return user;
}

module.exports.createUser = (req, res) => {
  const {name, about, avatar} = req.body;

  Users.create({name, about, avatar})
    .then((user) => res.status(201).send(createResponse(user)))
    .catch((err) => {
      processError(res, err)
    })
};

module.exports.getUsers = (req, res) => {
  Users.find({})
    .then((users) => {
      users.forEach((user, index) => {
        users[index] = createResponse(user)
      })
    res.status(200).send(users)
  })
    .catch((err) => processError(res, err))
};

module.exports.getUser = (req, res) => {
  Users.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        throw new UserNotFoundError("Пользователь не найден")
      }
      res.send(createResponse(user))
    })
    .catch((err) => {
      processError(res, err)
    })
}

module.exports.updateUser = (req, res) => {
  const {name, about} = req.body;
  const owner = req.user._id;

  Users.findByIdAndUpdate(
    owner,
    {name, about},
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
      upsert: true // если пользователь не найден, он будет создан
    }
    )
    .then(user => res.send(createResponse(user)))
    .catch(err => processError(res, err))
};

module.exports.updateUserAvatar = (req, res) => {
  const {avatar} = req.body;
  const owner = req.user._id;

  Users.findByIdAndUpdate(
    owner,
    {avatar},
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
      upsert: true // если пользователь не найден, он будет создан
    }
  )
    .then(user => res.send(createResponse(user)))
    .catch(err => processError(res, err))
};