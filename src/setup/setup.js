import { join } from 'path';
import { createSchema, dropSchema, getTeamByName, insertGame, insertTeam } from '../lib/db.js';
import { parseGamedayFile, parseTeamsJson } from '../lib/parse.js';
import {
  readFile,
  readFilesFromDir,
} from '../lib/file.js';


async function initializeSchema(){
  const drop = await dropSchema();

  if (drop) {
    console.info('schema dropped');
  } else {
    console.info('schema not dropped, exiting');
    process.exit(-1);
  }

  const schemaResult = await createSchema();

  if (schemaResult) {
    console.info('schema created');
  } else {
    console.info('schema not created');
  }
}

async function parseGameData(){
  const INPUT_DIR = './data';

  console.info('starting to generate');

  // Sækjum liðaheiti, ef gögn spillt mun þetta kasta villu og hætta keyrslu
  const teamsFileData = await readFile(join(INPUT_DIR, 'teams.json'));
  const teams = parseTeamsJson(teamsFileData);
  console.info('team names read, total', teams.length);

  // Finnum allar skrár sem byrja á `gameday-` í `INPUT_DIR`
  const files = await readFilesFromDir(INPUT_DIR);
  const gamedayFiles = files.filter((file) => file.indexOf('gameday-') > 0);
  console.info('gameday files found', gamedayFiles.length);

  // Förum yfir allar skrár og þáttum þær
  const gamedays = [];
  console.info('starting to parse gameday files');
  for await (const gamedayFile of gamedayFiles) {
    const file = await readFile(gamedayFile);

    try {
      // Reynum að þátta skrána, ef það tekst þá bætum við við í fylkið
      gamedays.push(parseGamedayFile(file, teams));
    } catch (e) {
      console.error(`unable to parse ${gamedayFile}`, e.message);
    }
  }
  console.info('gameday files parsed', gamedays.length);

  // Sorterum þ.a. elsti leikdagur sé fyrst
  gamedays.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Pushum öllum leikjum í allgames
  const allGames = [];
  for (const gameday of gamedays) {
    for (const game of gameday.games){
      allGames.push({
        date: gameday.date,
        game
      })
    }
  }

  return {
    teams,
    allGames
  }
}

async function readDataAndAddToDB(){
  const parsedGameData = await parseGameData();
  // console.log(games)

  await initializeSchema();
  // TODO insert read data
  // console.log(parsedGameData.teams)
  await Promise.all(parsedGameData.teams.map(async (team) => {
    await insertTeam(team)
  }));
  await Promise.all(parsedGameData.allGames.map(async (gameData) => {
    const homeTeam = await getTeamByName(gameData.game.home.name);
    const awayTeam = await getTeamByName(gameData.game.away.name);
    const homeId = homeTeam?.id;
    const awayId = awayTeam?.id;
    // console.log('daniel', homeTeam, homeId)
  
    if (!homeId || !awayId){
      return
    }
    await insertGame(gameData.date, homeId, gameData.game.home.score, 
      awayId, gameData.game.away.score)
  }));
}

async function main() {
  await readDataAndAddToDB();
}

main().catch((e) => console.error(e));