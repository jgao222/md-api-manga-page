"use strict";

(function() {

  const API_URL = "/";

  // making these global makes it easier for the reader to update and manipulate the page
  let pages = [];
  let chapters = [];
  let visibleIndex = 0;

  window.addEventListener("load", init);

  function init() {
    // we do a little initializing
    id("search-hidden-blurb").classList.add("hidden");
    qs("#search-hidden-blurb button").addEventListener("click", () => {
      showResults();
    });
    id("info-hidden-blurb").classList.add("hidden");
    qs("#info-hidden-blurb button").addEventListener("click", () => {
      showInfo();
    });
    id("search-form").addEventListener("submit", function(event) {
      event.preventDefault();
      processSearch();
    });

    document.addEventListener("keydown", readerInput);
  }

  function processSearch() {
    // make sure everything necessary is visible
    id("search-hidden-blurb").classList.add("hidden");
    id("search-results").classList.remove("hidden");

    // check safe search setting
    const safeSearch = id("safe-search").checked;

    // prep the search text
    let searchText = id("query").value;
    id("query").value = "";

    // handle special cases of search input
    searchText = searchText.replace(/\s+/g, "%20");
    searchText = searchText.replace(/&+/g, "%20and%20");
    const queryURL = API_URL + "search?title=" + searchText +
      (safeSearch ? "&safe=safe" : "");
    fetch(queryURL)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(displaySearchResults)
      .catch(handleSearchError);
  }

  function displaySearchResults(resultObject) {
    id("search-results").innerHTML = "";
    let results = resultObject["results"];
    for (let i = 0; i < results.length; i++) {
      let titleInfo = results[i];
      if (titleInfo.result === "ok") {
        const title = createCard(
          titleInfo["data"]["attributes"]["title"]["en"],
          titleInfo["data"]["attributes"]["description"]["en"],
          titleInfo["data"]["id"]
        );
        id("search-results").appendChild(title);
      }
    }
  }

  /*
   * if there is any error it gets returned from the proxy and the user doesn't care
   * about the specifics
   * anyways so we just ignore the error that we get in repsonse
   */
  function handleSearchError() {
    const card = document.createElement("div");
    card.id = id;
    card.classList.add("search-result-card");
    const titleText = document.createElement("p");
    titleText.innerText = "Search Failed";
    titleText.classList.add("alert-text");
    card.appendChild(titleText);
    id("search-results").appendChild(card);
  }

  function createCard(title, description, id) {
    const card = document.createElement("div");
    card.id = id;
    card.classList.add("search-result-card");
    const titleText = document.createElement("p");
    titleText.innerHTML = title; // we have to use this to properly show escaped HTML chars
    titleText.classList.add("result-title");
    const descText = document.createElement("p");
    descText.innerHTML = description;
    descText.classList.add("result-description");

    card.appendChild(titleText);
    card.appendChild(descText);

    card.addEventListener("click", mangaTitleSelected);

    return card;
  }

  function mangaTitleSelected() {
    id("chapter-list").innerHTML = "";
    id("chapter-info").innerHTML = "";
    hideResults();
    showInfo();
    let titleId = this.id;
    fetch(API_URL + "info?id=" + titleId)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(json => displayInfoView(json, titleId))
      .catch(handleInfoViewError);
  }

  function displayInfoView(responseObject, titleId) {
    id("chapter-list").innerHTML = "";

    // fill the information data
    let name = gen("h3");
    let desc = gen("p");

    // we are doing a weird thing to get the title and desc from the page itself
    const infos = id(titleId).children;

    // this only works IF we only have two elements in each search result
    name.textContent = infos[0].textContent;
    desc.textContent = infos[1].textContent;
    id("chapter-info").appendChild(name);
    id("chapter-info").appendChild(desc);

    const data = responseObject["results"];

    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i]["result"] === "ok") {
          id("chapter-list").appendChild(createChapLink(data[i]["data"]));
        } else {
          const element = gen("li");
          element.textContent = "Failed to load a chapter here";
          id("chapter-list").appendChild(element);
        }
      }
    } else {
      const element = gen("li");
      element.textContent = "Failed to load any chapters";
      id("chapter-list").appendChild(element);
    }
  }

  function createChapLink(chapterObject) {
    // keep a reference to all chapters so user can access them all easier
    chapters.push(chapterObject);

    const element = gen("li");
    const link = gen("a");
    link.href = "#reader";

    // we have to do this to support serializing html (otherwise we get html w/ escape sequences)
    link.innerHTML = chapterObject["attributes"]["translatedLanguage"].toUpperCase() +
      " - " + chapterObject["attributes"]["chapter"] + " - " +
      chapterObject["attributes"]["title"];
    link.addEventListener("click", () => {
      readChapter(
        chapterObject["id"],
        chapterObject["attributes"]["hash"],
        chapterObject["attributes"]["dataSaver"]
      );
    });

    element.appendChild(link);

    return element;
  }

  function handleInfoViewError() {
    const element = gen("li");
    element.textContent = "Failed to load any chapters";
    element.classList.add("alert-text");
    id("chapter-list").appendChild(element);
  }

  function readChapter(chapterId, hash, pagesList) {
    pages = [];
    hideInfo();
    visibleIndex = 0;
    updateReader();

    id("img-container").innerHTML = "";
    fetch(API_URL + "home?id=" + chapterId)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(json => {
        addImage(json["baseUrl"], hash, pagesList);
        updateReader();
      })
      .catch(handleImagesError);
  }

  function addImage(baseURL, hash, pagesList) {
    for (let i = 0; i < pagesList.length; i++) {
      let img = gen("img");
      img.src = baseURL + "/data-saver/" + hash + "/" + pagesList[i];
      img.alt = i;
      img.classList.add("hidden");
      pages.push(img);
      id("img-container").appendChild(img);
    }
  }

  function handleImagesError() {
    const errorText = gen("p");
    errorText.textContent = "Something went wrong with image loading, please retry";
    errorText.classList.add("alert-text");
    id("img-container").appendChild(errorText);
  }

  function readerInput(event) {
    const keyName = event.key;
    if (keyName === "ArrowLeft" && visibleIndex < pages.length - 1) {
      visibleIndex++;
      updateReader();
    } else if (keyName === "ArrowRight" && visibleIndex > 0) {
      visibleIndex--;
      updateReader();
    }
  }

  function updateReader() {
    if (pages.length !== 0) {
      if (pages[visibleIndex - 1] !== undefined) {
        pages[visibleIndex - 1].classList.add("hidden");
      }
      if (pages[visibleIndex + 1] !== undefined) {
        pages[visibleIndex + 1].classList.add("hidden");
      }
      pages[visibleIndex].classList.remove("hidden");
    }
  }

  function showResults() {
    id("search-hidden-blurb").classList.add("hidden");
    id("search-results").classList.remove("hidden");
  }

  function hideResults() {
    id("search-hidden-blurb").classList.remove("hidden");
    id("search-results").classList.add("hidden");
  }

  function showInfo() {
    id("chapter-info").classList.remove("hidden");
    id("chapter-list").classList.remove("hidden");
    qs("#info-hidden-blurb").classList.add("hidden");
  }

  function hideInfo() {
    id("chapter-info").classList.add("hidden");
    id("chapter-list").classList.add("hidden");
    qs("#info-hidden-blurb").classList.remove("hidden");
  }

  function id(name) {
    return document.getElementById(name);
  }

  function qs(name) {
    return document.querySelector(name);
  }

  function gen(name) {
    return document.createElement(name);
  }

  function statusCheck(response) {
    if (!response.ok) {
      throw new Error("Something went wrong with the response");
    }
    return response;
  }

})();