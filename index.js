// ERROR EACCES: permission denied
// enable-pnpm

require('dotenv').config();
const ngrok = require('ngrok');

const {
  Autohook,
  setWebhook,
  validateWebhook,
  validateSignature,
  WebhookURIError,
  RateLimitError,
} = require('twitter-autohook');
const util = require('util');
const request = require('request');
const url = require('url');
const http = require('http');

const post = util.promisify(request.post);
const fs = require('fs');
const fetch = require('node-fetch');

const allIdeas = fs.readFileSync('prompts/raanap_prompts.txt', 'utf-8');
const prompts = allIdeas.split('\n');

const allTakes = fs.readFileSync('prompts/hot_takes_prompts.txt', 'utf-8');
const takePrompts = allTakes.split('\n');

// const allTV = fs.readFileSync("alltv.txt", "utf-8").split("\n");
// goFIG

const wordfilter = require('wordfilter');
const numeral = require('numeral');

const { random, sleep, pickYear, threadIt } = require('./util');
const { generateRunway } = require('./runway');
const { approvedNames, approvedMentions, replies, blockedWords, lessReplies } =
  JSON.parse(fs.readFileSync('data/lists.json', 'utf-8'));
const { tweetIt, allFollowers, tweetImage } = require('./twitter');
const { crappyMovieDiaper, s3e7 } = require('./moviedb');
const { goGIF } = require('./gif-tenor');

console.log('beep beep 🤖');

const emojiLookup = {
  '0️⃣': 0,
  '1️⃣': 1,
  '2️⃣': 2,
  '3️⃣': 3,
  '4️⃣': 4,
  '5️⃣': 5,
  '6️⃣': 6,
  '7️⃣': 7,
  '8️⃣': 8,
  '9️⃣': 9,
};

// Manually adding some words that the bot has used
wordfilter.addWords(blockedWords);

const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

// DISCORD initialization
console.log('Beep beep! 🤖');
const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
client.login(process.env.DISCORD_TOKEN);
client.once('ready', readyDiscord);

async function readyDiscord() {
  console.log('💖');
}

const queue = {};

async function addChoices(tweets) {
  console.log('adding to queue');

  let content = '';
  for (let i = 0; i < tweets.length; i++) {
    content += `${i}: ${tweets[i]}\n`;
  }

  const raanapbotEmbed = new MessageEmbed()
    .setTitle('Choose a tweet')
    .setDescription(content)
    .setTimestamp()
    .setFooter({ text: 'React 0️⃣-9️⃣ to select a tweet.' });
  console.log('posting to discord');
  const msg = await client.channels.cache
    .get('954907424245047306')
    .send({ embeds: [raanapbotEmbed] });
  queue[msg.id] = { tweet: tweets };
}

async function add2Queue(tweet, tweetData) {
  // console.log(tweetData);
  // fs.writeFileSync('tweet.json', JSON.stringify(tweetData, null, 2));
  // const content = `${tweet}\nin_reply_to: ${reply_id}`;
  console.log('adding to queue');
  const raanapbotEmbed = new MessageEmbed()
    .setTitle('New Raanapbot Tweet!')
    .setDescription(tweet)
    .setTimestamp()
    .setFooter({ text: 'React with 👍 to approve, 👎 to reject.' });
  if (tweetData) {
    raanapbotEmbed.setTitle('New Raanapbot Reply!');
    raanapbotEmbed.addFields({
      name: 'reply to',
      value: tweetData.user.screen_name,
    });
    raanapbotEmbed.addFields({ name: 'original tweet', value: tweetData.text });
    raanapbotEmbed.setURL(
      `https://twitter.com/${tweetData.user.screen_name}/status/${tweetData.id_str}`
    );
  }
  console.log('posting to discord');
  const msg = await client.channels.cache
    .get('954907424245047306')
    .send({ embeds: [raanapbotEmbed] });
  queue[msg.id] = { tweet };
  if (tweetData) {
    queue[msg.id].reply_id = tweetData.id_str;
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
  const id = reaction.message.id;
  const channel = reaction.message.channel;
  console.log(channel.id);
  if (channel.id !== '954907424245047306') {
    console.log('wrong channel reaction');
    return;
  }

  if (queue[id]) {
    const { tweet, reply_id } = queue[id];
    const emoji = reaction._emoji.name;
    const index = emojiLookup[emoji];
    if (index > -1) {
      console.log('Selected: ' + emojiLookup[emoji]);
      await reaction.message.reply(`Tweeting #${index}!`);
      if (tweet[index].length > 280) {
        const thread = threadIt(tweet[index]);
        let data = await tweetIt(thread[0], reply_id);
        for (let i = 1; i < thread.length; i++) {
          data = await tweetIt(thread[i], data.id_str);
        }
      } else {
        await tweetIt(tweet[index], reply_id);
      }
    } else if (emoji == '👍') {
      console.log('approved');
      if (tweet.length > 280) {
        const thread = threadIt(tweet);
        let data = await tweetIt(thread[0], reply_id);
        for (let i = 1; i < thread.length; i++) {
          data = await tweetIt(thread[i], data.id_str);
        }
      } else {
        await tweetIt(tweet, reply_id);
      }
      await reaction.message.reply('tweet posted!');
      queue[id] = undefined;
    } else if (reaction._emoji.name == '👎') {
      await reaction.message.reply('tweet cancelled!');
      if (!reply_id) {
        goTweet();
      } else {
        if (Math.random() < 0.5) {
          await goGIF(tweet);
        } else {
          await cannedReply(tweet);
        }
      }
    }
  } else {
    await reaction.message.reply('did not find this tweet in the queue!');
  }
});

start();
tweeting();

// Tweeting loop
function tweeting() {
  //const period = 30 * 60 * 1000;
  // Temporarily every 1 minutes
  // const period = 1 * 1 * 60 * 1000;
  // const period = 4 * 60 * 60 * 1000;

  // FOUR HOURS
  const period = 4 * 60 * 60 * 1000;

  // ONE HOUR
  // const period = 1 * 60 * 60 * 1000;

  // const period = 0.25 * 60 * 60 * 1000;
  let previous = Number(fs.readFileSync('time.txt', 'utf-8'));
  let diff = new Date().getTime() - previous;
  if (diff > period) {
    setTimeout(() => {
      console.log(`It's been ${diff} millis, tweeting now!`);
      goTweet();
      setInterval(goTweet, period);
    }, 5000);
  } else {
    const wait = period - diff;
    console.log(`waiting ${wait} millis to tweet.`);
    setTimeout(() => {
      goTweet();
      setInterval(goTweet, period);
    }, wait);
  }
}

// const all = fs.readFileSync("12days.txt", "utf-8");
// const days12 = all.split(/\n{2,}/);
// console.log(days12);
// let xmas = Number(fs.readFileSync("xmas.txt", "utf-8"));
// console.log(xmas);

// New tweet

// const data = fs.readFileSync('titles.txt', 'utf-8');
// const titles = data.split('\n');
// let index = Number(titles[0]) - 1;

const ratedText = fs.readFileSync('prompts/ratedAll.txt', 'utf-8');
const ratedList = ratedText.split('\n');
// console.log(ratedList);

const takesText = fs.readFileSync('prompts/takes.txt', 'utf-8');
const takesList = takesText.split('\n');

// for (let i = 0; i < takesList.length; i++) {
//   let s = 'Hot take: ' + takesList[i];
//   if (s.length > 280) {
//     console.log(s);
//   }
// }

async function goTweet() {
  const now = new Date().getTime();
  fs.writeFileSync('time.txt', `${now}`);
  //let akivaIndex = Number(fs.readFileSync("akiva.txt", "utf-8"));
  //console.log(`Akiva index: ${akivaIndex}`);
  // Create a prompt

  // Tweeting ideas only right now
  // tweetIt(titles[index]);
  // console.log(titles[index]);
  // index++;
  // return;

  let model = 'mailbag';

  let prompt = '';
  const r = Math.random();
  console.log(r);
  // Force a tweet

  if (r < 0.05) {
    const raw = fs.readFileSync('prompts/gen_phrases.txt', 'utf-8');
    const phrases = raw.split('\n');
    let index = Math.floor(Math.random() * phrases.length);
    let suffix = [' (Rob)', ' (Rob)', ' (Akiva)', ' (Akiva)', ' (Both)'];
    let phrase = `catchphrase: ${phrases[index]}${random(suffix)}`;
    phrases.splice(index, 1);
    fs.writeFileSync('prompts/gen_phrases.txt', phrases.join('\n'));
    await tweetIt(phrase);
    console.log(phrase);
    return;
  } else if (r < 0.1) {
    const today = [
      'I was today years old when I learned',
      'I was today years old when I found out',
    ];
    prompt = random(today);
    model = 'til';
  } else if (r < 0.12) {
    // if (r < 0.0) {
    let index = Math.floor(Math.random() * ratedList.length);
    prompt = ratedList[index];
    //ratedList.splice(index, 1);
    prompt += ' ';
    prompt += random(['overrated', 'properly rated', 'underrated']);
    if (Math.random() < 0.5) {
      prompt += ' because';
    }
  } else if (r < 0.3) {
    // } else if (r < 1) {
    // let index = Math.floor(Math.random() * takesList.length);
    // const tweet = 'Hot take: ' + takesList[index];
    // takesList.splice(index, 1);
    // const newTakes = takesList.join('\n');
    // fs.writeFileSync('misc/takes.txt', newTakes);
    // if (tweet.length > 280) {
    //   const thread = threadIt(tweet);
    //   let data = await tweetIt(thread[0]);
    //   for (let i = 1; i < thread.length; i++) {
    //     data = await tweetIt(thread[i], data.id_str);
    //   }
    // } else {
    //   await tweetIt(tweet);
    // }
    // return;
    // let hbd = [
    //   'Dr. Amanda is underrated because',
    //   'Happy Birthday!',
    //   'Happy Birthday',
    //   'Happy birthday to',
    //   'Happy Birthday Dr. Amanda',
    //   'Happy Birthday to Dr. Amanda',
    // ];
    // prompt = random(hbd);
    let hottakes = ['Hot take: ', 'Hot take:', 'Hot take:'];
    prompt = random(hottakes);
    let takePrompt = random(takePrompts);
    let tokens = takePrompt.split(' ');
    if (Math.random() < 0.5) {
      prompt = tokens[0];
      if (Math.random() < 0.5) prompt += ' ' + tokens[1];
      if (Math.random() < 0.5) prompt = 'Hot take: ' + prompt;
    }
    model = 'hottake';
    //     //xmas++;
    //     //fs.writeFileSync("xmas.txt", `${xmas}`);
  } else if (r < 0.35) {
    let rebrands = [
      'Rob and Akiva Rebrand ',
      'Rob and Akiva Rebrand',
      'Rob and Akiva rebrand ',
      'Rob and Akiva rebrand',
      'Rob & Akiva Rebrand ',
      'Rob & Akiva Rebrand',
      'Rob & Akiva rebrand ',
      'Rob & Akiva rebrand',
    ];
    prompt = random(rebrands);
  } else if (r < 0.4) {
    let vows = [
      'I promise to',
      'I promise to be',
      'I promise to choose you',
      'I vow to',
      'I promise',
      'I vow',
      'I take you',
      'I take you to be my',
    ];
    prompt = random(vows);
  }
  //if (r < 1) {
  else if (r < 0.42) {
    console.log('s3e7');
    await s3e7();
    return;
  } else if (r < 0.44) {
    let hack = 0;
    let result = await crappyMovieDiaper();
    while (!result) {
      console.log('trying crappy movie diaper again');
      result = await crappyMovieDiaper();
      hack++;
      if (hack > 10) {
        break;
      }
    }
    return;
  } else if (r < 0.5) {
    prompt = random(prompts);
    const len = Math.min(prompt.length, 16);
    const end = Math.floor(Math.random() * len) + 1;
    prompt = prompt.substring(0, end);
    prompt = prompt.trim();
    if (Math.random() < 0.25) prompt = 'Podcast Idea: ' + prompt;
    // Prompt with first and/or second word
  } else if (r < 0.55) {
    prompt = 'Rob and Akiva Need';
  } else if (r < 0.95) {
    const txt = random(prompts);
    const words = txt.split(' ');
    prompt = words[0];
    if (Math.random() < 0.5) prompt += ' ' + words[1];
    if (Math.random() < 0.25) prompt = 'Podcast Idea: ' + prompt;
    // Podcast Idea prompt
  } else {
    prompt = random(['Podcast Idea', 'Podcast Idea:']);
  }

  // Generate Tweet
  let choices = await generateRunway(prompt, 10, model);

  if (choices.error) {
    console.log('error');
    // Trying again in 10 minutes
    setTimeout(goTweet, 10 * 60 * 1000);
    return;
  }

  console.log(choices);
  for (let i = choices.length - 1; i >= 0; i--) {
    if (wordfilter.blacklisted(choices[i])) {
      console.log('wordfilter blocked tweet');
      console.log(choices[i]);
      choices.splice(i, 1);
      continue;
    }

    // Replace all metnions
    // TODO: Code is duplicated as in reply() function
    // This and wordfilter and threading!
    let regex = /@[a-z0-9_]+/gi;
    let mentions = choices[i].match(regex);
    if (mentions) {
      mentions.forEach((username) => {
        let screen_name = username.substring(1, username.length);
        // console.log(`Mentioned: ${screen_name}`);
        if (!approvedMentions[screen_name]) {
          let replacements = Object.keys(approvedMentions);
          let replacement = random(replacements);
          console.log(`Replacing: ${screen_name} with ${replacement}`);
          choices[i] = choices[i].replace(screen_name, replacement);
        }
      });
    }
  }

  // Thread?

  await addChoices(choices);
  // if (tweet.length > 280) {
  //   const thread = threadIt(tweet);
  //   let data = await tweetIt(thread[0]);
  //   for (let i = 1; i < thread.length; i++) {
  //     data = await tweetIt(thread[i], data.id_str);
  //   }
  // } else {
  //   tweetIt(tweet);
  // }
}

// Canned reply
async function cannedReply(tweet) {
  // Can go direct!
  let data = await tweetIt(random(replies), tweet.id_str);
}

// Canned reply
async function randomNumber(tweet, min, max) {
  const r = min + Math.random() * (max - min);
  const s = numeral(r).format('0,0');
  let data = await tweetIt(s, tweet.id_str);
}

// Non cannced reply
async function reply(tweet) {
  console.log('replying via runway');
  // Previous tweet is prompt
  let prompt = tweet.text;
  if (tweet.extended_tweet) {
    prompt = tweet.extended_tweet.full_text;
  }
  console.log('prompt: ' + prompt);

  // Get rid of all mentions at the start?
  let regexAt = /^(@[a-z0-9_]+\s+)+/i;
  prompt = prompt.replace(regexAt, '');
  prompt = prompt.replace(/&amp;/gi, '&');
  prompt = prompt.trim();

  // Any remaining URLs?
  const regexURL = /https:\/\/t\.co\/[a-z0-9]+/i;
  prompt = prompt.replace(regexURL, '');
  const lastChar = prompt.charAt(prompt.length - 1);
  prompt.trim();

  // Is there a period or no?
  if (!/[.!?]/.test(lastChar)) {
    prompt += '.';
  }

  console.log('revised: ' + prompt);
  const generated = await generateRunway(prompt, 1);

  if (generated.error) {
    console.log(generated.error);
    return;
  }

  let replyText = generated.replace(prompt, '').trim();

  // TODO: more cleanup here?

  // Canned reply if there's nothing
  if (replyText.length < 1 && Math.random() < 0.5) {
    return await cannedReply(tweet);
  } else {
    return await goGIF(tweet);
  }

  if (wordfilter.blacklisted(replyText)) {
    console.log('wordfilter blocked tweet');
    console.log(replyText);
    return;
  }

  // Replace all mentions
  let regex = /@[a-z0-9_]+/gi;
  let mentions = replyText.match(regex);
  if (mentions) {
    mentions.forEach((username) => {
      let screen_name = username.substring(1, username.length);
      console.log(`Mentioned: ${screen_name}`);
      if (!approvedMentions[screen_name]) {
        let replacements = Object.keys(approvedMentions);
        let replacement = random(replacements);
        console.log(`Replacing: ${screen_name} with ${replacement}`);
        replyText = replyText.replace(screen_name, replacement);
      }
    });
  }

  // Thread it?
  await add2Queue(replyText, tweet);
  // if (replyText.length > 280) {
  //   const thread = threadIt(replyText);
  //   let data = await tweetIt(thread[0], tweet.id_str);
  //   for (let i = 1; i < thread.length; i++) {
  //     data = await tweetIt(thread[i], data.id_str);
  //   }
  // } else {
  //   // Regular tweet
  //   let data = await tweetIt(replyText, tweet.id_str);
  // }
}

// Starting the listening and other things
async function start() {
  try {
    // Get list of followers
    await fillList();

    // Load GIFs
    // loadGIFs();

    // FOR GLITCH
    // const webhookURL = `https://${process.env.PROJECT_DOMAIN}.glitch.me/webhook`;

    // WITH NGROK
    const PORT = 4242;
    const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN;
    await ngrok.authtoken(NGROK_AUTH_TOKEN);
    const url = await ngrok.connect(PORT);
    const webhookURL = `${url}/standalone-server/webhook`;
    const server = startServer(PORT, oAuthConfig);

    const webhook = new Autohook();
    await webhook.removeWebhooks();

    // When there is an event!
    await webhook.start(webhookURL);
    await webhook.subscribe({
      oauth_token: process.env.TWITTER_ACCESS_TOKEN,
      oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
  } catch (e) {
    console.error(e);
    if (e.name === 'RateLimitError') {
      await sleep(e.resetAt - new Date().getTime());
      process.exit(1);
    }
  }
}

let approvedList;

async function fillList() {
  approvedList = await allFollowers();
  //console.log(approvedList);
  if (!approvedList) {
    console.log('loading file of followers');
    approvedList = JSON.parse(
      fs.readFileSync('data/followers.json', 'utf-8')
    ).followers;
  } else {
    // Write new followers file
    console.log('writing file of followers');
    fs.writeFileSync(
      'data/followers.json',
      JSON.stringify(
        {
          followers: approvedList,
        },
        null,
        2
      )
    );
  }
  console.log(`Loaded ${approvedList.length} followers.`);
  approvedList.forEach((user) => (approvedMentions[user] = true));
  //console.log(approvedMentions);
}

/// GIFS
// const gifs = [];

// function loadGIFs() {
//   const content = fs.readFileSync(".glitch-assets", "utf8");
//   const rows = content.split("\n");
//   let assets = rows.map(row => {
//     try {
//       return JSON.parse(row);
//     } catch (e) {}
//   });
//   assets = assets.filter(asset => asset);
//   assets.forEach(asset => {
//     if (asset.type == "image/gif") {
//       gifs.push(asset);
//       if (!alt_text.alt[asset.name])
//         console.log(`Missing ${asset.name} alt text.`);
//     }
//   });
//   console.log(`Loaded ${gifs.length} GIFS`);
// }

const startServer = (port, auth) =>
  http
    .createServer((req, res) => {
      const route = url.parse(req.url, true);
      if (!route.pathname) {
        return;
      }

      if (route.query.crc_token) {
        try {
          if (!validateSignature(req.headers, auth, url.parse(req.url).query)) {
            console.error('Cannot validate webhook signature');
            return;
          }
        } catch (e) {
          console.error(e);
        }

        const crc = validateWebhook(route.query.crc_token, auth, res);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(crc));
      }

      if (
        req.method === 'POST' &&
        req.headers['content-type'] === 'application/json'
      ) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            if (!validateSignature(req.headers, auth, body)) {
              console.error('Cannot validate webhook signature');
              return;
            }
          } catch (e) {
            console.error(e);
          }

          let json = JSON.parse(body);
          // if (json.direct_message_events) {
          //   console.log(json.direct_message_events);
          // }
          if (json.tweet_create_events) {
            tweetHandler(json);
          }
          res.writeHead(200);
          res.end();
        });
      }
    })
    .listen(port);

async function tweetHandler(event) {
  if (event.tweet_create_events) {
    const tweet = event.tweet_create_events[0];
    let mentions = [];
    if (tweet.entities.user_mentions) {
      tweet.entities.user_mentions.forEach((elt) =>
        mentions.push(elt.screen_name)
      );
    }
    const reply_screen_name = tweet.in_reply_to_screen_name;
    const screen_name = tweet.user.screen_name;
    console.log(`from: ${screen_name} reply to: ${reply_screen_name}`);
    console.log(`${tweet.text}`);
    if (screen_name == 'raanapbot') {
      console.log('this is a raanapbot tweet');
      return;
    }

    // Now I'll get quote tweets??
    // if (
    //   reply_screen_name !== "raanapbot" &&
    //   !mentions.includes("raanapbot")
    // ) {
    //   console.log("not sure why this tweet is here!");
    //   return;
    // }

    let txt = tweet.text;
    if (/^RT\s/.test(txt)) {
      return;
    }

    // Clean up tweet
    let regexAt = /^(@[a-z0-9_]+\s+)+/i;
    txt = txt.replace(regexAt, '');
    txt = txt.replace(/&amp;/gi, '&');
    txt = txt.trim();

    // Is this a GIF sent to me?
    const regexAllURL = /^https:\/\/t\.co\/[a-z0-9]+$/i;
    if (regexAllURL.test(txt) && Math.random() < 0.9) {
      await goGIF(tweet);
      return;
    }

    // let regex = /random\s+number/i;
    // if (regex.test(txt)) {
    //   const vals = txt.match(/(\d|,)+/g);
    //   const nums = vals.map((elt) => parseInt(elt));
    //   nums.sort((a, b) => a - b);
    //   console.log(nums);
    //   const min = parseInt(nums[0]) || 0;
    //   const max = parseInt(nums[nums.length - 1]) || 1000000;
    //   console.log(min, max);
    //   await randomNumber(tweet, min, max);
    //   return;
    // }

    // Randomly create a reply
    let r1 = Math.random();
    console.log(r1);

    if (lessReplies.includes(tweet.user.screen_name) && Math.random() < 0.6) {
      return;
    }

    if (r1 < 0.25) {
      await goGIF(tweet);
    } else if (r1 < 5) {
      await cannedReply(tweet);
    } else if (approvedNames.includes(tweet.user.screen_name)) {
      await reply(tweet);
    } else {
      await reply(tweet);
    }
  }
  // }
}
