import { DummyPlayerMatcher, DummyPlayerService, MatchmakingService, type Player } from "./matchmaking-service.js";
import type { Rule } from "./rule-matcher.js";

const fakePlayers: Record<number, Player> = {
  1: {
    id: 1,
    username: "player1",
    properties: {
      table: 1,
      league: 1,
    },
  },
  2: {
    id: 2,
    username: "player2",
    properties: {
      table: 7,
      league: 10,
    },
  },
  3: {
    id: 3,
    username: "player3",
    properties: {
      table: 7,
      league: 20,
    },
  },
};

const dummyMatcher = new DummyPlayerMatcher();
const playerService = new DummyPlayerService(fakePlayers);
const matchmakingService = new MatchmakingService(dummyMatcher, playerService);

matchmakingService.addRequest({
  playerId: 2,
  minPlayers: 1,
  maxPlayers: 1,
  matchingRule: {
    propertyName: "table",
    value: 7,
    operator: "=",
  },
});

matchmakingService.addRequest({
  playerId: 3,
  minPlayers: 1,
  maxPlayers: 1,
  matchingRule: {
    propertyName: "table",
    value: 7,
    operator: "=",
  },
});

matchmakingService.addRequest({
  playerId: 1,
  minPlayers: 1,
  maxPlayers: 4,
  matchingRule: {
    propertyName: "table",
    value: 1,
    operator: "=",
  },
});

const result = matchmakingService.run();

if (result) {
  const tableData = result.matchedTickets.map((ticket) => ({
    PlayerId: ticket.playerId,
    MatchedPlayerIds: ticket.matchedPlayerIds.join(", "),
    MinPlayers: ticket.minPlayers,
    MaxPlayers: ticket.maxPlayers,
    Status: ticket.status,
    MatchingRule: JSON.stringify(ticket.matchingRule),
  }));
  console.log("\nMatched Tickets:");
  console.table(tableData);
}
