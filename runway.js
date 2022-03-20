const rw = require('@runwayml/hosted-models');

const model = new rw.HostedModel({
  url: process.env.RUNWAY_URL,
  token: process.env.RUNWAY_TOKEN,
});

module.exports = {
  generateRunway: async (prompt) => {
    let seed = Math.floor(Math.random() * 1000);
    let top_p = 0.9;
    const inputs = {
      prompt: prompt,
      max_characters: 1000,
      top_p: top_p,
      seed: seed,
    };

    console.log(`prompt: ${prompt}`);

    try {
      const outputs = await model.query(inputs);
      let result = outputs.generated_text;
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
    } catch (e) {
      console.log(e);
      return '';
    }
  },
};
