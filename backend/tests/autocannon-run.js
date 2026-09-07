const autocannon = require('autocannon');

autocannon({
  url: process.env.TARGET_URL || 'http://backend:8080/',
  duration: 3
}, (err, results) => {
  if (err) console.error(err);
  console.log(results);
});
