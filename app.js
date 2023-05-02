const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const port = process.env.PORT || 3000;
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(process.env.MONGODB_URI);

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your toDoList",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// async function action() {
//   //await Item.insertMany(defaultItems)
//   const items = await Item.find({})
//   return items

//   //await mongoose.connection.close()
// }

//action()
app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/", async function (req, res) {
  const items = await Item.find({});

  if (items.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  }

  res.render("list", { listTitle: "Today", newListItems: items });
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const cond = await List.findOne({ name: customListName });
  
  if (customListName === 'About') {
    res.redirect('/about')
  } else if (!cond) {
    // create a new list
    const list = new List({
      name: customListName,
      items: defaultItems,
    });

    await list.save();

    res.redirect("/" + customListName);
  } else {
    // show an existing list
    res.render("list", { listTitle: cond.name, newListItems: cond.items });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    await item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    await foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      { new: true }
    );
    res.redirect("/" + listName);
  }
});


app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
