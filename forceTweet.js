require('dotenv').config();

const {
  Autohook,
  setWebhook,
  validateWebhook,
  WebhookURIError,
  RateLimitError,
} = require('twitter-autohook');

const util = require('util');
const request = require('request');
const url = require('url');
const http = require('http');
const PORT = 3000;

const post = util.promisify(request.post);
const fs = require('fs');
const fetch = require('node-fetch');

const { random, sleep, pickYear, threadIt } = require('./util');

const { tweetIt } = require('./twitter');

console.log('beep beep 🤖');

const tweet = `WELCOME TO THE OMAHA PODCAST
My podcast idea! I teach the listeners about the city and show them a picture of the iconic Wawa sign.  They can then use Google to find the actual store and buy whatever they need. The catch is that I’m not gonna buy you a pizza. That’s it!`;
console.log(tweet.length);
go();
async function go() {
  let data = await tweetIt(tweet);
}
