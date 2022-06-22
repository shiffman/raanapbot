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

const tweet = `Mini golf is underrated because it’s very time-consuming, but it’s actually really fun to play and could be fun to watch.

This game has been around for a long time and hasn’t really gotten much attention from the media.`;
console.log(tweet.length);
go();
async function go() {
  let data = await tweetIt(tweet, '1525630319449227264');
}
