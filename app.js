//jshint esversion:6
require('dotenv').config() //ocultar the key const secret="esteesnuetrosecretoid."

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");


//const encrypt =require("mongoose-encryption")

//const sha =require("js-sha512");
//const bcrypt = require('bcrypt');
//const saltRounds = 10;


const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findOrCreate");

const app=express();

//console.log(process.env.SECRET_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));

app.use(session({
  secret: "Un secreto",
  resave: false,
  saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});

//for encryp i need to create the schema in this form
const userSchema= new mongoose.Schema({
  googleId:String,
  email: String,
  password: String
});

//const secret="esteesnuetrosecretoid."; // like a key to encript
//userSchema.plugin(encrypt,{secret: process.env.SECRET_KEY, encryptedFields: ["password"]}); //use key and only encryp fields "password"
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(function(user, cb) {
//   process.nextTick(function() {
//     return cb(null, {
//       id: user.id,
//       username: user.username,
//       picture: user.picture
//     });
//   });
// });
//
// passport.deserializeUser(function(user, cb) {
//   process.nextTick(function() {
//     return cb(null, user);
//   });
// });

passport.serializeUser(function(user, done){
  done(null, user.id)
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, //access file .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, //access file .env
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username: profile.provider + profile.id }, function (err, user) {
             return cb(err, user);
         });
  }
));



app.get("/",function(req,res){
  res.render("home");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})

app.get("/secrets", function(req, res){
  //check if the autnetication was sussefully
  if (req.isAuthenticated()){
    res.render("secrets");
  }
  else{
      res.redirect("/login");
  }
});

app.get("/logout",function(req, res){
  req.logout(function(err) {
   if (err) { return next(err); }
   res.redirect('/');
 });
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.post("/register",function(req, res){
  User.register({username: req.body.username},req.body.password, function(err){
    if (err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//remerber the cookies will be deleted after close de navegator
app.post("/login",function(req, res){
  const user = new User ({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user, function(err){
    if (err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req, res,function() {
        res.redirect("/secrets");
      });
    }
  })

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
