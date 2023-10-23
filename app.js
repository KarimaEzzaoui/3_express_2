const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('express-flash');

const app = express();
const port = 3000;

// Session --------------    
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(
  session({
    secret: '123456789',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware --------------
const authenticate = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

// Connection --------------
mongoose.connect('mongodb://127.0.0.1:27017/testDB2').then(() => {
  console.log('connected successfully');
}).catch((error) => {
  console.log(error);
});

// Models ------------------------------------
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
});
const Book = mongoose.model('Book', bookSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// Passport Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Passport Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routers ---------------------------------------------
const authRouter = express.Router();
const booksRouter = express.Router();

// End Points ------------------------------------------
authRouter.get('/register', (req, res) => {
  res.render('register', { messages: req.flash('error') });
});

authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    req.flash('error', 'Username already taken');
    return res.redirect('/auth/register');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.redirect('/auth/login');
});

authRouter.get('/login', (req, res) => {
    res.render('login');
  });

authRouter.post('/login',
  passport.authenticate('local', {
    successRedirect: '/books',
    failureRedirect: '/auth/login',
    failureFlash: true
  })
);

authRouter.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/auth/login');
    });
  
});

booksRouter.get('/', authenticate, async (req, res) => {
  // const books = await Book.find().limit(10);
  const books = [
    { title: 'The Imaginary Journey', author: 'John Imaginer' },
    { title: 'Dreams of Fiction', author: 'Alice Dreamer' },
    { title: 'Fantasy Realm', author: 'Bob Fantasy' },
    { title: 'Enchanted Tales', author: 'Eva Enchanter' },
    { title: 'Mythical Adventures', author: 'Mike Myth' },
    { title: 'Whimsical Wonders', author: 'Wendy Whimsy' },
    { title: 'Fables and Fairytales', author: 'Frank Fabulist' },
    { title: 'Magical Realms', author: 'Molly Magician' },
    { title: 'Epic Quests', author: 'Eric Epic' },
    { title: 'Wizards and Wonders', author: 'Walter Wizard' },
  ];
  
  res.render('books', { books });
});

app.use('/auth', authRouter);
app.use('/books', booksRouter);

// Pug configuration
app.set('view engine', 'pug');
app.set('views','./views');

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
