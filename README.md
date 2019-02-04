# logger-proxy

Do you know what a proxy is?¹

So that's right!

the only difference is that this will write the request information in a .csv file so you know what is being sent by your service that sucks! ;)

¹ Do not know what a proxy is? read here: [how does http proxy work?](https://stackoverflow.com/a/9474489/3617036)

## Installation


```
git clone
yarn install
yarn start
```

## EnvVars

> .env variables loaded by default in project root. 

| Env Variable | Description | Example |
|:---:|:---|:---|
|TARGET|where the proxy will send the requests must contain protocol, host and port (if not 80)|http://localhost:8082|
|FROM_PORT|port that the proxy will be listening |5000|
|FILE_PATCH|path that the log will be stored|./logs|
|FILE_NAME|prefix of the file name, all files are added by [filename + YYMMDDhhmm]|log|

