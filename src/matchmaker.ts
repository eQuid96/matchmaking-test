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
      //check if this ticket was already match from the matching stretegy before and skip it
      if (ticket.status === "matched") {
        continue;
      }
      //at this points we have not expired ticket so try to find a best match.
      const foundedPlayers = matchingStrategy(ticket, tickets, playerPool);
      const isTicketExpired = currentTime >= ticket.expireAt;
      if (isTicketExpired) {
        if (this.isMinimalRequirementsMeet(ticket, foundedPlayers)) {
          ticket.matchedPlayerIds = foundedPlayers.map((ticket) => ticket.playerId);
          ticket.status = "matched";
          result.matchedTickets.push(ticket);
          //update matching tickets status with matched
          for (const foundedTicket of foundedPlayers) {
            foundedTicket.status = "matched";
            const otherPlayerIds = foundedPlayers
              .filter((t) => t.playerId !== foundedTicket.playerId)
              .map((t) => t.playerId);
            foundedTicket.matchedPlayerIds = [ticket.playerId, ...otherPlayerIds];
            result.matchedTickets.push(foundedTicket);
          }
        } else {
          ticket.status = "notfound";
          result.expiredTickets.push(ticket);
        }
      } else if (ticket.maxPlayers === foundedPlayers.length) {
        //best match found.
        ticket.matchedPlayerIds = foundedPlayers.map((ticket) => ticket.playerId);
        ticket.status = "matched";
        result.matchedTickets.push(ticket);
        //update matching tickets status with matched
        for (const foundedTicket of foundedPlayers) {
          foundedTicket.status = "matched";
          const otherPlayerIds = foundedPlayers
            .filter((t) => t.playerId !== foundedTicket.playerId)
            .map((t) => t.playerId);
          foundedTicket.matchedPlayerIds = [ticket.playerId, ...otherPlayerIds];
          result.matchedTickets.push(foundedTicket);
        }
      }
    }
    return result;
  }

  private static isMinimalRequirementsMeet(currentTicket: MatchmakingTicket, foundedTickets: MatchmakingTicket[]) {
    //handle logic to check minimal ticket requirments
    return foundedTickets.length >= currentTicket.minPlayers;
  }
}

function defaultMatchingStrategy(
  currentTicket: MatchmakingTicket,
  activeTickets: MatchmakingTicket[],
  playerPool: Record<number, Player>
): MatchmakingTicket[] {
  const result: MatchmakingTicket[] = [];
  for (const otherTicket of activeTickets) {
    const otherPlayer = playerPool[otherTicket.playerId];
    const currentPlayer = playerPool[currentTicket.playerId];
    //we have found players that we need stop searching.
    if (result.length == currentTicket.maxPlayers) {
      break;
    }
    // skip current player
    if (currentTicket.ticketId == otherTicket.ticketId) {
      continue;
    }

    if (otherTicket.status == "matched") {
      continue;
    }

    //To find a match the rule of currentPlayer must match with otherPlayer and vice versa
    if (
      RuleMatcher.match(currentTicket.matchingRule, otherPlayer.properties) &&
      RuleMatcher.match(otherTicket.matchingRule, currentPlayer.properties)
    ) {
      result.push(otherTicket);
    }
  }
  return result;
}
