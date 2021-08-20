const HttpAgent = require('./HttpAgent');

class WeatherAPI extends HttpAgent {
  constructor() {
    super({ apiURL: 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001' });
    this.Authorization = '';
  }

  setAuthorization(auth) {
    this.Authorization = auth;
  }

  get(query = {}) {
    if (!this.Authorization) {
      return Promise.reject(new Error('WeatherAPI not set API Authorization'));
    }

    let queryString = '';
    Object.keys(query).forEach((key) => {
      if (queryString) {
        queryString = `${key}=${query[key]}`;
      } else {
        queryString = `${queryString}&${key}=${query[key]}`;
      }
    });
    const url = `${this.url}?Authorization=${this.Authorization}${queryString}`;
    return this._request(() => this.httpLibrary.get(encodeURI(url)));
  }
}

module.exports = WeatherAPI;
