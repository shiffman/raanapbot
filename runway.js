// const rw = require('@runwayml/hosted-models');
const fetch = require('node-fetch');
const { random } = require('./util');

const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

// const hottake_url =
//   'https://api-inference.huggingface.co/models/shiffman/gpt-neo-1.3B-raanapbot-hot-takes-2022';
// const model_url =
//   'https://api-inference.huggingface.co/models/shiffman/gpt-neo-1.3B-raanapbot-ideas-2022';
// const til_url =
//   'https://api-inference.huggingface.co/models/shiffman/gpt-neo-1.3B-raanapbot-til-2022';

const models = {
  hottake: 'shiffman/gpt-neo-1.3B-raanapbot-hot-takes-2022',
  mailbag: 'shiffman/gpt-neo-1.3B-raanapbot-ideas-2022',
  til: 'shiffman/gpt-neo-1.3B-raanapbot-til-2022',
};

module.exports = {
  generateCatchPhrase: async () => {
    const completion = await openai.createCompletion({
      model: 'curie:ft-itp-2022-09-22-20-01-19',
      prompt: '',
      n: 5,
      max_tokens: 64,
      stop: ' <end>',
    });
    const options = completion.data.choices;
    const choices = [];
    for (let choice of options) {
      choices.push(options.text.trim());
    }
    return choices;
  },
  generateRunway: async (prompt, num = 1, model = 'mailbag') => {
    // let seed = Math.floor(Math.random() * 1000);
    // let top_p = 0.9;
    // const inputs = {
    //   prompt: prompt,
    //   max_characters: 1000,
    //   top_p: top_p,
    //   seed: seed,
    // };

    console.log(`prompt: ${prompt}`);
    console.log(num);
    const data = {
      inputs: prompt,
      parameters: {
        max_length: 120,
        return_full_text: true,
        top_p: 0.9,
        temperature: 0.95,
        num_return_sequences: num,
        do_sample: true,
      },
      options: {
        use_gpu: false,
        use_cache: false,
        wait_for_model: true,
      },
    };

    if (Math.random() < 0.1) {
      let keys = Object.keys(models);
      model = random(keys);
      console.log('randomizing model!');
    }
    let url = `https://api-inference.huggingface.co/models/${models[model]}`;
    console.log(url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
      },
      method: 'POST',
      body: JSON.stringify(data),
    });
    const results = await response.json();
    console.log(results);

    if (results.error) {
      return { error: results.error };
    }

    const choices = [];
    for (let i = 0; i < results.length; i++) {
      let result = results[i].generated_text;
      console.log(`original: ${result}`);
      result = result.replace(/<br>/g, '\n');
      result = result.replace(/\n+/g, '\n');

      console.log(`replace line breaks: ${result}`);
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
      choices.push(result);
    }
    if (choices.length > 1) return choices;
    else return choices[0];
  },
  generateOPENAI: async (prompt, num = 1) => {
    console.log(`prompt: ${prompt}`);
    console.log(num);
    const options = {
      // model: 'curie:ft-itp:keev-answers-2022-10-27-15-41-45',
      model: 'davinci:ft-itp:keev-answers-2022-10-27-17-38-28',
      prompt: prompt + ' ->',
      temperature: 0.99,
      n: num,
      max_tokens: 64,
      stop: '\n',
    };
    console.log(options);
    const completion = await openai.createCompletion(options);
    const outputs = completion.data;
    const choices = [];
    for (let i = 0; i < outputs.choices.length; i++) {
      let result = outputs.choices[i].text;
      console.log(result);
      // Splitting up and shortening the total number of sections
      choices.push(result);
    }
    if (choices.length > 1) return choices;
    else return choices[0];
  },
};
