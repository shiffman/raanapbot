require('dotenv').config();
const fs = require('fs');

const allIdeas = fs.readFileSync('raanap.txt', 'utf-8');
const prompts = allIdeas.split('\n');
const wordfilter = require('wordfilter');
const { random, sleep, pickYear, threadIt } = require('./util');
const { generateRunway } = require('./runway');

const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

goTweet();

async function goTweet() {
  prompt = random(prompts);
  const len = Math.min(prompt.length, 16);
  const end = Math.floor(Math.random() * len) + 1;
  prompt = prompt.substring(0, end);
  prompt = prompt.trim();
  console.log(prompt);
  if (Math.random() < 0.25) prompt = 'Podcast Idea: ' + prompt;
  let tweet = await generateRunway(prompt);
  console.log(tweet);
}
