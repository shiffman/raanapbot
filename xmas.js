const fs = require('fs');
const all = fs.readFileSync('songs/all.txt', 'utf-8');
const songs = all.split(/\n{3,}/);
console.log(songs.length);
let i = 0;
for (let song of songs) {
  fs.writeFileSync(`songs/song${i}.txt`, song);
  i++;
}

// const fetch = require('node-fetch');
// const rw = require('@runwayml/hosted-models');
// require('dotenv').config();

// const model = new rw.HostedModel({
//   url: process.env.RUNWAY_URL,
//   token: process.env.RUNWAY_TOKEN,
// });

// let prompt = process.argv.slice(2).join(' ');
// generateRunway(prompt);

// async function generateRunway(prompt) {
//   let seed = Math.floor(Math.random() * 1000);
//   let top_p = 0.9;
//   const inputs = {
//     prompt: prompt,
//     max_characters: 1000,
//     top_p: top_p,
//     seed: seed,
//   };
//   const outputs = await model.query(inputs);
//   let result = outputs.generated_text;
//   console.log(`${result}`);
// }
