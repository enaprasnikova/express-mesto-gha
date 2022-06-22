const express = require('express');

const mongoose = require('mongoose');

const bodyParser = require('body-parser');

const userRoutes = require('./routes/users');

const cardRoutes = require('./routes/cards');

const { PORT = 3000 } = process.env;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/mestodb ', {
  useNewUrlParser: true,
});

app.use((req, res, next) => {
  req.user = {
    _id: '62b30809d550cea7bd587e4f',
  };

  next();
});

app.use('/users', userRoutes);

app.use('/cards', cardRoutes);

app.listen(PORT);
