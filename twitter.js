const Twit = require('twit');
const fetch = require('node-fetch');

// TODO: Deprecate Twit
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const getFollowers = (cursor) => {
  return new Promise((resolve) => {
    T.get(
      'followers/list',
      {
        screen_name: 'raanapbot',
        cursor,
        count: 200,
      },
      function (err, data, response) {
        resolve(data);
      }
    );
  });
};

function uploadMedia(base64, alt_text) {
  return new Promise((resolve, reject) => {
    T.post('media/upload', { media_data: base64 }, (err, data, response) => {
      if (err) {
        reject(err);
        return;
      }
      var mediaIdStr = data.media_id_string;
      var params = {
        media_id: mediaIdStr,
        alt_text: { text: alt_text },
      };
      T.post('media/metadata/create', params, () => {
        resolve(mediaIdStr);
      });
    });
  });
}

function goTweet(status, replyid, mediaIDs) {
  return new Promise((resolve, reject) => {
    var params = {
      status: status,
    };
    if (replyid) {
      params.in_reply_to_status_id = replyid;
      params.auto_populate_reply_metadata = true;
    }
    if (mediaIDs) {
      params.media_ids = mediaIDs;
    }
    T.post('statuses/update', params, (err, data, response) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Promisified tweet function
module.exports = {
  tweetIt: async (status, replyid) => {
    return await goTweet(status, replyid);
  },

  allFollowers: async () => {
    let allUsers = [];
    let data = await getFollowers('-1');
    if (data.errors) return;
    //console.log(data.users.length);
    let cursor = data.next_cursor_str;
    //console.log(cursor);
    while (cursor) {
      data = await getFollowers(cursor);
      if (!data.users || data.users.length === 0) {
        break;
      } else {
        for (let user of data.users) {
          allUsers.push(user.screen_name);
        }
      }
      cursor = data.next_cursor_str;
    }
    return allUsers;
  },

  tweetMedia: async (urls, status, replyid) => {
    let ids = [];
    for (let { url, alt_text } of urls) {
      let posterResponse = await fetch(url);
      let blob = await posterResponse.blob();
      let buffer = await blob.arrayBuffer();
      let base64String = Buffer.from(buffer).toString('base64');
      let id = await uploadMedia(base64String, alt_text);
      ids.push(id);
    }
    await goTweet(status, replyid, ids);
  },
};
