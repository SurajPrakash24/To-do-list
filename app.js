const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
const date = require(__dirname + "/date.js");
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));


// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB",{useNewUrlParser: true});
mongoose.connect(process.env.mongoUrl);

const itemSchema = {
    name:String
};
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
    name:"Welcome to your To-do list!"
});
const item2 = new Item({
    name:"Hit the plus button to add a new item."
});
const item3 = new Item({
    name:"<-- Hit this to delete a new item."
});
const defaultItems = [item1,item2,item3];

const listSchema = {
    name:String,
    items:[itemSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    let day = date.getDate();
    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("successfully saved default items to DB.");
                }
            });
            res.redirect("/");
        }
        else{
            res.render("list",{listTitle:"Today", newListItems:foundItems, day:day});
        }
    });
    
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    let day = date.getDate();
    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                //show an existing list
                res.render("list", {listTitle: foundList.name, newListItems:foundList.items, day:day})
            }
        }
    }); 
});

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listTitle = req.body.list;
    const item = new Item({
        name:itemName
    });
    if(listTitle==="Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listTitle}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listTitle);
        });
    }
});
app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name:listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
    
});

app.get("/about", function(req,res){
    res.render("about");
})

app.listen(3000, function(){
    console.log("Server started at port 3000");
});