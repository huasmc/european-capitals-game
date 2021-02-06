const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const countries = require("./countries.json");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_DB_URI || "mongodb://localhost:27017/";
const PORT = 5000;
const app = express();
app.use(cors("*"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("./build"));

MongoClient.connect(MONGO_URL, (err, client) => {
  if (err) {
    console.log(err);
    return;
  }
  const db = client.db("european-capitals-db");
  db.collection("countries")
    .find()
    .toArray((err, result) => {
      if (err) {
        console.log(err);
        return;
      }

      if (result.length < 1) {
        db.createCollection("countries");
        db.createCollection("scores");
        db.collection("countries").insert(countries, (err, res) => {
          if (err) {
            console.log(err);
            return;
          }
        });
      }
    });

  app.get("/api/countries", function (req, res) {
    db.collection("countries")
      .find()
      .toArray(function (err, result) {
        if (err) {
          console.log(err);
          res.status(500);
          res.send();
          return;
        }
        res.json(result);
      });
  });

  app.get("/api/countries/random", function (req, res) {
    db.collection("countries")
      .find({})
      .toArray(function (err, result) {
        if (err) {
          console.log(err);
          res.status(500);
          res.send();
          return;
        }

        const randomCountry = result[Math.floor(Math.random() * result.length)];

        res.json(randomCountry);
      });
  });

  app.post("/api/scores", function (req, res) {
    db.collection("scores").insert(req.body, function (err, result) {
      if (err) {
        console.log(err);
        res.status(500);
        res.send();
        return;
      }

      res.status(201);
      res.json(result.ops[0]);
    });
  });

  app.get("/api/scores", function (req, res) {
    db.collection("scores")
      .find({})
      .sort({ score: -1 })
      .toArray(function (err, result) {
        if (err) {
          console.log(err);
          res.status(500);
          res.send();
          return;
        }

        res.status(200).json(result);
      });
  });

  app.delete("/api/scores", function (req, res) {
    db.collection("scores").remove({}, function (err, result) {
      if (err) {
        console.log(err);
        res.status(500);
        res.send();
        return;
      }

      res.status(204);
      res.send();
    });
  });

  console.log("Connected to DB");
  console.log("Starting server...");

  app.listen(PORT, function () {
    console.log(`Server started on ${PORT}`);
  });
});
