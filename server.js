"use strict";
require("dotenv").config();

const path = require('path')
const http = require('http')
const io = require('socket.io');
const bodyParser = require("body-parser");
const express = require("express");
const httpProxy = require("http-proxy");


// Monitor server
const monitorApp = express();
const monitorServer = http.createServer(monitorApp);
const ioSocket = io.listen(monitorServer)

monitorApp.use('/assets', express.static(path.join(__dirname, 'node_modules')))
monitorApp.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
})

ioSocket.on('connection', (socket) => {
  socket.on('disconnect', () => {
  });
});

monitorServer.listen(process.env.MONITOR_PORT, () => {
  console.log('monitor avaliable on port %s', process.env.MONITOR_PORT);
});

// Proxy server
const target = process.env.TARGET;
const proxyApp = express();
const proxy = httpProxy.createProxyServer({});
proxy.on("proxyReq", (proxyReq, req, res, options) => {
  let cache = [];
  ioSocket.emit('request', JSON.stringify(req, (key, value) => {
    if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
            return;
        }
        cache.push(value);
    }
    return value;
  }))
  cache = null;
});
proxyApp.use(bodyParser.json());
proxyApp.use(bodyParser.urlencoded({ extended: true }));
proxyApp.use((req, res) => {
  proxy.web(req, res, {
    target: target
  });
});
const proxyServer = http.createServer(proxyApp)
proxyServer.listen(process.env.FROM_PORT, () => {
  console.log("Proxy server listening on %s", process.env.FROM_PORT);
  console.log("Proxy server target on %s", target);
});
