const { format: dateFormat } = require('date-fns');

const { mysql } = global;

class Logger {
  /**
   * Info log
   * @param {string} event
   * @param {string} [message]
   */
  static async info (event, message) {
    const query = Logger.prepareQuery(event, 1, message);

    await Logger.write(query);
  }

  /**
   * Error log
   * @param {string} event
   * @param {string} [message]
   */
  static async error (event, message) {
    const query = Logger.prepareQuery(event, 0, message);

    await Logger.write(values);
  }

  /**
   *
   * @param {string} event
   * @param {number} success
   * @param {string} [message]
   */
  static prepareQuery (event, success, message = '') {
    const values = [
      Logger.currDate,
      Logger.currTime,
      event,
      success,
      message
    ];

    return `INSERT INTO logs (date_at, time_at, event, success, message) VALUES ("${Logger.currDate}", "${Logger.currTime}", "${event}", ${success}, "${message}")`;
  }

  /**
   * Write to MySql
   * @param {string} query
   */
  static write (query) {
    return new Promise(
      (resolve, reject) =>
        mysql.query(query, (err, result) => !err ? resolve(result) : reject(err))
    );
  }

  /**
   * Current date
   */
  static get currDate () {
    return dateFormat(Date.now(), 'yyyy-MM-dd');
  }

  /**
   * Current time
   */
  static get currTime () {
    return dateFormat(Date.now(), 'HH:mm:ss');
  }
}

module.exports = Logger;
