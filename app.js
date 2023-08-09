const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
       *
    FROM
     player_details; 
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
      SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT
      *
    FROM
    match_details
    WHERE 
    match_id = ${matchId};
    `;
  const match = await db.get(matchDetailsQuery);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
      * 
    FROM player_match_score
      NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchesQuery);

  response.send(
    playerMatches.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
     SELECT
       player_details.player_id AS playerId,
       player_details.player_name AS playerName
     FROM 
       player_match_score NATURAL JOIN player_details
     WHERE 
       match_id = ${matchId};
     `;
  const matchPlayer = await db.all(getMatchPlayerQuery);
  response.send(matchPlayer);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
       player_details.player_id AS playerId,
       player_details.player_name AS playerName,
       SUM(player_match_score.score) AS totalScore,
       SUM(fours) AS totalFours,
       SUM(sixes) AS totalSixes
    FROM
      player_details INNER JOIN player_match_score ON
      player_details.player_id = player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId};
    `;
  console.log(getPlayerScored);
  const scoreCardOfPlayer = await db.get(getPlayerScored);
  console.log(scoreCardOfPlayer);
  response.send(scoreCardOfPlayer);
});

module.exports = app;
