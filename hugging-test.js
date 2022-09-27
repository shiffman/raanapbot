const fetch = require('node-fetch');
require('dotenv').config();

const model_url =
  'https://api-inference.huggingface.co/models/shiffman/gpt-neo-1.3B-raanapbot-ideas-2022';

go();

async function go() {
  const data = {
    inputs: 'Hello Hugging Face',
    parameters: {
      max_length: 120,
      return_full_text: true,
      top_p: 0.9,
      temperature: 0.95,
      num_return_sequences: 1,
      do_sample: true,
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
  console.log(results);

  if (results.error) {
    return { error: results.error };
  }
}
