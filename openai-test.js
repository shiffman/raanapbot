const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const fs = require('fs');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

go();

async function go() {
  const completion = await openai.createCompletion({
    model: 'curie:ft-itp-2022-09-22-20-01-19',
    prompt: '',
    n: 100,
    max_tokens: 64,
    stop: ' <end>',
  });

  const output = [];
  const choices = completion.data.choices;
  for (let choice of choices) {
    output.push(choice.text);
    console.log(choice.text);
  }
  fs.writeFileSync(`catchphrases/${Date.now()}.txt`, output.join('\n'));
}
