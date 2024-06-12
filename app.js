require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let isAdmin = false;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_ATLAS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
mongoose.set("useCreateIndex", true)

// Schema
const blogsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  monetization: {
    type: Array,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  youtube:{
    type: String
  },
  publishedDate: {
    type: String,
    required: true
  }
});

const adminSchema = {
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
};

// Model
const Blogs = mongoose.model('Blog', blogsSchema);
const Admin = new mongoose.model('Admin', adminSchema);

// For saving admin only for once.
// bcrypt.hash(process.env.ADMIN_1_SECRET_KEY, saltRounds, function(err, hash) {
//     console.log(hash);
//     console.log(process.env.ADMIN_1_NAME);
//     console.log(process.env.ADMIN_1_EMAIL);
//
//     const admin = new Admin({
//       name: process.env.ADMIN_1_NAME,
//       email: process.env.ADMIN_1_EMAIL,
//       password: hash
//     });
//     admin.save();
// });

let options = { year: 'numeric', month: 'long', day: 'numeric' };
let today  = new Date();

let todaysDate = today.toLocaleDateString("en-US", options);

app.get("/", function(req, res) {
  Blogs.find({}, null, {
    sort: {
      category: 1
    }
  }, function(err, foundData) {
    if (!err) {
      res.render("home", {
        posts: foundData
      });
    }
  });
});

app.get("/posts/:post", function(req, res) {
  Blogs.find({}, function(err, foundData) {
    if (!err) {
      foundData.forEach(function(post) {

        if (_.lowerCase(post._id) === _.lowerCase(req.params.post)) {
          console.log(post._id, post.description);
          res.render("post", {
            postId: post._id,
            postTitle: post.title,
            postBody: post.body,
            postImage: post.image,
            products: post.monetization,
            projectVid: post.youtube,
            description: post.description
          });
        }
      })
    }
  })
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
  const name_login = req.body.name;
  const email_login = req.body.email;
  const password_login = req.body.password;

  Admin.find({}, function(err, adminFound) {
    const name_db = adminFound[0].name;
    const email_db = adminFound[0].email;
    const password_db = adminFound[0].password;

    if (name_login === name_db && email_login === email_db) {
      bcrypt.compare(password_login, password_db, function(err, result) {
        if (result === true) {
          // console.log("result");
          isAdmin = true;
          res.redirect("/compose");
        } else {
          res.redirect("/login");
        }
      });
    } else {
      // Logic to display alert on LOGIN.
      res.redirect("/login");
    }
  });
});

app.get("/compose", function(req, res) {
  if (isAdmin) {
    isAdmin = false
    res.render("compose");
  } else {
    res.render("login");
  }
})

app.post("/compose", function(req, res) {
  const post = new Blogs({
    title: req.body.postTitle,
    description: req.body.description,
    body: req.body.postBody,
    image: req.body.postImage,
    category: req.body.selector,
    youtube: req.body.project,
    publishedDate: todaysDate,
    monetization: req.body.products
  });
  isAdmin = false;
  post.save();
  res.redirect("/");
});

let port = process.env.PORT;
console.log(port);
if (port == null || port == "") {
  port = 3000;
}
console.log(port);

app.listen(port, function() {
  console.log("Server started on port 3000");
});
