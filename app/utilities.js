'use strict';

let createError = (error) => {
  let res = Object.assign({}, error);
  return Promise.reject(res);
};

module.exports = {
  error: createError
};
