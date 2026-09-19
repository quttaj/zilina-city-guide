
const express = require('express');
module.exports = function () {
  const router = express.Router();
  for (const method of ['get', 'post']) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) => original(path, ...handlers.map(handler =>
      (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next)
    ));
  }
  return router;
};
