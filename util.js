// Utility functions
module.exports = {
  random: (arr) => {
    let i = Math.floor(Math.random() * arr.length);
    return arr[i];
  },

  sleep: (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  pickYear: () => {
    let years = [];
    let sum = 0;
    for (let year = 1874; year < 2022; year++) {
      let num = year - 1873;
      let prob = Math.pow(num, 3);
      years.push({ year, prob });
      sum += prob;
    }
    for (let i = 0; i < years.length; i++) {
      years[i].prob /= sum;
    }

    let index = 0;
    let r = Math.random();
    while (r > 0) {
      r = r - years[index].prob;
      index++;
    }
    index--;
    let year = years[index].year;
    return year;
  },

  threadIt: (txt) => {
    let thread = [];
    let total = Math.floor(txt.length / 270) + 1;
    let words = txt.split(' ');
    let len = Math.floor(words.length / total);
    let first = true;
    while (words.length > 0) {
      let tweet = '...' + words.join(' ').trim();
      if (tweet.length <= 280) {
        words = [];
      } else {
        tweet = words.splice(0, len).join(' ').trim();
        if (!first) tweet = '...' + tweet;
        if (first) first = false;
        if (words.length > 0) tweet += '...';
      }
      thread.push(tweet);
    }
    return thread;
  },
};
