const Redis = require("koa-redis");
const config = require('../config');
const redis = new Redis({
  host: config.heroku[process.env.NODE_ENV].host,
  port: config.heroku[process.env.NODE_ENV].port,
  password: process.env.NODE_ENV === 'production' ? process.env.PASSWORD : '',
});

async function register (ctx) {
  const { name } = ctx.request.body;
  const keys = await redis.client.keys('*');
  let values;
  if (keys.length) {
    values = await redis.client.mget(keys);
    const names = values.map(value => {
      try {
        return JSON.parse(value).name;
      } catch (e) {
        ctx.throw(501)
      }
    });
    if (names.includes(name)) {
      ctx.throw(409, `name ${name} already exist`);
    } else {
      ctx.session.name = name;
      ctx.status = 201;
    }
  } else {
    ctx.session.name = name;
    ctx.status = 201;
  }
}

async function auth (ctx) {
  if (!ctx.cookies.get("sid")) {
    ctx.throw(401);
  }
  const infoStr = await redis.client.get(`koa:sess:${ctx.cookies.get("sid")}`);
  if (infoStr) {
    try {
      ctx.body = JSON.parse(infoStr)
    } catch (e) {
      ctx.throw(501)
    }
  } else {
    ctx.throw(404)
  }
}


module.exports = {
  auth,
  register,
}