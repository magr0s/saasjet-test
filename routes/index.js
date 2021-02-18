const fs = require("fs")
const Logger = require('../libs/Logger');
const JiraClient = require('../libs/Jira');

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
    const jiraClient = new JiraClient(httpClient);

    try {
      const { values: filters } = await jiraClient.filter.search();

      res.render("main-page", { filters });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.toString()
      })
    }
  });

  app.get('/api/filter-result', addon.checkValidToken(), async function (req, res) {
    const {
      query: {
        filterId
      }
    } = req;

    const httpClient = addon.httpClient(req);
    const jiraClient = new JiraClient(httpClient);

    try {
      const [
        { jql },
        statuses
      ] = await Promise.all([
        jiraClient.filter.getFilter(filterId),
        jiraClient.workflow.statuses()
      ])

      const { issues } = await jiraClient.issues.searchByJQL(jql);

      await Logger.info('SELECT_FILTER');

      res.send({
        success: true,
        result: {
          issues,
          statuses
        }
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.toString()
      })
    }
  });

  app.post('/api/click-logger', addon.checkValidToken(), async function (req, res) {
    await Logger.info(req.body.event);

    res.end();
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

