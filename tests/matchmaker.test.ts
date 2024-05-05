import { describe, expect, it } from "vitest";
import { Matchmaker } from "../src/matchmaker.js";
import type { MatchmakingTicket, Player } from "../src/matchmaking-types.js";

const testPlayerPool: Record<number, Player> = {
  1: {
    id: 1,
    username: "player1",
    properties: {
      table: 7,
      league: 1,
    },
  },
  2: {
    id: 2,
    username: "player2",
    properties: {
      table: 7,
      league: 1,
    },
  },
  3: {
    id: 3,
    username: "player3",
    properties: {
      table: 7,
      league: 2,
    },
  },
};

describe("Matchmaker tests", () => {
  it("should match players and expired tickets should be empty", () => {
    const testTickets: MatchmakingTicket[] = [
      {
        playerId: 1,
        ticketId: 1,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },

      {
        playerId: 2,
        ticketId: 2,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },
    ];
    const { matchedTickets, expiredTickets } = Matchmaker.executeMatchMaking(testTickets, Date.now(), testPlayerPool);
    expect(matchedTickets.length).toBe(2);

    const firstTicket = matchedTickets[0];
    const secondTicket = matchedTickets[1];
    expect(firstTicket.playerId).toBe(1);
    expect(firstTicket.matchedPlayerIds.length).toBe(1);
    expect(firstTicket.matchedPlayerIds[0]).toBe(2);

    expect(secondTicket.playerId).toBe(2);
    expect(secondTicket.matchedPlayerIds.length).toBe(1);
    expect(secondTicket.matchedPlayerIds[0]).toBe(1);
  });

  it("should exclude already matched players", () => {
    const testTickets: MatchmakingTicket[] = [
      {
        playerId: 1,
        ticketId: 1,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },

      {
        playerId: 2,
        ticketId: 2,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },
      {
        playerId: 3,
        ticketId: 3,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },
    ];
    const { matchedTickets, expiredTickets } = Matchmaker.executeMatchMaking(testTickets, Date.now(), testPlayerPool);
    expect(matchedTickets.length).toBe(2);

    const firstTicket = matchedTickets[0];
    const secondTicket = matchedTickets[1];
    expect(firstTicket.playerId).toBe(1);
    expect(firstTicket.matchedPlayerIds.includes(secondTicket.playerId)).toBeTruthy();

    expect(secondTicket.playerId).toBe(2);
    expect(secondTicket.matchedPlayerIds.includes(firstTicket.playerId)).toBeTruthy();

    expect(expiredTickets.length).toBe(0);
  });

  it("expired tickets should not be empty", () => {
    const expectedExpiredTicket: MatchmakingTicket = {
      playerId: 1,
      ticketId: 1,
      minPlayers: 1,
      maxPlayers: 1,
      timeOut: 0,
      createdAt: Date.now(),
      expireAt: Date.now(),
      status: "searching",
      matchingRule: {
        propertyName: "table",
        value: 99,
        operator: "=",
      },
      matchedPlayerIds: [],
    };
    const testTickets: MatchmakingTicket[] = [
      expectedExpiredTicket,
      {
        playerId: 2,
        ticketId: 2,
        minPlayers: 1,
        maxPlayers: 1,
        timeOut: 30000,
        createdAt: Date.now(),
        expireAt: Date.now() + 30000,
        status: "searching",
        matchingRule: {
          propertyName: "table",
          value: 7,
          operator: "=",
        },
        matchedPlayerIds: [],
      },
    ];
    const expiredTime = Date.now() + 1000;
    const { matchedTickets, expiredTickets } = Matchmaker.executeMatchMaking(testTickets, expiredTime, testPlayerPool);

    expect(matchedTickets.length).toBe(0);
    expect(expiredTickets.length).toBe(1);

    expect(expiredTickets[0]).toStrictEqual(expectedExpiredTicket);
  });
});
