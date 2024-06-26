import { DummyPlayerService, MatchmakingService } from "./matchmaking-service.js";
import type { Player } from "./matchmaking-types.js";

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

const playerService = new DummyPlayerService(fakePlayers);
const matchmakingService = new MatchmakingService(playerService);

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
  const table: Record<number, object> = {};
  for (const matchedTicket of result.matchedTickets) {
    table[matchedTicket.ticketId] = {
      PlayerId: matchedTicket.playerId,
      MatchedPlayerIds: matchedTicket.matchedPlayerIds.join(", "),
      MinPlayers: matchedTicket.minPlayers,
      MaxPlayers: matchedTicket.maxPlayers,
      Status: matchedTicket.status,
      MatchingRule: JSON.stringify(matchedTicket.matchingRule),
    };
  }
  console.log("\nMatched Tickets:");
  console.table(table);
}
