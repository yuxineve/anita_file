/** @format */

import axios, { AxiosRequestConfig } from 'axios';
import mockPromise from './MockPromise';
import ErrorProcess from './ErrorProcess';
import { Modal } from 'antd';

const throttle = require('lodash/throttle');
let isShowing = false;
const confirmToReloadWeb = throttle(() => {
  if (isShowing) return;
  isShowing = true;
  Modal.confirm({
    title: '网络异常',
    content: '有可能是网络连接失败, 是否重试？',
    onOk: () => {
      isShowing = false;
      window.location.reload();
      console.info('cancel');
    },
    onCancel: () => {
      isShowing = false;
      console.info('cancel');
    },
  });
}, 10000);

// @ts-ignore
const preFetchState = window.PRE_FETCH_STATE;
axios.defaults.headers.common['x-csrf-token'] = preFetchState?.common?.csrfToken;
axios.defaults.headers.common['x-client-fetch'] = 1;
export const axiosDetault = axios.create({});
export const axiosClient = axios.create({
  baseURL: preFetchState?.basename,
});

// 设置全局的请求次数，请求的间隙
// @ts-ignore
axios.defaults.retry = 4;
// @ts-ignore
axios.defaults.retryDelay = 1000;

const isNotEditorWithAxios = () => {
  return window.location.href.indexOf('/editor') === -1;
};

axiosClient.interceptors.response.use(
  response => {
    if (response.data instanceof Blob) {
      return response;
    }
    const {
      data: { code, msg, chmsg },
    } = response;
    if (code !== 0) {
      if (code === 418) {
        if (isNotEditorWithAxios()) {
          location.href = `${window.location.origin}/login`;
          return;
        }
      }
      if (code === 'NO_PERMISSION') {
        location.reload();
        return;
      }
      return Promise.reject({ code, message: ErrorProcess(code, msg, chmsg) });
    } else {
      response.data.code = 1;
    }
    return response;
  },
  err => {
    const config = err.config;
    // If config does not exist or the retry option is not set, reject
    if (!config || !config.retry) {
      console.log('err.message', err.message);
      if (err.message === 'Network Error') {
        console.error(err);
        if (isNotEditorWithAxios()) {
          confirmToReloadWeb();
        }
        return Promise.reject({ code: 418, msg: '系统错误' });
      }
      return Promise.reject({ code: err.response.status, msg: '系统错误' });
    }
    config.__retryCount = config.__retryCount || 0;
    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= config.retry) {
      // Reject with the error
      if (err.message === 'Network Error') {
        console.error(err);
        // 用户登录态失效，重新刷新
        // window.location.reload()
        if (isNotEditorWithAxios()) {
          location.reload();
        }
        return Promise.reject({ code: 418, msg: '系统错误' });
      }
      return Promise.reject({ code: 418, msg: '系统错误' });
    }

    // Increase the retry count
    config.__retryCount += 1;

    // Create new promise to handle exponential backoff
    var backoff = new Promise(function (resolve) {
      setTimeout(function () {
        resolve();
      }, config.retryDelay || 1);
    });

    // Return the promise in which recalls axios to retry the request
    return backoff.then(function () {
      return axiosClient(config);
    });
  },
);

export default function (config: AxiosRequestConfig) {
  return mockPromise(axiosClient(config), p => {
    p.catch(err => {
      throw ErrorProcess(err, err.msg);
    });
  });
}
