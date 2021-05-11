# md-api-manga-page

This project is an attempt at using the MangaDex API to do basic tasks that the
website used to do, given that the front-end MangaDex site is not up.

It uses a local proxy server to get around CORS, to run the project make sure
all files are included and use `node proxy.js`, which will host an instance on
`localhost:8000`. The site can be used from `localhost:8000/index.html`.

Search functions are currently lacking, as I have no idea how they work.

The project requires express for the proxy server and node-fetch.