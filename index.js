"use strict";

(function() {

  const API_URL = "https://api.mangadex.org/";

  window.addEventListener("load", init);

  function init() {
    // we do a little initializing
    id("search-form").addEventListener("submit", function(event) {
      console.log("submit event happened");
      event.preventDefault();
      processSearch();
    });
  }

  function processSearch() {
    // prep the search text
    let searchText = id("query").value;
    id("query").value = "";
    searchText = searchText.replace(/\s+/g, "-");
    // const queryURL = API_URL + "manga?title=" + searchText;
    const queryURL = "https://api.mangadex.org/manga?title=one-punch";
    console.log("Requested to", queryURL);
    fetch(queryURL, {method: "GET", headers: {'Content-Type': 'application/json'}})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(displaySearchResults)
      .catch(console.error); // TODO handle error
    console.log("Search text was:", searchText);
  }

  function displaySearchResults(results) {
    console.log(results);
    for (let i = 0; i < results["results"].length; i++) {
      let titleInfo = results[i];
      if (titleInfo.ok) {
        const title = createCard(
          titleInfo["data"]["attributes"]["title"]["en"],
          titleInfo["data"]["attributes"]["description"]["en"]
        );
        id("search-results").appendChild(title);
      }
    }
  }

  function createCard(title, description) {
    const card = document.createElement("div");
    card.classList.add("search-result-card");
    const titleText = document.createElement("p");
    titleText.textContent = title;
    const descText = document.createElement("p");
    descText.textContent = description;

    card.appendChild(titleText);
    card.appendChild(descText);

    return card;
  }

  function id(name) {
    return document.getElementById(name);
  }

  function statusCheck(response) {
    console.log(response);
    if (!response.ok) {
      throw new Error("Something went wrong with the response");
    }
    return response;
  }

})();