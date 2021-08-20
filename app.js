const Utils = require('./lib/Utils');
const WeatherAPI = require('./lib/WeatherAPI');

const main = async () => {
  const config = await Utils.readConfig();

  const weatherAPI = new WeatherAPI();
  weatherAPI.setAuthorization(config.base.weatherToken);
  const res = await weatherAPI.get({
    locationName: '新北市,臺北市',
  });
  console.log(JSON.stringify(res));
};

main();
