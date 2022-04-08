// const rw = require('@runwayml/hosted-models');
const fetch = require('node-fetch');

const model_url =
  'https://api-inference.huggingface.co/models/shiffman/gpt-neo-1.3B-raanapbot-2022';

// const model = new rw.HostedModel({
//   url: process.env.RUNWAY_URL,
//   token: process.env.RUNWAY_TOKEN,
// });

module.exports = {
  generateRunway: async (prompt) => {
    // let seed = Math.floor(Math.random() * 1000);
    // let top_p = 0.9;
    // const inputs = {
    //   prompt: prompt,
    //   max_characters: 1000,
    //   top_p: top_p,
    //   seed: seed,
    // };

    console.log(`prompt: ${prompt}`);
    const data = {
      inputs: prompt,
      parameters: {
        max_length: 60,
        return_full_text: true,
        top_p: 0.9,
        temperature: 1.0,
        num_return_sequences: 1,
      },
      options: {
        use_gpu: false,
        use_cache: false,
        wait_for_model: true,
      },
    };
    const response = await fetch(model_url, {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
      },
      method: 'POST',
      body: JSON.stringify(data),
    });
    const results = await response.json();
    const result = results[0].generated_text;
    console.log(`original: ${result}`);
    // Splitting up and shortening the total number of sections
    if (result.length > 280) {
      console.log('shortening');
      let regex = /([.\n?!]+)/g;
      let sentences = result.split(regex);
      let len = sentences.length - 1;
      // always removed the extra last bit
      sentences.splice(len, 1);
      result = sentences.join('');
      len /= 2;
      if (len > 2) {
        console.log(sentences);
        let r = Math.floor(Math.random() * (len - 2) + 3) * 2;
        console.log(r);
        sentences.splice(r, sentences.length - r);
      }
      result = sentences.join('');
      console.log(`modified: ${result}`);
    }

    // TODO IMPROVE: This just gives rid of one stray quote
    let quotes = result.match(/"/g);
    if (quotes && quotes.length === 1) {
      result = result.replace(/"/, '');
    }
    return result;
  },
};
