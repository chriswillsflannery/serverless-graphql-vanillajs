const { URL } = require("url");
const fetch = require("node-fetch");
const { query } = require("./utils/hasura");

exports.handler = async () => {
  const { movies } = await query({
    query: `
      query {
        movies {
          id
          title
          tagline
          poster
        }
      }
    `,
  });

  const api = new URL("https://www.omdbapi.com/");

  const promises = movies.map((movie) => {
    // use the movie’s IMDb/OMDb ID to look up details
    api.searchParams.set("i", movie.id);
    // add the secret API key to the query string -> api key must be added LAST
    api.searchParams.set("apikey", process.env.OMDB_API_KEY);

    console.log("api", api);

    return fetch(api)
      .then((response) => response.json())
      .then((data) => {
        const scores = data.Ratings;

        return {
          ...movie,
          scores,
        };
      });
  });

  // awaiting all Promises lets the requests happen in parallel
  // see: https://lwj.dev/blog/keep-async-await-from-blocking-execution/
  const moviesWithRatings = await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify(moviesWithRatings),
  };
};
