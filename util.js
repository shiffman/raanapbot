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
    let lines = txt.split(/([?!.\n]+)/g);
    lines = lines.filter((s) => s.length > 0);
    let tweet = '';
    while (lines.length > 0) {
      let next = lines[0] + lines[1];
      let len = tweet.length + next.length;
      if (len < 280) {
        tweet += next;
        lines.splice(0, 2);
        if (lines.length == 0) {
          thread.push(tweet.trim());
          break; // This is redundant but just in case
        }
      } else {
        thread.push(tweet.trim());
        tweet = '';
      }
    }
    return thread;
  },
};
