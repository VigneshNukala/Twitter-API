# Twitter APi

Given an `app.js` file and a database file `twitterClone.db` consisting of five tables `user`, `follower`, `tweet`, `reply`, and `like`.

Write APIs to perform operations on the tables `user`, `follower`, `tweet`, `reply`, and `like` containing the following columns,

**User Table**

| Column   | Type    |
| -------- | ------- |
| user_id  | INTEGER |
| name     | TEXT    |
| username | TEXT    |
| password | TEXT    |
| gender   | TEXT    |

**Follower Table**

| Column              | Type    |
| ------------------- | ------- |
| `follower_id`       | INTEGER |
| `follower_user_id`  | INTEGER |
| `following_user_id` | INTEGER |

Here, if user1 follows user2 then,

`follower_user_id` is the user ID of user1 and `following_user_id` is the user ID of user2.

**Tweet Table**

| Column    | Type     |
| --------- | -------- |
| tweet_id  | INTEGER  |
| tweet     | TEXT     |
| user_id   | INTEGER  |
| date_time | DATETIME |

**Reply Table**

| Column    | Type     |
| --------- | -------- |
| reply_id  | INTEGER  |
| tweet_id  | INTEGER  |
| reply     | TEXT     |
| user_id   | INTEGER  |
| date_time | DATETIME |

**Like Table**

| Column    | Type     |
| --------- | -------- |
| like_id   | INTEGER  |
| tweet_id  | INTEGER  |
| user_id   | INTEGER  |
| date_time | DATETIME |

#### Sample Valid User Credentials

#User Details

```
{
  "username":"JoeBiden",
  "password":"biden@123"
}
```

Use `npm install` to install the packages.

**Use Common JS module syntax.**
