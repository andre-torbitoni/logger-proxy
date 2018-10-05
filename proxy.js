'use strict';

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const morgan = require('morgan');
const moment = require ('moment');
var csvWriter = require('csv-write-stream')
var fs = require('fs')
// var writer = csvWriter()


const proxy = httpProxy.createProxyServer({});
const secure = process.env.TO_SECURE;

if (process.env.TO_SECURE) {
  process.env.TO_PROTOCOL = 'https'
} else {
  process.env.TO_SECURE = false
  process.env.TO_PROTOCOL = 'http'
}
const target = process.env.TO_PROTOCOL + '://' + process.env.TO_HOST + ':' + process.env.TO_PORT

let writer = csvWriter({ headers: [
  'datahora',
  'originalUrl',
  'path',
  'baseUrl',
  'url',
  'method',
  'headers.authorization',
  'headers.client_id',
  'query.operationName',
  'query.variables',
  'query.extensions',
  'body.operationName',
  'body.variables',
  'body.query']
})

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

JSON.stringtudo = function(obj) {
  return JSON.stringify(obj,function(k,v){
     if(v instanceof Array)
        return JSON.stringify(v);
     return v;
  },2);
}
// TODO: Atribuições do diretório
// TODO: variação do protocolo de conexão [http vs https]
// process.env.FILE_PATCH = process.env.FILE_PATCH ? process.env.FILE_PATCH : '/var/log'

writer.pipe(fs.createWriteStream(process.env.FILE_PATCH + '/' + process.env.FILE_NAME + moment().format('YYMMDDhhmm') + '.csv'))

const customLogger = (req, res, next) => {
  var loggedObject = [
    moment().format("YY/MM/DD hh:mm"),
    (req.originalUrl || " "),
    (req.path || " "),
    (req.baseUrl || " "),
    (req.url || " "),
    (req.method || " "),
    (req.headers.authorization || " "),
    (req.headers.client_id || " "),
    (req.query.operationName || " "),
    (req.query.variables || " "),
    (req.query.extensions || " "),
    (req.body.operationName || " "),
    (req.body.variables || " "),
    (req.body.query || " "),
  ];
  console.log(loggedObject);

  writer.write(loggedObject)
    // console.log(json.stringify(loggedObject));
    // writer.end()
    next();
  }

  // Restream parsed body before proxying
  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    if(req.body) {
      let bodyData = JSON.stringify(req.body);
      // In case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
      proxyReq.setHeader('Content-Type','application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Stream the content
      proxyReq.write(bodyData);
    }
  });

  const proxyApp = express();
  proxyApp.use(bodyParser.json());
  proxyApp.use(bodyParser.urlencoded({extended: true}));
  proxyApp.use(customLogger);
  proxyApp.use(function(req, res){
    // ... do some stuff ... log your body and something else console.log('proxy
    // body:',req.body)
    proxy.web(req, res, {
      target: target
    })
  });
  // const logFile = fs.createWriteStream('./requests.log');

  http.createServer(proxyApp).listen(process.env.FROM_PORT, '0.0.0.0', () => {
    console.log('Proxy server linsten on ' + process.env.FROM_PORT);
    console.log('Proxy server target on ' + target);
  });
