"use strict";

(function() {

  const API_URL = "/";

  // making these global makes it easier for the reader to update and manipulate the page
  let pages = [];
  let chapters = [];
  let visibleIndex = 0;

  window.addEventListener("load", init);

  /**
   * Initialization for the pages functions, and buttons, also prepares some stuff to be hidden
   * by default, called on the page laod.
   */
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

  /**
   * Processes the search that has been sent to the search field via requesting the API through
   * the proxy
   */
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

  /**
   * This function displays the search results on the page which are returned from the API and makes
   * them clickable, also stores some information about the results in case the user wants to switch
   * between manga in the same search
   * @param {Object} resultObject A JSON object that the API returns with the results of the search
   */
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

  /**
   * Function called when the search query to the API encounters an error.
   * If there is any error that gets returned from the proxy, the user doesn't care
   * about the specifics anyways so we just ignore the error that we get in repsonse
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

  /**
   * This function creates a search result card that is put into the search results section
   * @param {String} title The title of a search entry
   * @param {String} description The description of the search entry
   * @param {String} id A hash which will represent the ID of a manga search entry
   * @returns {HTMLElement} A card element which is to be put onto the page
   */
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

  /**
   * Function called when a search result is selected (clicked on), which loads the manga's
   * information and its chapters via another query to the API. Also hides the search area so it
   * takes up less space on the page.
   */
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

  /**
   * This function takes the information about the manga and populates the information section and
   * displays the chapters of the manga to be selected
   * @param {Object} responseObject JSON object from the API representing the selected manga's info
   * @param {String} titleId A hash ID for the manga that has been selected
   */
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

  /**
   * This function creates a link to a chapter given information about the chapter
   * @param {Object} chapterObject An object representing a manga chapter, which has info about it
   * @returns {HTMLElement} A element as a chapter entry to be put onto the page
   */
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

  /**
   * This function handles any errors that may happen when queries are made to get the manga info
   * from the API, after it has been selected by the user from the search results section
   */
  function handleInfoViewError() {
    const element = gen("li");
    element.textContent = "Failed to load any chapters";
    element.classList.add("alert-text");
    id("chapter-list").appendChild(element);
  }

  /**
   * This function is called when the user clicks on a chapter link, getting and adding images to
   * the reader that the user can then see on the page. Also hides the manga info so the page is
   * less cluttered and the user can focus on reading
   * @param {String} chapterId A hash ID represnting a chapter in the API database
   * @param {String} hash A one-time specific hash from the API for getting the right resource
   * @param {Array} pagesList An array of Strings as IDs that represent individual pages in the
   *  chapter, used in constructing the URL that the page image is accessed from
   */
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
        addImages(json["baseUrl"], hash, pagesList);
        updateReader();
      })
      .catch(handleImagesError);
  }

  /**
   * Helper function to actually handle adding all the images to the page
   * @param {String} baseURL A base URL representing an "MD@HOME" node that will serve us the images
   * @param {String} hash A one-time speicifc hash from the API for getting the right resource
   * @param {Array} pagesList An array of Strings as IDs that represent individual pages in the
   *  chapter, used in constructing the URL that the page image is accessed from
   */
  function addImages(baseURL, hash, pagesList) {
    for (let i = 0; i < pagesList.length; i++) {
      let img = gen("img");
      img.src = baseURL + "/data-saver/" + hash + "/" + pagesList[i];
      img.alt = i;
      img.classList.add("hidden");
      pages.push(img);
      id("img-container").appendChild(img);
    }
  }

  /**
   * This function handles any errors that occur during the API request to get the images server
   */
  function handleImagesError() {
    const errorText = gen("p");
    errorText.textContent = "Something went wrong with image loading, please retry";
    errorText.classList.add("alert-text");
    id("img-container").appendChild(errorText);
  }

  /**
   * Initializes keyboard input for the reader to cycle through images. Defaults to moving left as
   * forward in traditional manga fashion
   * @param {Event} event An event in the DOM, called for "keydown"
   */
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

  /**
   * Changes the visibility of images in the reader to give the appearance of cycling/moving
   * through pages. Prevents cycling past the end or beginning of existing pages
   */
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

  /**
   * Helper function to show the search results in the search results section
   */
  function showResults() {
    id("search-hidden-blurb").classList.add("hidden");
    id("search-results").classList.remove("hidden");
  }

  /**
   * Helper function to hide the search results in the search results section
   */
  function hideResults() {
    id("search-hidden-blurb").classList.remove("hidden");
    id("search-results").classList.add("hidden");
  }

  /**
   * Helper function to show the manga info in the info section
   */
  function showInfo() {
    id("chapter-info").classList.remove("hidden");
    id("chapter-list").classList.remove("hidden");
    qs("#info-hidden-blurb").classList.add("hidden");
  }

  /**
   * Helper function to hide the manga info in the info section
   */
  function hideInfo() {
    id("chapter-info").classList.add("hidden");
    id("chapter-list").classList.add("hidden");
    qs("#info-hidden-blurb").classList.remove("hidden");
  }

  /**
   * Shorthand function to get an element by its ID
   * @param {String} name The name of an ID as a string without '#'
   * @returns {HTMLElement} The element with the specified ID
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Shorthand functino to get an element via query selector
   * @param {String} name A CSS selector string
   * @returns {HTMLElement} The first element selected with the selector string
   */
  function qs(name) {
    return document.querySelector(name);
  }

  /**
   * Shorthand function for creating new HTML elements
   * @param {String} name name of an HTML element
   * @returns {HTMLElement} a reference to a new HTML element
   */
  function gen(name) {
    return document.createElement(name);
  }

  /**
   * Helper function to check the status of an API response and throw an error
   * if the API request failed to OK
   * @param {Object} response response from an API
   * @returns {Object} the same response as was passed in
   */
  function statusCheck(response) {
    if (!response.ok) {
      throw new Error("Something went wrong with the response");
    }
    return response;
  }

})();