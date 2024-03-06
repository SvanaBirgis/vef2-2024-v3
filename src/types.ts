
export type Team = {
    name: string;
};
  
export type Game = {
    home: Team;
    away: Team;
    home_score: number;
    away_score: number;
};

export type GameDay = {
    date: Date;
    games: Game[];  
};
  