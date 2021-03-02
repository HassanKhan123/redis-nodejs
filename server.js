const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const app = express();

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.port || 6379;

const client = redis.createClient(REDIS_PORT);

const setResponse = (username, repos) => {
  return `
        <h2>${username} has ${repos} Github repos</h2>
    `;
};

const cache = async (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;
    if (data) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

const getRepos = async (req, res, next) => {
  try {
    console.log('Fetching data');
    const { username } = req.params;

    const response = await fetch(`http://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    console.error(error);
    res.status(5000);
  }
};

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
