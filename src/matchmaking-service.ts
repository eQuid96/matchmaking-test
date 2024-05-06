import { Matchmaker } from "./matchmaker.js";
import type { MatchmakingRequest, MatchmakingResult, MatchmakingTicket, Player } from "./matchmaking-types.js";

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
  public constructor(private readonly playerService: IPlayerService) {}

  public addRequest(request: MatchmakingRequest) {
    //assume that only one matchmakingrequest per player can occurr
    if (this.activeTickets.has(request.playerId)) {
      return;
    }

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
    //TODO: ADD A CORUTINE HERE

    const currentTime = Date.now();
    //no active tickets skip execution
    if (this.activeTickets.size <= 0) {
      return;
    }

    const ticketsCopy = Array.from(this.activeTickets.values());
    const { matchedTickets, expiredTickets } = Matchmaker.executeMatchMaking(ticketsCopy, currentTime, this.playerPool);

    //delete all expired tickets.
    for (const ticket of expiredTickets) {
      this.activeTickets.delete(ticket.playerId);
    }
    for (let i = 0; i < matchedTickets.length; i++) {
      const ticket = matchedTickets[i];
      //check if all players in the matched ticket are still valid.
      const areStillValid = ticket.matchedPlayerIds.every((playerId) => this.activeTickets.has(playerId));
      if (!areStillValid) {
        matchedTickets.splice(i, 1);
        continue;
      }
    }

    //all matched tickets at this point are valid so we can delete them
    for (const ticket of matchedTickets) {
      this.activeTickets.delete(ticket.playerId);
    }

    //TODO: create matches and send MatchFoundEvents and MatchNotFoundEvents to players.
    return { matchedTickets, expiredTickets };
  }

  //TOOD: Add CancelMatchmakingRequest
}
