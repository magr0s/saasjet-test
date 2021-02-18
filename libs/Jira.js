const Logger = require('./Logger');

class JiraClient {
  constructor (httpClient) {
    this.httpClient = httpClient;
  }

  get filter () {
    const search = async () =>
      this.request('/rest/api/3/filter/search');

    const getFilter = async (id) =>
      this.request(`/rest/api/3/filter/${id}`);

    return {
      search,
      getFilter
    }
  }

  get issues () {
    const searchByJQL = async (jql) => this.request(`/rest/api/3/search?jql=${jql}`);

    return {
      searchByJQL
    }
  }

  get workflow () {
    const statuses = async () => this.request('/rest/api/3/status');

    return {
      statuses
    }
  }

  request (endpoint) {
    return new Promise(
      (resolve, reject) =>
        this.httpClient.get(
          endpoint,
          async (err, res, body) => {
            // TODO: check connection error

            if (err) {
              await Logger.error(endpoint, err);

              reject(err);
            }

            const data = JSON.parse(body);

            resolve(data);
          }
        )
    );
  }
}

module.exports = JiraClient;
