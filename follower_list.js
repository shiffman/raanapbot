const Twit = require("twit");
require('dotenv').config()
const fs = require('fs');


const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
fillList();

// let data = JSON.parse(fs.readFileSync('followers.json', 'utf-8'));
// console.log(data.followers);


let approvedList;

function getFollowers(cursor) {
  return new Promise(resolve => {
    T.get('followers/list', { screen_name: 'raanapbot', cursor, count: 200 },  function (err, data, response) {
      resolve(data);
    });
  });
}


async function fillList() {
  approvedList = await allFollowers();
  console.log(approvedList);
  fs.writeFileSync("followers.json", JSON.stringify({followers: approvedList}, null, 2));
}

async function allFollowers() {  
  let allUsers = [];
  let data = await getFollowers('-1');
  console.log(data);
  if (data.errors) return;
  console.log(data.users.length);
  let cursor = data.next_cursor_str;
  console.log(cursor);
  while (cursor) {
    data = await getFollowers(cursor);
    console.log(data.users.length);
    if (data.users.length === 0) {
      break;
    } else {
      for (let user of data.users) {
        allUsers.push(user.screen_name);
      }
    }
    cursor = data.next_cursor_str;
  }
  return allUsers;
}

