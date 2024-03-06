CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name CHARACTER varying(64) NOT NULL UNIQUE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name CHARACTER VARYING(64) NOT NULL,
  username CHARACTER varying(64) NOT NULL UNIQUE,
  password CHARACTER varying(256) NOT NULL,
  admin BOOLEAN DEFAULT false
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    date DATE,
    home INTEGER NOT NULL,
    away INTEGER NOT NULL,
    home_score INTEGER NOT NULL CHECK (home_score >= 0),
    away_score INTEGER NOT NULL CHECK (away_score >= 0),
    CONSTRAINT fk_home FOREIGN KEY (home) REFERENCES teams (id),
    CONSTRAINT fk_away FOREIGN KEY (away) REFERENCES teams (id)
);

INSERT INTO users (name, username, password, admin) VALUES ('Svana admin', 'admin', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii', true);
INSERT INTO users (name, username, password) VALUES ('Daniel', 'daniel', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii');

