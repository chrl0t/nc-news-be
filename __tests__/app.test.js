process.env.NODE_ENV = 'test';
const app = require('../app');
const request = require('supertest');
const connection = require('../db/connection');

describe('/api', () => {
  afterAll(() => {
    return connection.destroy();
  });
  beforeEach(() => {
    return connection.seed.run();
  });
  test('ERROR - status code 404 - if passed invalid path', () => {
    const methods = ['get', 'post', 'delete', 'patch'];
    const requestPromises = methods.map((method) => {
      return request(app)
        [method]('/nonExistentURL')
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).toBe('NOT FOUND');
        });
    });
    return Promise.all(requestPromises);
  });
  describe('/topics', () => {
    test('GET - status code 200 - return all the topics in the database', () => {
      return request(app)
        .get('/api/topics')
        .expect(200)
        .then(({ body }) => {
          expect(body.topics).toEqual(expect.any(Array));
          expect(body.topics.length).toBe(3);
        });
    });
    test('POST - status code 201 - creates a new topic', () => {
      return request(app)
        .post('/api/topics')
        .send({
          slug: 'The best food in the world',
          description: 'pizza',
        })
        .expect(201)
        .then((res) => {
          let topic = res.body[0];
          expect(topic.slug).toEqual('The best food in the world');
          expect(topic.description).toEqual('pizza');
          return request(app).get('/api/topics');
        })
        .then((res) => {
          expect(res.body.topics.length).toBe(4);
        });
    });
    test('POST ERROR - status code 400 - when new topic is missing information', () => {
      return request(app)
        .post('/api/topics')
        .send({ description: 'dogs' })
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({ msg: 'MISSING INFO' });
        });
    });
    test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
      const invalidMethods = ['delete', 'patch'];
      const methodPromises = invalidMethods.map((method) => {
        return request(app)
          [method]('/api/topics')
          .expect(405)
          .then(({ body }) => {
            expect(body.msg).toBe('INVALID METHOD');
          });
      });
      return Promise.all(methodPromises);
    });
  });
  describe('/users', () => {
    test('GET - status code 200 - returns all users in the database', () => {
      return request(app)
        .get('/api/users')
        .expect(200)
        .then((res) => {
          expect(res.body.users).toEqual(expect.any(Array));
          expect(res.body.users.length).toBe(4);
        });
    });
    test('POST - status code 201 - creates a new user', () => {
      return request(app)
        .post('/api/users')
        .send({
          username: 'chrl0t',
          name: 'charlotte',
          avatar_url:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Lil%27_Pound_Cake.jpg/300px-Lil%27_Pound_Cake.jpg',
        })
        .expect(201)
        .then((res) => {
          let newUser = res.body.user[0];
          expect(newUser.username).toEqual('chrl0t');
        })
        .then((res) => {
          return request(app)
            .get('/api/users')
            .then((res) => {
              expect(res.body.users.length).toBe(5);
            });
        });
    });
    test('POST ERROR - status code 400 - when new user is missing information', () => {
      return request(app)
        .post('/api/users')
        .send({
          name: 'charlotte',
          avatar_url:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Lil%27_Pound_Cake.jpg/300px-Lil%27_Pound_Cake.jpg',
        })
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({ msg: 'MISSING INFO' });
        });
    });
    test('POST ERROR - status code 400 - when new user username is not unique', () => {
      return request(app)
        .post('/api/users')
        .send({
          username: 'butter_bridge',
          name: 'charlotte',
          avatar_url:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Lil%27_Pound_Cake.jpg/300px-Lil%27_Pound_Cake.jpg',
        })
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({ msg: 'USERNAME ALREADY EXISTS' });
        });
    });
    test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
      const invalidMethods = ['delete', 'patch'];
      const methodPromises = invalidMethods.map((method) => {
        return request(app)
          [method]('/api/users')
          .expect(405)
          .then(({ body }) => {
            expect(body.msg).toBe('INVALID METHOD');
          });
      });
      return Promise.all(methodPromises);
    });
    describe('/users/:username', () => {
      test('GET - status code 200 - returns user matching passed username', () => {
        return request(app)
          .get('/api/users/butter_bridge')
          .expect(200)
          .then((res) => {
            expect(res.body.user.length).toBe(1);
            expect(res.body.user[0]).toEqual({
              username: 'butter_bridge',
              name: 'jonny',
              avatar_url:
                'https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg',
            });
          });
      });
      test('GET ERROR - status code 404 - when username doesnt exist', () => {
        return request(app)
          .get('/api/users/this_is_not_a_username')
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
        const invalidMethods = ['post', 'delete', 'patch'];
        const methodPromises = invalidMethods.map((method) => {
          return request(app)
            [method]('/api/users/butter_bridge')
            .expect(405)
            .then(({ body }) => {
              expect(body.msg).toBe('INVALID METHOD');
            });
        });
        return Promise.all(methodPromises);
      });
    });
  });
  describe('/articles', () => {
    test('GET - status code 200 - returns all the articles in the database sorted in descending order by date', () => {
      return request(app)
        .get('/api/articles')
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).toEqual(expect.any(Array));
          expect(body.articles.length).toBe(12);
          expect(body.articles).toBeSortedBy('created_at', {
            descending: true,
          });
        });
    });
    test('GET - status code 200 - return all the articles, sorted in descending order by whatever is passed into the query', () => {
      return request(app)
        .get('/api/articles?sort_by=votes')
        .expect(200)
        .then((res) => {
          expect(res.body.articles).toBeSortedBy('votes', {
            descending: true,
          });
        });
    });
    test('GET - status code 200 - returns all the articles, sorted in whichever order is passed by whatever is passed into the query', () => {
      return request(app)
        .get('/api/articles?sort_by=votes&order=asc')
        .expect(200)
        .then((res) => {
          expect(res.body.articles).toBeSortedBy('votes');
        });
    });
    test('GET - status code 200 - returns all articles filtered by author', () => {
      return request(app)
        .get('/api/articles?author=butter_bridge')
        .expect(200)
        .then((res) => {
          let articles = res.body.articles;
          expect(articles[0].author).toEqual('butter_bridge');
          expect(articles[1].author).toEqual('butter_bridge');
          expect(articles[2].author).toEqual('butter_bridge');
          expect(articles.length).toBe(3);
        });
    });
    test('GET - status code 200 - returns all articles filtered by topic', () => {
      return request(app)
        .get('/api/articles?topic=cats')
        .expect(200)
        .then((res) => {
          let articles = res.body.articles;
          expect(articles[0].topic).toEqual('cats');
          expect(articles.length).toBe(1);
        });
    });
    test('GET - status code 200 - can return articles filtered by both author and topic', () => {
      return request(app)
        .get('/api/articles?author=rogersop&topic=cats')
        .expect(200)
        .then((res) => {
          let articles = res.body.articles;
          expect(articles[0].author).toEqual('rogersop');
          expect(articles[0].topic).toEqual('cats');
          expect(articles.length).toBe(1);
        });
    });
    test('GET - status code 200 - returns articles filtered by a limit query', () => {
      return request(app)
        .get('/api/articles?limit=5')
        .then((res) => {
          let articles = res.body.articles;
          expect(articles.length).toBe(5);
        });
    });
    test('GET ERROR - status code 400 - when passed an invalid sort by column', () => {
      return request(app)
        .get('/api/articles?sort_by=colour')
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({ msg: 'BAD REQUEST' });
        });
    });
    test('POST - status code 201 - creates an article and returns new article', () => {
      return request(app)
        .post('/api/articles')
        .send({
          title: 'Why hairless cats are the best',
          topic: 'cats',
          author: 'rogersop',
          body: 'No allergies!',
          created_at: '2018-11-15T12:21:54.000Z',
        })
        .expect(201)
        .then((res) => {
          let article = res.body[0];
          expect(article.author).toEqual('rogersop');
          expect(article.title).toEqual('Why hairless cats are the best');
          return request(app).get('/api/articles');
        })
        .then((res) => {
          expect(res.body.articles.length).toBe(13);
        });
    });
    test('POST ERROR - status code 400 - when new article is missing information', () => {
      return request(app)
        .post('/api/articles')
        .send({
          topic: 'cats',
          author: 'rogersop',
          body: 'No Allergies!',
          created_at: '2018-11-15T12:21:54.000Z',
        })
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({ msg: 'MISSING INFO' });
        });
    });
    test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
      const invalidMethods = ['delete', 'patch'];
      const methodPromises = invalidMethods.map((method) => {
        return request(app)
          [method]('/api/articles')
          .expect(405)
          .then(({ body }) => {
            expect(body.msg).toBe('INVALID METHOD');
          });
      });
      return Promise.all(methodPromises);
    });
    describe('/articles/:article_id', () => {
      test('GET - status code 200 - returns article matching passed id with a comment_count', () => {
        return request(app)
          .get('/api/articles/1')
          .expect(200)
          .then((res) => {
            expect(res.body.article.length).toBe(1);
            expect(res.body.article[0]).toEqual({
              article_id: 1,
              title: 'Living in the shadow of a great man',
              author: 'butter_bridge',
              body: 'I find this existence challenging',
              topic: 'mitch',
              created_at: '2018-11-15T12:21:54.000Z',
              votes: 100,
              comment_count: '13',
            });
          });
      });
      test('GET ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .get('/api/articles/10000000')
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('GET ERROR - status code 400 - when passed article id is invalid', () => {
        return request(app)
          .get('/api/articles/two')
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('PATCH - status code 200 - will update the vote count and return the updated article', () => {
        return request(app)
          .patch('/api/articles/1')
          .send({ inc_votes: 10 })
          .expect(200)
          .then((res) => {
            expect(res.body.article[0]).toEqual({
              article_id: 1,
              title: 'Living in the shadow of a great man',
              author: 'butter_bridge',
              body: 'I find this existence challenging',
              topic: 'mitch',
              created_at: '2018-11-15T12:21:54.000Z',
              votes: 110,
            });
          });
      });
      test('PATCH ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .patch('/api/articles/10000000')
          .send({ inc_votes: 10 })
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('PATCH ERROR - status code 400 - when passed article id is invalid', () => {
        return request(app)
          .patch('/api/articles/two')
          .send({ inc_votes: 10 })
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('DELETE - status code 204 - deletes the requested article', () => {
        return request(app)
          .delete('/api/articles/1')
          .expect(204)
          .then((res) => {
            return request(app).get('/api/articles');
          })
          .then((res) => {
            expect(res.body.articles.length).toBe(11);
          });
      });
      test('DELETE ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .delete('/api/articles/10000000')
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('POST - status code 201 - creates a comment for an article and returns new comment', () => {
        return request(app)
          .post('/api/articles/1')
          .send({ author: 'butter_bridge', body: 'Have a capachoochoo on me' })
          .expect(201)
          .then((res) => {
            let comment = res.body.newComment[0];
            expect(comment.author).toEqual('butter_bridge');
            expect(comment.body).toEqual('Have a capachoochoo on me');
          });
      });
      test('POST ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .post('/api/articles/100000000')
          .send({ author: 'butter_bridge', body: 'Have a capachoochoo on me' })
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('POST ERROR - status code 400 - when passed article id is invalid', () => {
        return request(app)
          .post('/api/articles/this_is_not_a_number')
          .send({ author: 'butter_bridge', body: 'Have a capachoochoo on me' })
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('POST ERROR - status code 400 - when passed comment is missing information', () => {
        return request(app)
          .post('/api/articles/2')
          .send({ author: 'butter_bridge' })
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'MISSING INFO' });
          });
      });
    });
    describe('/articles/:article_id/comments', () => {
      test('GET - status code 200 - returns all comments that match the passed article id, sorted in descending order by created_at', () => {
        return request(app)
          .get('/api/articles/1/comments')
          .expect(200)
          .then((res) => {
            expect(res.body.comments).toEqual(expect.any(Array));
            expect(res.body.comments.length).toEqual(13);
            expect(res.body.comments).toBeSortedBy('created_at', {
              descending: true,
            });
          });
      });
      test('GET - status code 200 - returns all comments that match the passed id, sorted in descending order by whatever is passed into the query', () => {
        return request(app)
          .get('/api/articles/1/comments?sort_by=votes')
          .expect(200)
          .then((res) => {
            expect(res.body.comments).toBeSortedBy('votes', {
              descending: true,
            });
          });
      });
      test('GET - status code 200 - returns all comments that match the passed id, sorted in passed order by whatever is passed into the query', () => {
        return request(app)
          .get('/api/articles/1/comments?sort_by=votes&order=asc')
          .expect(200)
          .then((res) => {
            expect(res.body.comments).toBeSortedBy('votes');
          });
      });
      test('GET - status code 200 - returns all the comments filtered by a limit query', () => {
        return request(app)
          .get('/api/articles/1/comments?limit=5')
          .expect(200)
          .then((res) => {
            expect(res.body.comments.length).toBe(5);
          });
      });
      test('GET ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .get('/api/articles/1000000000/comments')
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('GET ERROR - status code 400 - when passed article id is invalid', () => {
        return request(app)
          .get('/api/articles/not_a_number/comments')
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
        const invalidMethods = ['delete', 'patch'];
        const methodPromises = invalidMethods.map((method) => {
          return request(app)
            [method]('/api/articles/1/comments')
            .expect(405)
            .then(({ body }) => {
              expect(body.msg).toBe('INVALID METHOD');
            });
        });
        return Promise.all(methodPromises);
      });
    });
  });
  describe('/comments', () => {
    describe('/comments/:comment_id', () => {
      test('PATCH - status code 200 - will update the vote count and return the updated comment', () => {
        return request(app)
          .patch('/api/comments/2')
          .send({ inc_votes: 10 })
          .expect(200)
          .then((res) => {
            expect(res.body.comment[0]).toEqual({
              comments_id: 2,
              author: 'butter_bridge',
              article_id: 1,
              votes: 24,
              created_at: '2016-11-22T12:36:03.000Z',
              body:
                'The beautiful thing about treasure is that it exists. Got to find out what kind of sheets these are; not cotton, not rayon, silky.',
            });
          });
      });
      test('PATCH ERROR - status code 404 - when passed article id doesnt exist', () => {
        return request(app)
          .patch('/api/comments/1000000')
          .send({ inc_votes: 10 })
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('PATCH ERROR - status code 400 - when passed article id is invalid', () => {
        return request(app)
          .patch('/api/comments/two')
          .send({ inc_votes: 10 })
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('PATCH ERROR - status code 400 - when value passed into patch is invalid', () => {
        return request(app)
          .patch('/api/comments/2')
          .send({ inc_votes: 'ten' })
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('DELETE - status code 204 - deletes the requested comment', () => {
        return request(app)
          .delete('/api/comments/1')
          .expect(204)
          .then((res) => {
            return request(app).get('/api/articles/9');
          })
          .then((res) => {
            expect(res.body.article[0].comment_count).toBe('1');
          });
      });
      test('DELETE ERROR - status code 404 - when passed comment id doesnt exist', () => {
        return request(app)
          .delete('/api/comments/10000')
          .expect(404)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'NOT FOUND' });
          });
      });
      test('DELETE ERROR - status code 400 - when passed comment id is invalid', () => {
        return request(app)
          .delete('/api/comments/one')
          .expect(400)
          .then((res) => {
            expect(res.body).toEqual({ msg: 'BAD REQUEST' });
          });
      });
      test('INVALID METHODS - status code 405 - when invalid methods is used', () => {
        const invalidMethods = ['get', 'post'];
        const methodPromises = invalidMethods.map((method) => {
          return request(app)
            [method]('/api/comments/1')
            .expect(405)
            .then(({ body }) => {
              expect(body.msg).toBe('INVALID METHOD');
            });
        });
        return Promise.all(methodPromises);
      });
    });
  });
});
