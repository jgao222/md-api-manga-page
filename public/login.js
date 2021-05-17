"use strict";

(function() {

  window.addEventListener("load", init);

  /**
   * Initializes the pages functionality, called on page load
   */
  function init() {
    // we do a little initializing
    document.getElementById("login-form").addEventListener("submit", event => {
      event.preventDefault();
      submitLogin();
    });
  }

  /**
   * Submits the login information to the API to log in. Called when the form is submitted
   */
  function submitLogin() {
    const params = new FormData(document.getElementById("login-form"));
    fetch("/login", {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(json => {
        /*
         * this is a pattern that appears a lot and might not be necessary, because the http code
         * should already indicate whether or not an error has ocurred. I haven't implemented
         * the response returning with http error codes yet though, so this will be a way to double
         * check
         */
        if (json["result"] === "ok") {
          // redirect user back to main page
          window.location.href = "index.html";
        } else {
          handleLoginError();
        }
      })
      .catch(handleLoginError); // we throw away the error text, just tell the user that it failed
  }

  /**
   * Handles errors when calling the API to log in, updates the page with a failed login message
   */
  function handleLoginError() {
    const msg = document.createElement("p");
    msg.textContent = "Log-in Failed";
    msg.classList.add("failed");
    document.getElementById("login-form").appendChild(msg);
    setTimeout(() => {
      msg.remove();
    }, 3000);
  }

  /**
   * Helper function to check the status of an API response and throw an error
   * if the API request failed to OK
   * @param {Object} response response from an API
   * @returns {Object} the same response as was passed in
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

})();