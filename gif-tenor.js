const { random } = require('./util');
const { gifTerms } = require('./lists');
const { tweetMedia } = require('./twitter');
const fetch = require('node-fetch');

module.exports = {
  goGIF: async (tweet) => {
    console.log('go gif');
    const term = random(gifTerms);
    console.log(`GIF search: ${term}`);
    const url = `https://g.tenor.com/v1/search?q=${term}&key=${process.env.TENOR_KEY}&Filter=high&Locale=en_US&MediaFilter=minimal`;
    console.log(url);
    const res = await fetch(url);
    const json = await res.json();
    const gifs = json.results;
    console.log(`Found ${gifs.length} gifs.`);
    let gif = random(gifs);
    console.log(gif.title);
    let gif_url = gif.media[0].gif.url;
    const size = gif.media[0].gif.size;
    console.log(size);
    if (size >= 5000000) {
      console.log('too large, switching to tiny gif');
      gif_url = gif.media[0].tinygif.url;
    }
    let media = {
      url: gif_url,
      alt_text: term + ' ' + gif.title,
    };
    await tweetMedia([media], '', tweet.id_str);
  },
};
