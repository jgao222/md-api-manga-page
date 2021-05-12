/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
"use strict";

const fetch = require("node-fetch");
const express = require("express");
const app = express();
const API_URL = "https://api.mangadex.org/";

app.get("/search", (req, res) => {
  console.log("A search request was made");
  if (req.query["title"]) {
    let name = req.query["title"];
    fetch(API_URL + "manga?title=" + name)
      .then(response => response.json())
      .then(json => res.json(json))
      .catch(console.error);
  } else {
    res.status(400).json({"bad request to proxy": 400});
  }
});

app.get("/info", (req, res) => {
  console.log("A request for manga info was made");
  let id = req.query["id"];
  if (id) {
    fetch(API_URL + "manga/" + id + "/feed?order[chapter]=desc")
      .then(response => response.json())
      .then(json => res.json(json))
      .catch(console.error);
  } else {
    res.status(400).json({"bad request to proxy": 400});
  }
});

app.get("/home", (req, res) => {
  console.log("A request to find a MD@Home node was made");
  let id = req.query["id"];
  if (id) {
    fetch(API_URL + "at-home/server/" + id)
      .then(response => response.json())
      .then(text => res.json(text))
      .catch(console.error);
  } else {
    res.status(400).json({"bad request to proxy": 400});
  }
});

const PORT = 8000;
app.listen(PORT);
app.use(express.static("public"));