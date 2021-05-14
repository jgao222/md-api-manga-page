"use strict";

(function() {

  window.addEventListener("load", init);

  function init() {
    // we do a little initializing
    document.getElementById("login-form").addEventListener("submit", event => {
      event.preventDefault();
      submitLogin();
    });
  }

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
        }
      })
      .catch(console.error);
  }

  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

})();