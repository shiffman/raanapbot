const fetch = require('node-fetch');
const { random, pickYear } = require('./util');
const { tweetMedia, tweetIt } = require('./twitter');
const fs = require('fs');

const data = fs.readFileSync('tv_small.json', 'utf-8');
const allShows = JSON.parse(data).shows;

const moviedb_url = `https://api.themoviedb.org/3`;
const moviedb_image_url = `https://image.tmdb.org/t/p/w1280/`;
const KEY = process.env.MOVIEDBKEY;

async function getShow() {
  let show = random(allShows);
  let id = show.id;
  let url = `${moviedb_url}/tv/${id}/season/3/episode/7?api_key=${KEY}`;
  let response = await fetch(url);
  let episode = await response.json();
  const { name, poster_path } = show;
  if (episode.success === false) {
    return;
  } else {
    return { show, episode };
  }
}

module.exports = {
  crappyMovieDiaper: async () => {
    let year = pickYear();
    let votes = Math.floor(Math.random() * 250 + 1);
    const KEY = process.env.MOVIEDBKEY;
    let url = `${moviedb_url}/discover/movie?api_key=${KEY}&include_adult=false`;
    url += `&vote_count.gte=${votes}`;
    if (Math.random(1) < 0.9) {
      url += `&with_original_language=en`;
    }
    url += `&primary_release_year=${year}`;
    url += `&sort_by=popularity.asc`;
    url += `&vote_average.lte=6`;
    let response = await fetch(url);
    let json = await response.json();
    let movie = random(json.results);

    if (json.results.length > 0) {
      let out = `Crappy Movie Diaper: ${movie.original_title}\n`;
      out += `Rob and Akiva watch the ${year} movie ${movie.original_title}: ${movie.overview}`;
      console.log(out);
      while (out.length > 280) {
        let sentences = out.split(/([:.?!])/);
        sentences.splice(sentences.length - 3, 3);
        out = sentences.join('');
      }
      if (movie.poster_path) {
        let url = {
          url: `${moviedb_image_url}${movie.poster_path}`,
          alt_text: `${movie.original_title} poster`,
        };
        await tweetMedia([url], out);
      } else {
        await tweetIt(out);
      }
      return true;
    } else {
      return null;
    }
  },

  s3e7: async () => {
    let result = await getShow();
    while (result === undefined) {
      result = await getShow();
    }
    const { show, episode } = result;
    let out = `${show.name}\n`;
    out += `Rob and Akiva watch S3E7 of ${show.name} entitled “${episode.name}” `;

    let d = new Date(`${episode.air_date} EST`);
    out += `(aired ${d.toLocaleDateString()})`;
    if (episode.overiew) {
      out += `: ${episode.overview}`;
    }
    console.log(out);
    while (out.length > 280) {
      let sentences = out.split(/([.?!])/);
      sentences.splice(sentences.length - 3, 3);
      out = sentences.join('');
    }
    console.log(out);
    let urls = [];
    if (show.poster_path) {
      urls.push({
        url: `${moviedb_image_url}${show.poster_path}`,
        alt_text: `${show.name} poster`,
      });
    } else {
      console.log('no poster');
    }
    if (episode.still_path) {
      urls.push({
        url: `${moviedb_image_url}${episode.still_path}`,
        alt_text: `${show.name} still from episode ${episode.name}`,
      });
    } else {
      console.log('no still');
    }
    await tweetMedia(urls, out);
    // fs.writeFileSync('s3e7.json', JSON.stringify(episode, null, 2));
  },
};
