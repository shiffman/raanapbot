// import fetch from 'node-fetch';
// import dotenv from 'dotenv';

const fetch = require('node-fetch');
require('dotenv').config();

const fs = require('fs');

let output = '';
go();
async function go() {
  for (let i = 0; i < 20; i++) {
    await generate();
  }
  fs.writeFileSync(`generated_takes_${Date.now()}.csv`, output);
}

async function generate() {
  const { choices } = await queryOpenAI('');
  if (!choices) {
    console.log('failed attempt');
    return;
  }
  for (let take of choices) {
    take.text = take.text.replace(/\/n+/g, ' ');
    take.text = take.text.replace(/\/r+/g, ' ');
    output += take.text;
    output += '\n';
  }
  // fs.writeFileSync(`generated_takes_${Date.now()}.csv`, output);
}

async function queryOpenAI(prompt) {
  let temp = Math.random() * 0.3 + 0.7;
  const postData = {
    prompt: prompt,
    max_tokens: 128,
    temperature: temp,
    stop: ' <end>',
    best_of: 10,
    n: 5,
  };
  const models = [
    'davinci:ft-itp-2022-07-01-12-24-09',
    'davinci:ft-itp-2022-06-29-00-48-22',
    'curie:ft-itp-2022-06-29-00-27-35',
    'davinci:ft-itp-2022-07-01-13-03-29',
  ];
  const r = Math.floor(Math.random() * models.length);
  const response = await fetch(
    `https://api.openai.com/v1/engines/${models[r]}/completions`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_SECRET_KEY}`,
      },
      method: 'POST',
      body: JSON.stringify(postData),
    }
  );
  const result = await response.json();
  console.log(result);
  return result;
}
