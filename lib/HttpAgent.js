const axios = require('axios');
const LoggerAdapter = require('./LoggerAdapter');

class HTTPAgent {
  constructor({ apiURL = '' } = {}) {
    this.url = apiURL;
    this.httpLibrary = axios.create({
      baseURL: this.url,
    });
    this.logger = new LoggerAdapter();
  }

  // eslint-disable-next-line class-methods-use-this
  delay(fn, ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fn());
      }, ms);
    });
  }

  _request(request, retry = 0) {
    return request()
      .then(async (res) => {
        if (!res.data) {
          if (retry <= 0) return { success: false, error: res };
          return this.delay(this._request(request, retry - 1), (4 - retry) * 5000);
        }

        return {
          success: res.data.success,
          result: res.data.records,
        };
      })
      .catch(async (e) => {
        this.logger.error('HTTPAgent e', e);
        if (retry <= 0) return { success: false, error: e };
        return this.delay(this._request(request, retry - 1), (4 - retry) * 5000);
      });
  }

  get({ path }) {
    return this._request(() => this.httpLibrary.get(path));
  }

  post({ path, body }) {
    return this._request(() => this.httpLibrary.post(path, body));
  }

  delete({ path, body }) {
    return this._request(() => this.httpLibrary.delete(path, body));
  }

  put({ path, body }) {
    return this._request(() => this.httpLibrary.put(path, body));
  }
}

module.exports = HTTPAgent;
