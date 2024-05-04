type MatchingRule = string;
type MatchRequestState = "matched" | "canceled" | "searching" | "notfound";
type PlayerProperty = string;
type PlayerPropertyValue = number;

type MatchmakingRequest = {
  playerId: number;
  minPlayers: number;
  maxPlayers: number;
  matchingRule: MatchingRule;
};

type MatchmakingTicket = {
  playerId: number;
  ticketId: number;
  minPlayers: number;
  maxPlayers: number;
  matchingRule: MatchingRule;
  createdAt: number;
  expireAt: number;
  timeOut: number;
  status: MatchRequestState;
  matchedPlayerIds: number[];
};

type Player = {
  id: number;
  username: string;
  properties: Record<PlayerProperty, PlayerPropertyValue>;
};

interface IPlayerMatcher {
  match(rule: MatchingRule, players: PlayersPool): Player[];
}

class PlayersPool {
  private readonly pool: Map<number, Player> = new Map();
  public add(player: Player): void {
    if (this.hasPlayer(player)) {
      return;
    }
    this.pool.set(player.id, player);
  }

  public removePlayer(player: Player) {
    if (this.hasPlayer(player)) {
      this.pool.delete(player.id);
    }
  }

  public hasPlayer(player: Player) {
    return this.pool.has(player.id);
  }

  public getPlayer(playerId: number): Player | undefined {
    return this.pool.get(playerId);
  }
}

class DummyRuleMatcher implements IPlayerMatcher {
  public match(rule: MatchingRule, players: PlayersPool): Player[] {
    return [];
  }
}

type MatchmakingResult = {
  matchedTickets: MatchmakingTicket[];
  expiredTickets: MatchmakingTicket[];
};

class MatchmakingService {
  private readonly activeTickets: Map<number, MatchmakingTicket> = new Map();
  private static currentTicketId = 0;
  private readonly DEFAULT_TIMEOUT_MS: number = 30 * 1000; // 30 seconds

  public constructor(
    private readonly players: PlayersPool,
    private readonly ruleMatcher: IPlayerMatcher
  ) {}

  public addRequest(request: MatchmakingRequest) {
    //assume that only one matchmakingrequest per player can occur
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
    const { matchedTickets, expiredTickets } = this.executeMatchMaking(
      ticketsCopy,
      currentTime
    );

    //delete all expired tickets.
    for (const ticket of expiredTickets) {
      this.activeTickets.delete(ticket.playerId);
    }

    for (let i = 0; i < matchedTickets.length; i++) {
      const ticket = matchedTickets[i];
      //check if all players in the matched ticket are still valid.
      var areStillValid = ticket.matchedPlayerIds.some((playerId) =>
        this.activeTickets.has(playerId)
      );
      if (!areStillValid) {
        matchedTickets.splice(i, 1);
        continue;
      }

      //ticket is valid so remove from the active tickets
      this.activeTickets.delete(ticket.playerId);
    }

    return { matchedTickets, expiredTickets };
  }

  public executeMatchMaking(tickets: MatchmakingTicket[], currentTime: number) {
    const result: MatchmakingResult = {
      matchedTickets: [],
      expiredTickets: [],
    };

    for (let i = 0; i < tickets.length; i++) {
      const ticket = this.activeTickets[i];
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
        const foundedPlayers = this.searchMatchablePlayers(ticket);
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

  private searchMatchablePlayers(ticket: MatchmakingTicket): Player[] {
    //handle logic that search players from the pool base on the ticket rules
    return this.ruleMatcher.match(ticket.matchingRule, this.players);
  }
}

const pool = generateRandomPlayers(2);
const dummyMatcher = new DummyRuleMatcher();
const matchmakingService = new MatchmakingService(pool, dummyMatcher);

matchmakingService
  .addRequest({
    playerId: 0,
    minPlayers: 1,
    maxPlayers: 1,
    matchingRule: "",
  })
  .addRequest({
    playerId: 1,
    minPlayers: 4,
    maxPlayers: 4,
    matchingRule: "",
  });

var result = matchmakingService.run();
console.log(result);

function generateRandomPlayers(count: number): PlayersPool {
  const result: PlayersPool = new PlayersPool();
  for (let i = 0; i < count; i++) {
    result.add({
      id: i,
      properties: {},
      username: `Player-${i}`,
    });
  }
  return result;
}
