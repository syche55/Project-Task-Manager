//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


// mongoose.connect("mongodb://localhost:27017/todolistDB", {userNewUrlParser: true,  useUnifiedTopology: true});
mongoose.connect("mongodb+srv://admin-siyu:CPngnZsZymB6Cz70@cluster0.cgdpq.mongodb.net/projectTaskManagerDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// item
const itemsSchema = { //schema
  name: String,
  status: String
};

const Item = mongoose.model("Item", itemsSchema); //model

// list
const listSchema = {
  name: String,
  items: [itemsSchema],
  projectBelong: String
};

const List = mongoose.model("List", listSchema);

const listPlan = new List({
  name: "Plan"
});

const listInProgress = new List({
  name: "In Progress"
});

const listFinish = new List({
  name: "Finish"
});

const defaultLists = [listPlan, listInProgress, listFinish];

// project
const projectSchema = {
  name: String,
  taskLists: [listSchema]
};

const Project = mongoose.model("Project", projectSchema);

let currentProject = new Project({});


function renderIfAllItemsRetrieved(res, listPlanItemsFound, listInProgressItemsFound, listFinishItemsFound, customProjectName) {
  if (listPlanItemsFound && listInProgressItemsFound && listFinishItemsFound) {
    res.render("list", {
      itemsPlan: listPlan.items,
      itemsInProgress: listInProgress.items,
      itemsFinish: listFinish.items,
      projectTitle: customProjectName
    });
  }
}

app.get("/", function(req, res) {

  res.render("firstPage");

});



app.post("/AddItem", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;


    const item = new Item({
      name: itemName,
      status: listName
    });

    item.save();

    if (listName === "Plan") {
      currentProject.taskLists[0].items.push(item);
      currentProject.save();
      res.redirect("/project/" + currentProject.name);
    } else if (listName === "In Progress") {
      currentProject.taskLists[1].items.push(item);
      currentProject.save();
      res.redirect("/project/" + currentProject.name);
    } else if (listName === "Finish") {
      currentProject.taskLists[2].items.push(item);
      currentProject.save();
      res.redirect("/project/" + currentProject.name);
    }
});

app.post("/moveToNextStage", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const checkedItemName = req.body.itemName;
  const listName = req.body.listName;
  const checkedItemIndex = req.body.itemIndex;

  let moveItem;
  if (listName === "Plan") {
    moveItem = new Item({
      name: checkedItemName,
      status: "In Progress"
    });
    // moveItem.save();
    currentProject.taskLists[1].items.push(moveItem);
    currentProject.taskLists[0].items.splice(checkedItemIndex, 1);

  } else if (listName === "In Progress") {
    moveItem = new Item({
      name: checkedItemName,
      status: "Finish"
    });
    currentProject.taskLists[2].items.push(moveItem);
    currentProject.taskLists[1].items.splice(checkedItemIndex, 1);

  } else {
    currentProject.taskLists[2].items.splice(checkedItemIndex, 1);
  }
  currentProject.save();

  res.redirect("/project/" + currentProject.name);
});


app.get("/project/:customProjectName", function(req, res) {
  const customProjectName = _.capitalize(req.params.customProjectName);
  Project.findOne({
    name: customProjectName
  }, function(err, foundProject) {
    if (!err) {
      if (!foundProject) {
        // create a new project
        const newProject = new Project({
          name: customProjectName,
          taskLists: defaultLists
        });
        newProject.save();
        currentProject = newProject;
      } else {
        currentProject = foundProject;
      }
      res.render("list", {
        itemsPlan: currentProject.taskLists[0].items,
        itemsInProgress: currentProject.taskLists[1].items,
        itemsFinish: currentProject.taskLists[2].items,
        projectTitle: customProjectName
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.post("/NewProject", function(req, res) {
  const projectNameEntered = req.body.key;
  res.redirect("/project/" + projectNameEntered);
});


app.listen(port, function() {
  console.log("Server Started Successfully");
});
