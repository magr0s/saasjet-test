const { rejects } = require("assert");
const fs = require("fs")

module.exports = function (app, addon) {

  //fires after addon installation
  app.all('/installed', async function (req, res, next) {
    console.log("installation...")
    global.database.collection(global.JiraAccountInfoStore).findOne({ "installed.clientKey": req.body.clientKey }, function (err, result) {
      if (err) console.log(err);
      if (!result) {
        global.database.collection(global.JiraAccountInfoStore).insertOne(req.body, async (err, res) => {
          if (err) throw err;
          next();
        });
      } else {
        global.database.collection(global.JiraAccountInfoStore).updateOne({ "installed.clientKey": req.body.clientKey }, { $set: req.body }, function (err, res) {
          next();
        });
      }
    });
  });

  app.get('/', function (req, res) {
    res.format({
      'text/html': function () {
        res.redirect('/atlassian-connect.json');
      },
      'application/json': function () {
        res.redirect('/atlassian-connect.json');
      }
    });
  });

  app.get('/main-page', addon.authenticate(), async function (req, res) {
    const httpClient = addon.httpClient(req);

    httpClient.get('/rest/api/3/filter/search', (err, resp, body) => {
      if (err) res.status(res.statusCode).send(err);

      const { values: filters } = JSON.parse(body);

      res.render("main-page", { filters });
    });
  });

  app.post('/main-page', addon.checkValidToken(), async function (req, res) {

  });

  app.get('/api/filter-result', addon.authenticate(), async function (req, res) {
    const {
      query: {
        filterId
      }
    } = req;

    const httpClient = addon.httpClient(req);

    const getFilter = () =>
      new Promise((resolve, reject) =>
        httpClient.get(
          `/rest/api/3/filter/${filterId}`,
          (err, res, body) => err ? reject(err) : resolve(JSON.parse(body))
        )
      );

    const searchIssuesByJQL = (jql) =>
      new Promise((resolve, reject) =>
        httpClient.get(
          `/rest/api/3/search?jql=${jql}`,
          (err, res, body) => err ? reject(err) : resolve(JSON.parse(body))
        )
      );

    try {
      const { jql } = await getFilter(filterId);
      const { issues } = await searchIssuesByJQL(jql);

      res.send({
        success: true,
        result: issues
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.toString()
      })
    }
  });

  // load any additional files you have in routes and apply those to the app
  {
    var path = require('path');
    var files = fs.readdirSync("routes");
    for (var index in files) {
      var file = files[index];
      if (file === "index.js") continue;
      // skip non-javascript files
      if (path.extname(file) != ".js") continue;

      var routes = require("./" + path.basename(file));

      if (typeof routes === "function") {
        routes(app, addon);
      }
    }
  }
};

