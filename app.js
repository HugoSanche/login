//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt =require("mongoose-encryption")

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});

//for encryp i need to create the schema in this form
const userSchema= new mongoose.Schema({
  email: String,
  password: String
});

const secret="esteesnuetrosecretoid."; // like a key to encript
userSchema.plugin(encrypt,{secret: secret, encryptedFields: ["password"]}); //use key and only encryp fields "password"



const User = new mongoose.model("User", userSchema);

app.get("/",function(req,res){
  res.render("home");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})

app.post("/register",function(req, res){
    newUser= new User({
      email: req.body.username,
      password: req.body.password
    })

    //when save field automatically the field password was encryted
    newUser.save(function(err){ //saving new register
      if(!err){
        res.render("secrets");
      }
        else{
          res.render("Something fail "+err);
        }
    });
});

app.post("/login",function(req, res){
  const email= req.body.username;
  const password= req.body.password;
  //when find a filed automatically the field "password" was decrept
  User.findOne({email},function(err,item){
    console.log(item);
    if (err){
      console.log("ups found a error  "+err);
    }
    else {
      if (item)
        {
        if (password==item.password)
          {
          res.render("secrets");
          }

        else{
          console.log("Error de usuario o contraseña");
        }
      }
    }
  });

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
