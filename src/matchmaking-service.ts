import { RuleMatcher, type Rule } from "./rule-matcher.js";
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

export interface IPlayerMatcher {
  match(
    currentTicket: MatchmakingTicket,
    activeTickets: MatchmakingTicket[],
    playerPool: Record<number, Player>
  ): Player[];
}

export class DummyPlayerMatcher implements IPlayerMatcher {
  public match(
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
}

export interface IPlayerService {
  getPlayerBydId(playerId: number): Player;
}

export class DummyPlayerService implements IPlayerService {
  constructor(private readonly playerPool: Record<number, Player>) {}

  public getPlayerBydId(playerId: number): Player {
    return this.playerPool[playerId];
  }
}

export class MatchmakingService {
  private readonly activeTickets: Map<number, MatchmakingTicket> = new Map();
  private static currentTicketId = 0;
  private readonly DEFAULT_TIMEOUT_MS: number = 30 * 1000; // 30 seconds

  private readonly playerPool: Record<number, Player> = {};
  public constructor(private readonly playerMatcher: IPlayerMatcher, private readonly playerService: IPlayerService) {}

  public addRequest(request: MatchmakingRequest) {
    //assume that only one matchmakingrequest per player can occurr

    this.playerPool[request.playerId] = this.playerService.getPlayerBydId(request.playerId);

    this.activeTickets.set(request.playerId, {
      playerId: request.playerId,
      ticketId: MatchmakingService.currentTicketId++,
      minPlayers: request.minPlayers,
      maxPlayers: request.maxPlayers,
      timeOut: this.DEFAULT_TIMEOUT_MS,
      createdAt: Date.now(),
      expireAt: Date.now() + this.DEFAULT_TIMEOUT_MS,
      status: "searching",
      matchingRule: request.matchingRule,
      matchedPlayerIds: [],
    });
    return this;
  }

  public run(): MatchmakingResult | undefined {
    //search for expired tickets
    const currentTime = Date.now();
    //no active tickets skip execution
    if (this.activeTickets.size <= 0) {
      return;
    }

    const ticketsCopy = Array.from(this.activeTickets.values());
    const { matchedTickets, expiredTickets } = this.executeMatchMaking(ticketsCopy, currentTime);

    //delete all expired tickets.
    for (const ticket of expiredTickets) {
      this.activeTickets.delete(ticket.playerId);
    }

    for (let i = 0; i < matchedTickets.length; i++) {
      const ticket = matchedTickets[i];
      //check if all players in the matched ticket are still valid.
      var areStillValid = ticket.matchedPlayerIds.some((playerId) => this.activeTickets.has(playerId));
      if (!areStillValid) {
        matchedTickets.splice(i, 1);
        continue;
      }

      //ticket is valid so remove from the active tickets
      this.activeTickets.delete(ticket.playerId);
    }

    return { matchedTickets, expiredTickets };
  }

  private executeMatchMaking(tickets: MatchmakingTicket[], currentTime: number) {
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
        if (this.isMinimalRequirementsMeet(ticket)) {
          ticket.status = "matched";
          result.matchedTickets.push(ticket);
        } else {
          ticket.status = "notfound";
          result.expiredTickets.push(ticket);
        }
      } else {
        //at this points we have not expired ticket so try to find a best match.
        const foundedPlayers = this.searchMatchablePlayers(ticket, tickets);
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

  private isMinimalRequirementsMeet(ticket: MatchmakingTicket) {
    //handle logic to check minimal ticket requirments
    return ticket.matchedPlayerIds.length >= ticket.minPlayers;
  }

  private searchMatchablePlayers(currentTicket: MatchmakingTicket, activeTickets: MatchmakingTicket[]): Player[] {
    //handle logic that search players from the pool base on the ticket rules
    return this.playerMatcher.match(currentTicket, activeTickets, this.playerPool);
  }
}
