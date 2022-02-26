/** @format */

const request = require('request');

export function rq(options): Promise<any> {
  return new Promise((resolve, reject) => {
    const logger = global['appInstance'] ? global['appInstance'].logger : console;
    if (options.mock) {
      resolve(options.mockData);
      return;
    }
    const option = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      json: true,
    };
    // console.log('===', process.env.DOCKER_ENV)
    if (process.env.DOCKER_ENV === 'local') {
      Object.assign(option, {
        proxy: 'http://127.0.0.1:12639',
      });
      delete options.proxy;
    }
    if (options.removeJSON) {
      delete option.json;
    }
    Object.assign(option, options);
    logger.info('request server: ', JSON.stringify(option));
    request(option, function (error, response, body) {
      if (error || !response || response.statusCode !== 200) {
        reject(error || 'request server error');
        return;
      }
      logger.info('request server response: ', JSON.stringify(body));
      resolve(body);
    });
  });
}
