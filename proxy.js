/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
"use strict";

const fetch = require("node-fetch");
const express = require("express");
const multer = require("multer");
const app = express();
const API_URL = "https://api.mangadex.org/";

let lastUser;
let lastPassword;
let sessionToken;
let refreshToken;

app.use(multer().none());

app.get("/search", (req, res) => {
  console.log("A search request was made");
  if (req.query["title"]) {
    let name = req.query["title"];
    let safeMode = false;
    if (req.query["safe"] === "safe") {
      safeMode = true;
    }
    const queryURL = API_URL + "manga?title=" + name + "&order[updatedAt]=desc" +
      (safeMode ? "&contentRating[]=safe" : "");
    fetch(queryURL)
      .then(statusCheck)
      .then(response => response.json())
      .then(json => res.json(json))
      .catch(console.error);
  } else {
    res.status(400).type("text/plain");
    res.send("bad request to proxy");
  }
});

app.get("/info", (req, res) => {
  console.log("A request for manga info was made");
  let id = req.query["id"];
  if (id) {
    fetch(API_URL + "manga/" + id + "/feed?order[chapter]=desc")
      .then(statusCheck)
      .then(response => response.json())
      .then(json => res.json(json))
      .catch(console.error);
  } else {
    res.status(400).type("text/plain");
    res.send("bad request to proxy");
  }
});

app.get("/home", (req, res) => {
  console.log("A request to find an MD@Home node was made");
  let id = req.query["id"];
  if (id) {
    fetch(API_URL + "at-home/server/" + id)
      .then(statusCheck)
      .then(response => response.json())
      .then(text => res.json(text))
      .catch(console.error);
  } else {
    res.status(400).type("text/plain");
    res.send("bad request to proxy");
  }
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username === lastUser && password === lastPassword) {
    let params = new FormData();
    params.append("username", username);
    params.append("password", password);
    if (!refreshToken) {
      fetch(API_URL + "auth/login", {method: "POST", body: params})
        .then(statusCheck)
        .then(response => response.json())
        .then(json => {
          sessionToken = json["token"]["session"];
          refreshToken = json["token"]["refresh"];
          res.json({"result": "ok"});
        })
        .catch(console.error);
    } else {
      fetch(API_URL + "auth/refresh", {method: "POST"})
        .then(statusCheck)
        .then(response => response.json())
        .then(json => {
          sessionToken = json["token"]["session"];
          refreshToken = json["token"]["refresh"];
          res.json({"result": "ok"});
        })
        .catch(console.error);
    }
  }
});

app.get("/logout", (req, res) => {
  if (sessionToken) {
    fetch(API_URL + "auth/logout", {method: "POST", authorization: "bearer " + sessionToken})
      .then(statusCheck)
      .then(response => response.json())
      .then(json => {
        if (json["result"] === "ok") {
          sessionToken = null;
          refreshToken = null;
          res.status(200).type("text/plain");
          res.send("Successfully logged out.");
        } else {
          throw new Error("API failure, unsuccessful");
        }
      })
      .catch(console.error);
  } else {
    res.status(200).type("text/plain");
    res.send("No logon found!");
  }
});

async function statusCheck(response) {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}

const PORT = 8000;
app.listen(PORT);
app.use(express.static("public"));