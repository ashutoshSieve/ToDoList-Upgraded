require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { lowerCase } = require("lodash");
const _ = require("lodash");
const date= require(__dirname+"/date.js");
const today=date.getDate();

mongoose.connect(process.env.URL, {
    serverSelectionTimeoutMS: 5000 
});
  

const itemSchema= new mongoose.Schema({
    name:String
});

const Item = mongoose.model("Item",itemSchema);

const ListSchema=new mongoose.Schema({
    name:String,
    items:[itemSchema]
});

const Lists=mongoose.model("List",ListSchema);

const Item1=new Item({
    name:"Eat"
});
const Item2=new Item({
    name:"dance"
});
const Item3=new Item({
    name:"sleep"
});

const defaultItems=[Item1,Item2,Item3];

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function(req,res){
    const day=date.getDate();

    Item.find({}).then((results) => {
        if(results.length===0){
            Item.insertMany(defaultItems);
            res.redirect("/");
        }else{
            res.render("list",{Title:today, datas:results});   // variable : value
        } 
    }).catch((err) => {
        console.error('Error occurred:', err);
    });
});

app.post("/", function(req,res){
    const ItemName = req.body.newItems;
    const list = req.body.itemVal;

    const item=new Item({
        name:ItemName
    });
    
    if(list===today){
        item.save();
        res.redirect("/");
    }else{
        Lists.findOne({name:list}).then((results) =>{
            results.items.push(item);                 // we add new item in the array of particlar title

            results.save();
            res.redirect("/" + list);
        });
    }
});


app.post("/delete", async function(req, res) {
    const itemToDelete = req.body.checkbox;
    const page = req.body.page;

    if (page === today) {
        try {
            await Item.findByIdAndDelete(itemToDelete);  // Removed the object format as findByIdAndDelete directly takes the ID
            res.redirect("/");
        } catch (error) {
            console.error(error);
        }
    } else {
        try {
            await Lists.findOneAndUpdate(
                { name: page },
                { $pull: { items: { _id: itemToDelete } } }
            );
            res.redirect("/" + page);
        } catch (error) {
            console.error(error);
        }
    }
});


app.get("/:topic", function(req,res){
    
    // find function return array and findOne return an object
    const search=_.capitalize(req.params.topic);

    Lists.findOne({name:search}).then((results) =>{
        if(results == null){
            const newList=new Lists({
                name:search,
                items:defaultItems
            });
            newList.save();
            res.redirect("/"+search);
        }else{
            res.render("list",{Title:results.name, datas:results.items});
        }
    });
});

app.listen(3000, function(){
    console.log("server is runnig on port 3000!!");
});