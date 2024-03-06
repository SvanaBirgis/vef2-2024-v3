import pg from 'pg';
import { readFile } from 'fs/promises';
import { environment } from './environment.js';
import { logger } from './logger.js';

const SCHEMA = './sql/schema.sql';
const DROP = './sql/drop.sql';
const DUMMY_DATA = './sql/dummyData.sql';

const env = environment(process.env, logger);

if (!env?.connectionString) {
  process.exit(-1);
}

const { connectionString } = env;

const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    // console.log('dada', q, values)

    const result = await client.query(q, values);
    // console.log(result)
    return result;
  } catch (e) {
    console.error('unable to query', e);
    return null;
  } finally {
    client.release();
  }

}

export async function getGames() {
  const q = `
    SELECT
      games.id as id,
      date,
      home_team.name AS home_name,
      home_score,
      away_team.name AS away_name,
      away_score
    FROM
      games
    LEFT JOIN
      teams AS home_team ON home_team.id = games.home
    LEFT JOIN
      teams AS away_team ON away_team.id = games.away
  `;
  

  const result = await query(q);
  // console.log('getGamesResult', result)

  const games = [];
  if (result && (result.rows?.length ?? 0) > 0) {
    for (const row of result.rows) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      const game = {
        id: row.id,
        date: row.date.toLocaleDateString('en-US', options),
        dateUnformatted: row.date,
        home: {
          name: row.home_name,
          score: row.home_score,
        },
        away: {
          name: row.away_name,
          score: row.away_score,
        },
      };
      games.push(game);
    }
    games.sort((a, b) => b.dateUnformatted - a.dateUnformatted);
    // console.log('getGames', games)
    return games;
  }

  return [];
}

export async function getStandings() {
  // TODO get games med falli ad ofan
  // TODO reikna stodu ut fra score eins og i v1
  // TODO skila objecti eda fylki sem inniheldur stoduna og er svo notad i stada.ejs i gegnum index-routes.js 
  const games = await getGames(); 

  const standings = {};

  for (const game of games) {
    if (!standings[game.home.name]) {
      standings[game.home.name] = { wins: 0, losses: 0, draws: 0, points: 0 };
    }
    if (!standings[game.away.name]) {
      standings[game.away.name] = { wins: 0, losses: 0, draws: 0, points: 0 };
    }

    if (game.home.score > game.away.score) {
      standings[game.home.name].wins += 1;
      standings[game.home.name].points += 3;
      standings[game.away.name].losses += 1;
    } else if (game.home.score < game.away.score) {
      standings[game.away.name].wins += 1;
      standings[game.away.name].points += 3;
      standings[game.home.name].losses += 1;
    } else {
      standings[game.home.name].draws += 1;
      standings[game.away.name].draws += 1;
      standings[game.home.name].points += 1;
      standings[game.away.name].points += 1;
    }
  }

  const standingsArray = Object.entries(standings).map(([name, stats]) => ({
    name,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    points: stats.points,
  }));

  standingsArray.sort((a, b) => b.points - a.points);

  // console.log(standingsArray);
  return standingsArray;
}

export async function insertTeam(name){
  const q =
    'INSERT INTO teams (name) VALUES ($1);'
    return query(q, [name]);
}

export async function getTeamByName(name){
  const q = `
    SELECT
      id,
      name
    FROM
      teams
    WHERE
      name = ($1)
  `;
  const result = await query(q, [name]);
  if (result.rowCount === 1){
    return result.rows[0]
  }
  return null
}

export async function getGameById(id){
  const q = `
    SELECT
      id,
      date,
      home,
      home_score,
      away,
      away_score
    FROM
      games
    WHERE
      id = ($1)
  `;
  // console.log('ID', id)
  const result = await query(q, [id]);
  // console.log('result',result)
  if(!result){
    return null
  }
  if (result.rowCount === 1){
    return result.rows[0]
  }
  return null
}

export async function getTeams() {
  const q = `
  SELECT
    id,
    name
  FROM
    teams
  `;

  const result = await query(q);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows;
}

export async function insertGame(date, homeId, homeScore, awayId, awayScore) {
  const q =
    'INSERT INTO games (date, home, home_score, away, away_score) VALUES ($1, $2, $3, $4, $5);';

  return query(q, [date, homeId, homeScore, awayId, awayScore]);
}

export async function updateGame(gameId, { date, homeId, homeScore, awayId, awayScore }) {
  const q = `
    UPDATE games
    SET
      date = $1,
      home = $2,
      home_score = $3,
      away = $4,
      away_score = $5
    WHERE
      id = $6
    RETURNING id, date, home, home_score, away, away_score;
  `;
  const values = [date, homeId, homeScore, awayId, awayScore, gameId];
  // console.log(gameId)
  const result = await query(q, values);

  if (result && result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}


async function queryFromFile(file) {
  const data = await readFile(file);

  return query(data.toString('utf-8'));
}

export async function createSchema(schema = SCHEMA) {
  return queryFromFile(schema);
}

export async function dropSchema(drop = DROP) {
  return queryFromFile(drop);
}

export async function insertDummyData(dummyData = DUMMY_DATA) {
  return queryFromFile(dummyData)
}

export async function end() {
  await pool.end();
}
