const express = require('express')
const path = require('path')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'twitterClone.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000`)
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

initializeDBAndServer()

// Register API
app.post('/register/', async (req, res) => {
  const {username, password, name, gender} = req.body
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(checkUserQuery)

  if (dbUser !== undefined) {
    res.status(400)
    res.send('User already exists')
  } else {
    if (password.length < 6) {
      res.status(400)
      res.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log(hashedPassword)
      const query1 = `INSERT INTO user (username,password,name,gender) VALUES('${username}','${hashedPassword}','${name}','${gender}');`
      await db.run(query1)
      res.status(200)
      res.send('User created successfully')
    }
  }
})

// Login API
app.post('/login/', async (req, res) => {
  const {username, password} = req.body
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(checkUserQuery)

  if (dbUser === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
        userId: dbUser.user_id,
      }
      const jwtToken = jwt.sign(payload, 'SECRET')
      res.send({jwtToken})
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

// Authenticate Middle Function
const authenticate = (req, res, next) => {
  let jwtToken
  const authHeader = req.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    res.status(401)
    res.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'SECRET', async (error, payload) => {
      if (error) {
        res.status(401)
        res.send('Invalid JWT Token')
      } else {
        req.username = payload.username
        req.userId = payload.userId
        next()
      }
    })
  }
}

// API 3
app.get('/user/tweets/feed/', authenticate, async (req, res) => {
  const {userId} = req
  const query3 = `SELECT user.username, tweet.tweet, tweet.date_time AS dateTime FROM follower INNER JOIN tweet
    ON follower.following_user_id = tweet.user_id
  INNER JOIN user
  ON tweet.user_id = user.user_id
  WHERE
  follower.follower_user_id = ${userId}
  ORDER BY
  tweet.date_time DESC
  LIMIT 4;`
  const dbArray = await db.all(query3)
  console.log(dbArray)
  res.send(dbArray)
})

// API 4
app.get('/user/following/', authenticate, async (req, res) => {
  const {userId} = req
  const query4 = `SELECT u.name
    FROM follower f
    INNER JOIN user u ON f.following_user_id = u.user_id
    WHERE f.follower_user_id = ${userId}`
  const dbArray = await db.all(query4)
  res.send(dbArray)
})

// API 5
app.get('/user/followers/', authenticate, async (req, res) => {
  const {userId} = req
  const query5 = ` SELECT u.name, u.username
    FROM follower f
    INNER JOIN user u ON f.following_user_id = u.user_id
    WHERE f.follower_user_id = ${userId};`
  const dbArray = await db.all(query5)
  res.send(dbArray)
})

// API 6
app.get('/tweets/:tweetId/', authenticate, async (req, res) => {
  const {tweetId} = req.params
  const {userId} = req
  const query6 = `SELECT t.tweet as tweet, 
           (SELECT COUNT(*) FROM \`like\` WHERE tweet_id = t.tweet_id) AS likes,
           (SELECT COUNT(*) FROM reply WHERE tweet_id = t.tweet_id) AS replies, 
           t.date_time as dateTime
    FROM follower f
    INNER JOIN tweet t ON f.following_user_id = t.user_id
    WHERE f.follower_user_id = ${userId} AND t.tweet_id = ${tweetId};
  `
  const results = await db.all(query6)
  if (results.length === 0) {
    res.status(401)
    res.send('Invalid Request')
  } else {
    res.send(results)
  }
})

//API 7
app.get('/tweets/:tweetId/likes/', authenticate, async (req, res) => {
  const {tweetId} = req.params
  const {userId} = req
  const query6 = `SELECT (SELECT COUNT(*) FROM \`like\` WHERE tweet_id = ${tweetId}) AS likes
      FROM \`like\` l
      INNER JOIN user u ON l.user_id = u.user_id
      WHERE l.tweet_id = ${tweetId};`
  const results = await db.all(query6)
  if (results.length === 0) {
    res.status(401)
    res.send('Invalid Request')
  } else {
    res.send(results)
  }
})

//API 8
app.get('/tweets/:tweetId/replies/', authenticate, async (req, res) => {
  const {tweetId} = req.params
  const {userId} = req
  const query6 = `SELECT u.name, r.reply
      FROM reply r
      INNER JOIN user u ON r.user_id = u.user_id
      WHERE r.tweet_id = ${tweetId};`
  const results = await db.all(query6)
  const replies = results.map(reply => ({
    name: reply.name,
    reply: reply.reply,
  }))

  if (replies.length === 0) {
    res.status(401)
    res.send('Invalid Request')
  } else {
    res.json({replies})
  }
})

// API 9
app.get('/user/tweets/', authenticate, async (req, res) => {
  const {userId} = req
  const query9 = `SELECT tweet,
  (SELECT COUNT(like_id)
  FROM like
  WHERE tweet_id=tweet.tweet_id) AS likes,
  (SELECT COUNT(reply_id)
  FROM reply
  WHERE tweet_id=tweet.tweet_id) AS replies,
  date_time AS dateTime
  FROM tweet
  WHERE user_id= ${userId};`

  const tweets = await db.all(query9)
  res.send(tweets)
})

// API 10
app.post('/user/tweets/', authenticate, async (req, res) => {
  const {tweet} = req.headers
  const query10 = `INSERT INTO tweet (tweet) VALUES('${tweet}');`
  await db.run(query10)
  res.status(200)
  res.send('Created a Tweet')
})

//API 11
app.delete('/tweets/:tweetId/', authenticate, async (req, res) => {
  const {tweetId} = req.params
  const {userId} = req
  const query = `SELECT user_id,tweet_id FROM tweet WHERE tweet_id=${tweetId};`
  const dbArray = await db.get(query)
  console.log(dbArray)
  console.log(userId)
  if (dbArray.user_id === userId) {
    const query11 = `DELETE FROM tweet WHERE tweet_id=${tweetId};`
    await db.run(query11)
    res.send('Tweet Removed')
  } else {
    res.status(401)
    res.send('Invalid Request')
  }
})

module.exports = app
