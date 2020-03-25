"use strict";
require("dotenv").config();
//  import lib
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const httpProxy = require("http-proxy");
const morgan = require("morgan");
const moment = require("moment");
const csvWriter = require("csv-write-stream");
const fs = require("fs");

// Objeto que vai modelar o formato do *.CSV
const writer = csvWriter({
  headers: [
    "datahora",
    "originalUrl",
    "path",
    "baseUrl",
    "url",
    "method",
    "headers.authorization",
    "headers.client_id",
    "query.operationName",
    "query.variables",
    "query.extensions",
    "body.operationName",
    "body.variables",
    "body.query",
    "query",
    "params"
  ]
});

// Write stream pra escrever no arquivo
writer.pipe(
  fs.createWriteStream(
    process.env.FILE_PATCH +
      "/" +
      process.env.FILE_NAME +
      moment().format("YYMMDDhhmm") +
      ".csv"
  )
);

// Cria um array com todos o conteúdo da planilha
const csvLogger = (req, res, next) => {
  var loggedObject = [
    moment().format("YY/MM/DD hh:mm"),
    req.originalUrl || " ",
    req.path || " ",
    req.baseUrl || " ",
    req.url || " ",
    req.method || " ",
    req.headers.authorization || " ",
    req.headers.client_id || " ",
    req.query.operationName || " ",
    req.query.variables || " ",
    req.query.extensions || " ",
    req.body.operationName || " ",
    req.body.variables || " ",
    req.body.query || " ",
    req.query ? JSON.stringify(req.query) : " ",
    req.params ? JSON.stringify(req.params) : " "
  ];
  //consolida na planilha
  writer.write(loggedObject);
  // writer.end()
  next();
};

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, "g"), replacement);
};

JSON.stringtudo = function(obj) {
  return JSON.stringify(
    obj,
    function(k, v) {
      if (v instanceof Array) return JSON.stringify(v);
      return v;
    },
    2
  );
};

/////////////////////////////////// PROXY SERVER ///////////////////////////////

const proxy = httpProxy.createProxyServer({});

// analise do corpo antes de fazer proxy
proxy.on("proxyReq", function(proxyReq, req, res, options) {
  if (req.body) {
    let bodyData = JSON.stringify(req.body);
    // Caso o tipo de conteúdo seja application / x-www-form-urlencoded -> precisamos mudar para application / json
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    // Transmitir o conteúdo
    proxyReq.write(bodyData);
  }
});

const target = process.env.TARGET;

const proxyApp = express();
proxyApp.use(bodyParser.json());
proxyApp.use(bodyParser.urlencoded({ extended: true }));
proxyApp.use(csvLogger);
proxyApp.use(function(req, res) {
  console.log("proxy body:", req.body);
  proxy.web(req, res, {
    target: target
  });
});

http.createServer(proxyApp).listen(process.env.FROM_PORT, "0.0.0.0", () => {
  console.log("Proxy server listening on " + process.env.FROM_PORT);
  console.log("Proxy server target on " + target);
});
