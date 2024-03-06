import express, { Request, Response, NextFunction } from 'express';
import { sayHello } from '../lib/hello.js';
import { listTeams, createTeams, getTeams, updateTeams, deleteTeams } from './teams.js';

// import {
//   createCourse,
//   deleteCourse,
//   getCourse,
//   listCourses,
//   updateCourse,
// } from './courses.js';
// import {
//   createDepartment,
//   deleteDepartment,
//   getDepartment,
//   listDepartments,
//   updateDepartment,
// } from './departments.js';

export const router = express.Router();

export async function hello(req: Request, res: Response, next: NextFunction) {
  res.json({ hello: sayHello('world') });
  next();
}

export async function bye() {
  console.log('done');
}

export async function error() {
  throw new Error('error');
}

router.get('/test', hello, bye);

// Mun crasha öllu
router.get('/error', error);



export async function index(req: Request, res: Response) {
  return res.json([
    {
      href: '/teams',
      methods: ['GET', 'POST'],
    },
    {
      href: '/teams/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
    {
      href: '/teams/:slug/games',
      methods: ['GET', 'POST'],
    },
    {
      href: '/teams/:slug/games/:gameId',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
  ]);
}

// Teams
router.get('/', index); 
router.get('/teams', listTeams); // skilar lista af liðum:
// 200 OK skilað með gögnum á JSON formi.
router.post('/teams', createTeams); // býr til nýtt lið:
// 200 OK skilað ásamt upplýsingum um lið.
// 400 Bad Request skilað ef gögn sem send inn eru ekki rétt (vantar gögn, gögn á röngu formi eða innihald þeirra ólöglegt)
router.get('/teams/:slug', getTeams); // skilar stöku liði
// 200 OK skilað með gögnum ef lið er til.
// 404 Not Found skilað ef lið er ekki til.
router.patch('/teams/:slug', updateTeams); // uppfærir lið
// 200 OK skilað með uppfærðu liði ef gekk.
// 400 Bad Request skilað ef gögn sem send inn eru ekki rétt.
// 404 Not Found skilað ef lið er ekki til.
// 500 Internal Error skilað ef villa kom upp.
router.delete('/teams/:slug', deleteTeams); // eyðir liði
// 204 No Content skilað ef gekk.
// 404 Not Found skilað ef lið er ekki til.
// 500 Internal Error skilað ef villa kom upp.

// Games
router.get('/teams/:slug/games', listGames);
router.post('/teams/:slug/games', createGames);
router.get('/teams/:slug/games/:gameId', getGames);
router.patch('/teams/:slug/games/:gameId', updateGames);
router.delete('/teams/:slug/games/:gameId', deleteGames);
