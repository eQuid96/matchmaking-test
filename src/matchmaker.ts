import { RuleMatcher } from "./rule-matcher.js";
import type { MatchingStrategyFn, MatchmakingResult, MatchmakingTicket, Player } from "./matchmaking-types.js";

export class Matchmaker {
  public static executeMatchMaking(
    tickets: MatchmakingTicket[],
    currentTime: number,
    playerPool: Record<number, Player>,
    matchingStrategy: MatchingStrategyFn = defaultMatchingStrategy
  ): MatchmakingResult {
    const result: MatchmakingResult = {
      matchedTickets: [],
      expiredTickets: [],
    };

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      //handle expired tickets
      const isTicketExpired = currentTime >= ticket.expireAt;
      if (isTicketExpired) {
        //check if fullfill the minimal requirments
        if (Matchmaker.isMinimalRequirementsMeet(ticket)) {
          ticket.status = "matched";
          result.matchedTickets.push(ticket);
        } else {
          ticket.status = "notfound";
          result.expiredTickets.push(ticket);
        }
      } else {
        //at this points we have not expired ticket so try to find a best match.
        const foundedPlayers = matchingStrategy(ticket, tickets, playerPool);
        if (ticket.maxPlayers == foundedPlayers.length) {
          //best match found.
          ticket.matchedPlayerIds = foundedPlayers.map((player) => player.id);
          ticket.status = "matched";
          result.matchedTickets.push(ticket);
        }
      }
    }
    return result;
  }

  private static isMinimalRequirementsMeet(ticket: MatchmakingTicket) {
    //handle logic to check minimal ticket requirments
    return ticket.matchedPlayerIds.length >= ticket.minPlayers;
  }
}

function defaultMatchingStrategy(
  currentTicket: MatchmakingTicket,
  activeTickets: MatchmakingTicket[],
  playerPool: Record<number, Player>
): Player[] {
  const result: Player[] = [];
  for (const otherTicket of activeTickets) {
    const otherPlayer = playerPool[otherTicket.playerId];
    const currentPlayer = playerPool[currentTicket.playerId];
    // skip current player
    if (currentTicket.ticketId == otherTicket.ticketId) {
      continue;
    }
    if (result.length == currentTicket.maxPlayers) {
      break;
    }

    //To find a match the rule of currentPlayer must match with otherPlayer and vice versa
    if (
      RuleMatcher.match(currentTicket.matchingRule, otherPlayer.properties) &&
      RuleMatcher.match(otherTicket.matchingRule, currentPlayer.properties)
    ) {
      result.push(otherPlayer);
    }
  }
  return result;
}
