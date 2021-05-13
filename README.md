# md-api-manga-page

This project is an attempt at using the MangaDex API to do basic tasks that the
website used to do, given that the front-end MangaDex site is not up.

It runs a single-user local proxy server to bypass browser CORS
To run the project, make sure all files are included, run `npm init` and use
`node proxy.js`, which will host an instance on port `8000`. The site can
be accessed from `localhost:8000/`.

Search functions are currently lacking, this is an API issue. There is no way to
sort by relevance or other metrics, and the API returns many completely
unrelated entries.

The project requires express for the proxy server, node-fetch, and multer.
Use `npm install express`, `npm install node-fetch`, `npm install multer` before
attempting to run.