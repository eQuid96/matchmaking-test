import type { Rule } from "./rule-matcher.js";

type MatchRequestState = "matched" | "canceled" | "searching" | "notfound";
type PlayerProperty = string;
type PlayerPropertyValue = number;

export type Player = {
  id: number;
  username: string;
  properties: Record<PlayerProperty, PlayerPropertyValue>;
};

export type MatchmakingRequest = {
  playerId: number;
  minPlayers: number;
  maxPlayers: number;
  matchingRule: Rule;
};

export type MatchmakingTicket = {
  playerId: number;
  ticketId: number;
  minPlayers: number;
  maxPlayers: number;
  matchingRule: Rule;
  createdAt: number;
  expireAt: number;
  timeOut: number;
  status: MatchRequestState;
  matchedPlayerIds: number[];
};

export type MatchmakingResult = {
  matchedTickets: MatchmakingTicket[];
  expiredTickets: MatchmakingTicket[];
};

export type MatchingStrategyFn = (
  currentTicket: MatchmakingTicket,
  activeTickets: MatchmakingTicket[],
  playerPool: Record<number, Player>
) => Player[];
