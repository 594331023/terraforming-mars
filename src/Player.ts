import * as constants from './constants';
import {DEFAULT_FLOATERS_VALUE, DEFAULT_MICROBES_VALUE, ENERGY_TRADE_COST, MAX_FLEET_SIZE, MC_TRADE_COST, MILESTONE_COST, REDS_RULING_POLICY_COST, TITANIUM_TRADE_COST} from './constants';
import {AndOptions} from './inputs/AndOptions';
import {Board} from './boards/Board';
import {CardFinder} from './CardFinder';
import {CardName} from './CardName';
import {CardType} from './cards/CardType';
import {ColonyModel} from './models/ColonyModel';
import {ColonyName} from './colonies/ColonyName';
import {Color} from './Color';
import {CorporationCard} from './cards/corporation/CorporationCard';
import {Database} from './database/Database';
import {Game} from './Game';
import {HowToPay} from './inputs/HowToPay';
import {IAward} from './awards/IAward';
import {ICard, IResourceCard} from './cards/ICard';
import {Colony} from './colonies/Colony';
import {ISerializable} from './ISerializable';
import {IMilestone} from './milestones/IMilestone';
import {IProjectCard} from './cards/IProjectCard';
import {ITagCount} from './ITagCount';
import {LogMessageDataType} from './LogMessageDataType';
import {MiningCard} from './cards/base/MiningCard';
import {OrOptions} from './inputs/OrOptions';
import {PartyHooks} from './turmoil/parties/PartyHooks';
import {PartyName} from './turmoil/parties/PartyName';
import {Phase} from './Phase';
import {PlayerInput} from './PlayerInput';
import {ResourceType} from './ResourceType';
import {Resources} from './Resources';
import {SelectAmount} from './inputs/SelectAmount';
import {SelectCard} from './inputs/SelectCard';
import {SellPatentsStandardProject} from './cards/base/standardProjects/SellPatentsStandardProject';
import {SendDelegateToArea} from './deferredActions/SendDelegateToArea';
import {DeferredAction} from './deferredActions/DeferredAction';
import {SelectHowToPayDeferred} from './deferredActions/SelectHowToPayDeferred';
import {SelectColony} from './inputs/SelectColony';
import {SelectPartyToSendDelegate} from './inputs/SelectPartyToSendDelegate';
import {SelectDelegate} from './inputs/SelectDelegate';
import {SelectHowToPay} from './inputs/SelectHowToPay';
import {SelectHowToPayForProjectCard} from './inputs/SelectHowToPayForProjectCard';
import {SelectOption} from './inputs/SelectOption';
import {SelectPlayer} from './inputs/SelectPlayer';
import {SelectSpace} from './inputs/SelectSpace';
import {RobotCard, SelfReplicatingRobots} from './cards/promo/SelfReplicatingRobots';
import {SerializedCard} from './SerializedCard';
import {SerializedPlayer} from './SerializedPlayer';
import {SpaceType} from './SpaceType';
import {StormCraftIncorporated} from './cards/colonies/StormCraftIncorporated';
import {Tags} from './cards/Tags';
import {TileType} from './TileType';
import {VictoryPointsBreakdown} from './VictoryPointsBreakdown';
import {_MiningGuild_} from './cards/breakthrough/corporation/_MiningGuild_';
import {SelectProductionToLose} from './inputs/SelectProductionToLose';
import {IAresGlobalParametersResponse, ShiftAresGlobalParameters} from './inputs/ShiftAresGlobalParameters';
import {Timer} from './Timer';
import {TurmoilHandler} from './turmoil/TurmoilHandler';
import {TurmoilPolicy} from './turmoil/TurmoilPolicy';
import {CardLoader} from './CardLoader';
import {_MorningStarInc_} from './cards/breakthrough/corporation/_MorningStarInc_';
import {DrawCards} from './deferredActions/DrawCards';
import {Units} from './Units';
import {MoonExpansion} from './moon/MoonExpansion';
import {StandardProjectCard} from './cards/StandardProjectCard';
import {ConvertPlants} from './cards/base/standardActions/ConvertPlants';
import {ConvertHeat} from './cards/base/standardActions/ConvertHeat';
import {Manutech} from './cards/venusNext/Manutech';
import {LunaProjectOffice} from './cards/moon/LunaProjectOffice';
import {UnitedNationsMissionOne} from './cards/community/UnitedNationsMissionOne';
import {PlaceMoonMineTile} from './moon/PlaceMoonMineTile';
import {PlaceMoonColonyTile} from './moon/PlaceMoonColonyTile';
import {PlaceMoonRoadTile} from './moon/PlaceMoonRoadTile';
import {GlobalParameter} from './GlobalParameter';
import {SelectGlobalCard} from './inputs/SelectGlobalCard';
import {IGlobalEvent} from './turmoil/globalEvents/IGlobalEvent';
import {GlobalEventName} from './turmoil/globalEvents/GlobalEventName';
import {LogHelper} from './LogHelper';
import {LawSuit} from './cards/promo/LawSuit';
import {CrashSiteCleanup} from './cards/promo/CrashSiteCleanup';

export type PlayerId = string;

export class Player implements ISerializable<SerializedPlayer> {
    public readonly id: string;
  private waitingFor?: PlayerInput;
  private waitingForCb?: () => void;
  private _game: Game | undefined = undefined;
  public userId: string | undefined = undefined;// 传递到前端时务必忽略该值

  // Corporate identity
  // 双将功能替换原有 corporationCard 属性，合并外网代码时，所有对公司的操作都需要核查一遍
  // public corporationCard: CorporationCard | undefined = undefined;
  public corpCard: CorporationCard | undefined = undefined;
  public corpCard2: CorporationCard | undefined = undefined;
  // Used only during set-up
  public pickedCorporationCard: CorporationCard | undefined = undefined;
  public pickedCorporationCard2: CorporationCard | undefined = undefined;

  // Terraforming Rating
  private terraformRating: number = 20;
  public hasIncreasedTerraformRatingThisGeneration: boolean = false;
  public terraformRatingAtGenerationStart: number = 20;

  // Resources
  public megaCredits: number = 0;
  protected megaCreditProduction: number = 0;
  public steel: number = 0;
  protected steelProduction: number = 0;
  public titanium: number = 0;
  protected titaniumProduction: number = 0;
  public plants: number = 0;
  protected plantProduction: number = 0;
  public energy: number = 0;
  protected energyProduction: number = 0;
  public heat: number = 0;
  protected heatProduction: number = 0;

  // Resource values
  private titaniumValue: number = 3;
  public steelValue: number = 2;
  // Helion
  public canUseHeatAsMegaCredits: boolean = false;

  // This generation / this round
  public actionsTakenThisRound: number = 0;
  public actionsThisGeneration: Set<CardName> = new Set<CardName>();
  public lastCardPlayed: IProjectCard | undefined;
  public undoing : boolean = false;
  public exited : boolean = false;// 是否体退
  public canExit : boolean = false;// 能否体退： 行动阶段、当前行动玩家、没有未执行的拦截器
  private corpInitialActionDone: boolean = false;
  private corp2InitialActionDone: boolean = false;

  // Cards
  public dealtCorporationCards: Array<CorporationCard> = [];
  public dealtProjectCards: Array<IProjectCard> = [];
  public dealtPreludeCards: Array<IProjectCard> = [];
  public cardsInHand: Array<IProjectCard> = [];
  public preludeCardsInHand: Array<IProjectCard> = [];
  public playedCards: Array<IProjectCard> = [];
  public draftedCards: Array<IProjectCard> = [];
  public cardCost: number = constants.CARD_COST;
  public cardDiscount: number = 0;

  public timer: Timer = Timer.newInstance();

  // Colonies
  private fleetSize: number = 1;
  public tradesThisGeneration: number = 0;
  public colonyTradeOffset: number = 0;
  public colonyTradeDiscount: number = 0;
  public colonyVictoryPoints: number = 0;

  // Turmoil
  public turmoilPolicyActionUsed: boolean = false;
  public politicalAgendasActionUsedCount: number = 0;

  public oceanBonus: number = constants.OCEAN_BONUS;

  // Custom cards
  // Leavitt Station.
  public scienceTagCount: number = 0;
  // PoliticalAgendas Scientists P4
  public hasTurmoilScienceTagBonus: boolean = false;
  // Ecoline
  public plantsNeededForGreenery: number = 8;
  public heatForTemperature: number = 8;
  // Lawsuit
  public removingPlayers: Array<string> = [];
  // For Playwrights corp.
  // removedFromPlayCards is a bit of a misname: it's a temporary storage for
  // cards that provide 'next card' discounts. This will clear between turns.
  public removedFromPlayCards: Array<IProjectCard> = [];
  // Hotsprings
  public heatProductionStepsIncreasedThisGeneration: number = 0;

  constructor(
    public name: string,
    public color: Color,
    public beginner: boolean,
    public handicap: number = 0,
    id: string) {
    this.id = id;
  }

  public static initialize(
    name: string,
    color: Color,
    beginner: boolean,
    handicap: number = 0,
    id: string): Player {
    const player = new Player(name, color, beginner, handicap, id);
    return player;
  }

  public set game(game: Game) {
    if (this._game !== undefined) {
      // TODO(kberg): Replace this with an Error.
      // console.warn(`Reinitializing game ${game.id} for player ${this.color}`);
    }
    this._game = game;
  }

  public get game(): Game {
    if (this._game === undefined) {
      throw new Error(`Fetching game for player ${this.color} too soon.`);
    }
    return this._game;
  }

  public isCorporation(corporationName: CardName): boolean {
    if (corporationName === CardName.STORMCRAFT_INCORPORATED) {
      return this.corpName( corporationName) || this.corpName(CardName._STORMCRAFT_INCORPORATED_);
    }
    return this.corpName(corporationName);
  }

  public getTitaniumValue(): number {
    if (PartyHooks.shouldApplyPolicy(this.game, PartyName.UNITY)) return this.titaniumValue + 1;
    return this.titaniumValue;
  }

  public increaseTitaniumValue(): void {
    this.titaniumValue++;
  }

  public decreaseTitaniumValue(): void {
    if (this.titaniumValue > constants.DEFAULT_TITANIUM_VALUE) {
      this.titaniumValue--;
    }
  }

  public getSelfReplicatingRobotsTargetCards(): Array<RobotCard> {
    return (this.playedCards.find((card) => card instanceof SelfReplicatingRobots) as (SelfReplicatingRobots | undefined))?.targetCards ?? [];
  }

  public getSteelValue(): number {
    if (PartyHooks.shouldApplyPolicy(this.game, PartyName.MARS, TurmoilPolicy.MARS_FIRST_POLICY_3)) return this.steelValue + 1;
    return this.steelValue;
  }

  public increaseSteelValue(): void {
    this.steelValue++;
  }

  public decreaseSteelValue(): void {
    if (this.steelValue > constants.DEFAULT_STEEL_VALUE) {
      this.steelValue--;
    }
  }

  public getTerraformRating(): number {
    return this.terraformRating;
  }

  public decreaseTerraformRating() {
    this.terraformRating--;
  }

  public increaseTerraformRating() {
    // United Nations Mission One hook
    UnitedNationsMissionOne.onTRIncrease(this.game);

    // 改造度公司突破：改造回2
    if (this.isCorporation(CardName._UNITED_NATIONS_MARS_INITIATIVE_) && (this.game.phase === Phase.PRELUDES || this.game.phase === Phase.ACTION)) {
      this.megaCredits +=2;
    }
    if (!this.game.gameOptions.turmoilExtension) {
      this.terraformRating++;
      this.hasIncreasedTerraformRatingThisGeneration = true;
      return;
    }

    // Turmoil Reds capacity
    if (PartyHooks.shouldApplyPolicy(this.game, PartyName.REDS)) {
      if (this.canAfford(REDS_RULING_POLICY_COST)) {
        this.game.defer(new SelectHowToPayDeferred(this, REDS_RULING_POLICY_COST, {title: 'Select how to pay for TR increase'}));
      } else {
        // Cannot pay Reds, will not increase TR
        return;
      }
    }

    this.terraformRating++;
    this.hasIncreasedTerraformRatingThisGeneration = true;
  }

  public increaseTerraformRatingSteps(value: number) {
    for (let i = 0; i < value; i++) {
      this.increaseTerraformRating();
    }
  }

  public decreaseTerraformRatingSteps(value: number) {
    this.terraformRating -= value;
  }

  public setTerraformRating(value: number) {
    return this.terraformRating = value;
  }

  public getProduction(resource: Resources): number {
    if (resource === Resources.MEGACREDITS) return this.megaCreditProduction;
    if (resource === Resources.STEEL) return this.steelProduction;
    if (resource === Resources.TITANIUM) return this.titaniumProduction;
    if (resource === Resources.PLANTS) return this.plantProduction;
    if (resource === Resources.ENERGY) return this.energyProduction;
    if (resource === Resources.HEAT) return this.heatProduction;
    throw new Error('Resource ' + resource + ' not found');
  }

  public getResource(resource: Resources): number {
    if (resource === Resources.MEGACREDITS) return this.megaCredits;
    if (resource === Resources.STEEL) return this.steel;
    if (resource === Resources.TITANIUM) return this.titanium;
    if (resource === Resources.PLANTS) return this.plants;
    if (resource === Resources.ENERGY) return this.energy;
    if (resource === Resources.HEAT) return this.heat;
    throw new Error('Resource ' + resource + ' not found');
  }
  private resolveMonsInsurance() {
    if (this.game.monsInsuranceOwner !== undefined && this.game.monsInsuranceOwner !== this) {
      const retribution: number = Math.min(this.game.monsInsuranceOwner.megaCredits, 3);
      this.megaCredits += retribution;
      this.game.monsInsuranceOwner.deductResource(Resources.MEGACREDITS, 3);
      if (retribution > 0) {
        this.game.log('${0} received ${1} M€ from ${2} owner (${3})', (b) =>
          b.player(this)
            .number(retribution)
            .cardName(CardName.MONS_INSURANCE)
            .player(this.game.monsInsuranceOwner!));
      }
    }
  }

  private logUnitDelta(resource: Resources, amount: number, unitType: 'production' | 'amount', from: Player | GlobalEventName | undefined) {
    if (amount === 0) {
      // Logging zero units doesn't seem to happen
      return;
    }

    const modifier = amount > 0 ? 'increased' : 'decreased';
    const absAmount = Math.abs(amount);
    // TODO(kberg): remove the ${2} for increased and decreased, I bet it's not used.
    let message = '${0}\'s ${1} ' + unitType + ' ${2} by ${3}';

    if (from !== undefined) {
      message = message + ' by ' + ((from instanceof Player) ? '${4}' : 'Global Event');
    }
    this.game.log(message, (b) => {
      b.player(this)
        .string(resource)
        .string(modifier)
        .number(absAmount);
      if (from instanceof Player) {
        b.player(from);
      }
    });
  }

  public deductResource(
    resource: Resources,
    amount: number,
    options? : {
      log?: boolean,
      from? : Player | GlobalEventName,
    }) {
    this.addResource(resource, -amount, options);
  }

  public addResource(
    resource: Resources,
    amount: number,
    options? : {
      log?: boolean,
      from? : Player | GlobalEventName,
    }) {
    // When amount is negative, sometimes the amount being asked to be removed is more than the player has.
    // delta represents an adjusted amount which basically declares that a player cannot lose more resources
    // then they have.
    const playerAmount = this.getResource(resource);
    const delta = (amount >= 0) ? amount : Math.max(amount, -playerAmount);

    // Lots of calls to addResource used to deduct resources are done by cards and/or players stealing some
    // fixed amount which, if the current player doesn't have it. it just removes as much as possible.
    // (eg. Sabotage.) That's what the delta above, is for.
    //
    // But if the intent is to remove the amount requested (spending 8 plants to place a greenery) then there
    // better be 8 units. The code outside this call is responsible in those cases for making sure the player
    // has enough resource units to pay for an action.
    //
    // In those cases, if the player calls this, but the logic is wrong, the player could wind up with a
    // negative amount of units. This will break other actions in the game. So instead, this method deducts as
    // much as possible, and lots that there was a game error.
    //
    // The shortcut for knowing if this is the case is when `options.from` is undefined.
    if (delta !== amount && options?.from === undefined) {
      this.game.logIllegalState(
        `Adjusting ${amount} ${resource} when player has ${playerAmount}`,
        {player: {color: this.color, id: this.id, name: this.name}, resource, amount});
    }

    if (resource === Resources.MEGACREDITS) this.megaCredits += delta;
    else if (resource === Resources.STEEL) this.steel += delta;
    else if (resource === Resources.TITANIUM) this.titanium += delta;
    else if (resource === Resources.PLANTS) this.plants += delta;
    else if (resource === Resources.ENERGY) this.energy += delta;
    else if (resource === Resources.HEAT) this.heat += delta;
    else {
      throw new Error(`tried to add unsupported resource ${resource}`);
    }

    if (options?.log === true) {
      this.logUnitDelta(resource, delta, 'amount', options.from);
    }

    if (options?.from instanceof Player) {
      LawSuit.resourceHook(this, resource, delta, options.from);
      CrashSiteCleanup.resourceHook(this, resource, delta, options.from);
    }

    // Mons Insurance hook
    if (options?.from !== undefined && delta < 0 && (options.from instanceof Player && options.from.id !== this.id)) {
      this.resolveMonsInsurance();
    }
  }

  public addProduction(resource: Resources, amount : number, options? : { log: boolean, from? : Player | GlobalEventName}) {
    if (resource === Resources.MEGACREDITS) this.megaCreditProduction = this.megaCreditProduction + amount;
    if (resource === Resources.STEEL) this.steelProduction = this.steelProduction + amount;
    if (resource === Resources.TITANIUM) this.titaniumProduction = this.titaniumProduction + amount;
    if (resource === Resources.PLANTS) this.plantProduction = this.plantProduction + amount;
    if (resource === Resources.ENERGY) this.energyProduction = this.energyProduction + amount;

    if (resource === Resources.HEAT) {
      this.heatProduction = this.heatProduction + amount;
      if (amount > 0) this.heatProductionStepsIncreasedThisGeneration += amount; // Hotsprings hook
    }

    if (options?.log === true) {
      this.logUnitDelta(resource, amount, 'production', options.from);
    }

    if (options?.from instanceof Player) {
      LawSuit.resourceHook(this, resource, amount, options.from);
    }

    // Mons Insurance hook
    if (options?.from !== undefined && amount < 0 && (options.from instanceof Player && options.from.id !== this.id)) {
      this.resolveMonsInsurance();
    }

    // Manutech hook
    if (this.isCorporation(CardName.MANUTECH)) {
      Manutech.onProductionGain(this, resource, amount);
    }
  };

  // Returns true when the player has the supplied units in its inventory.
  public hasUnits(units: Units): boolean {
    return this.megaCredits - units.megacredits >= 0 &&
      this.steel - units.steel >= 0 &&
      this.titanium - units.titanium >= 0 &&
      this.plants - units.plants >= 0 &&
      this.energy - units.energy >= 0 &&
      this.heat - units.heat >= 0;
  }

  public deductUnits(units: Units) {
    this.deductResource(Resources.MEGACREDITS, units.megacredits);
    this.deductResource(Resources.STEEL, units.steel);
    this.deductResource(Resources.TITANIUM, units.titanium);
    this.deductResource(Resources.PLANTS, units.plants);
    this.deductResource(Resources.ENERGY, units.energy);
    this.deductResource(Resources.HEAT, units.heat);
  }

  public canAdjustProduction(units: Units): boolean {
    return this.getProduction(Resources.MEGACREDITS) + units.megacredits >= -5 &&
      this.getProduction(Resources.STEEL) + units.steel >= 0 &&
      this.getProduction(Resources.TITANIUM) + units.titanium >= 0 &&
      this.getProduction(Resources.PLANTS) + units.plants >= 0 &&
      this.getProduction(Resources.ENERGY) + units.energy >= 0 &&
      this.getProduction(Resources.HEAT) + units.heat >= 0;
  }

  public adjustProduction(units: Units, options?: {log: boolean, from?: Player}) {
    if (units.megacredits !== undefined) {
      this.addProduction(Resources.MEGACREDITS, units.megacredits, options);
    }

    if (units.steel !== undefined) {
      this.addProduction(Resources.STEEL, units.steel, options);
    }

    if (units.titanium !== undefined) {
      this.addProduction(Resources.TITANIUM, units.titanium, options);
    }

    if (units.plants !== undefined) {
      this.addProduction(Resources.PLANTS, units.plants, options);
    }

    if (units.energy !== undefined) {
      this.addProduction(Resources.ENERGY, units.energy, options);
    }

    if (units.heat !== undefined) {
      this.addProduction(Resources.HEAT, units.heat, options);
    }
  }

  public getActionsThisGeneration(): Set<CardName> {
    return this.actionsThisGeneration;
  }

  public setActionsThisGeneration(cardName: CardName): void {
    this.actionsThisGeneration.add(cardName);
    return;
  }

  public getVictoryPoints(): VictoryPointsBreakdown {
    const victoryPointsBreakdown = new VictoryPointsBreakdown();

    // Victory points from corporations
    if (this.corpCard !== undefined && this.corpCard.getVictoryPoints !== undefined) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.corpCard.getVictoryPoints(this), this.corpCard.name);
    }
    if (this.corpCard2 !== undefined && this.corpCard2.getVictoryPoints !== undefined) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.corpCard2.getVictoryPoints(this), this.corpCard2.name);
    }

    // Victory points from cards
    for (const playedCard of this.playedCards) {
      if (playedCard.getVictoryPoints !== undefined) {
        victoryPointsBreakdown.setVictoryPoints('victoryPoints', playedCard.getVictoryPoints(this), playedCard.name);
      }
    }

    // Victory points from TR
    victoryPointsBreakdown.setVictoryPoints('terraformRating', this.terraformRating);

    // Victory points from awards
    this.giveAwards(victoryPointsBreakdown);

    // Victory points from milestones
    for (const milestone of this.game.claimedMilestones) {
      if (milestone.player !== undefined && milestone.player.id === this.id) {
        victoryPointsBreakdown.setVictoryPoints('milestones', 5, 'Claimed '+milestone.milestone.name+' milestone');
      }
    }

    // Victory points from board
    this.game.board.spaces.forEach((space) => {
      // Victory points for greenery tiles
      if (space.tile && space.tile.tileType === TileType.GREENERY && space.player !== undefined && space.player.id === this.id) {
        victoryPointsBreakdown.setVictoryPoints('greenery', 1);
      }

      // Victory points for greenery tiles adjacent to cities
      if (Board.isCitySpace(space) && space.player !== undefined && space.player.id === this.id) {
        const adjacent = this.game.board.getAdjacentSpaces(space);
        for (const adj of adjacent) {
          if (adj.tile && adj.tile.tileType === TileType.GREENERY) {
            victoryPointsBreakdown.setVictoryPoints('city', 1);
          }
        }
      }
    });

    // Turmoil Victory Points
    const includeTurmoilVP : boolean = this.game.gameIsOver() || this.game.phase === Phase.END;

    if (includeTurmoilVP && this.game.gameOptions.turmoilExtension && this.game.turmoil) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.game.turmoil.getPlayerVictoryPoints(this), 'Turmoil Points');
    }

    // Titania Colony VP
    if (this.colonyVictoryPoints > 0) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.colonyVictoryPoints, 'Colony VP');
    }

    MoonExpansion.calculateVictoryPoints(this, victoryPointsBreakdown);

    victoryPointsBreakdown.updateTotal();
    return victoryPointsBreakdown;
  }

  public cardIsInEffect(cardName: CardName): boolean {
    return this.playedCards.find(
      (playedCard) => playedCard.name === cardName) !== undefined;
  }

  public hasProtectedHabitats(): boolean {
    return this.cardIsInEffect(CardName.PROTECTED_HABITATS);
  }

  public plantsAreProtected(): boolean {
    return this.hasProtectedHabitats() || this.cardIsInEffect(CardName.ASTEROID_DEFLECTION_SYSTEM);
  }

  public alloysAreProtected(): boolean {
    return this.cardIsInEffect(CardName.LUNAR_SECURITY_STATIONS);
  }

  // TODO(kberg): counting cities on the board is done in 3 different places, consolidate.
  // Search for uses of TileType.OCEAN_CITY for reference.
  public getCitiesCount() {
    const game = this.game;
    return game.getSpaceCount(TileType.CITY, this) +
        game.getSpaceCount(TileType.CAPITAL, this) +
        game.getSpaceCount(TileType.OCEAN_CITY, this);
  }

  // Return the number of cards in the player's hand without tags.
  // Wildcard tags are ignored in this computation. (why?)
  public getNoTagsCount() {
    let noTagsCount: number = 0;

    if (this.corpCard !== undefined && this.corpCard.tags.filter((tag) => tag !== Tags.WILDCARD).length === 0) {
      noTagsCount++;
    }
    if (this.corpCard2 !== undefined && this.corpCard2.tags.filter((tag) => tag !== Tags.WILDCARD).length === 0) {
      noTagsCount++;
    }

    noTagsCount += this.playedCards.filter((card) => card.cardType !== CardType.EVENT && card.tags.filter((tag) => tag !== Tags.WILDCARD).length === 0).length;

    return noTagsCount;
  }

  public getColoniesCount() {
    if (!this.game.gameOptions.coloniesExtension) return 0;

    let coloniesCount: number = 0;

    this.game.colonies.forEach((colony) => {
      coloniesCount += colony.colonies.filter((owner) => owner === this).length;
    });

    return coloniesCount;
  }

  public getPlayedEventsCount(): number {
    let count = this.playedCards.filter((card) => card.cardType === CardType.EVENT).length;
    if (this.corpCard !== undefined && this.corpCard.name ===CardName.PHARMACY_UNION && this.corpCard?.isDisabled) count++;
    if (this.corpCard2 !== undefined && this.corpCard2.name ===CardName.PHARMACY_UNION && this.corpCard2?.isDisabled) count++;

    return count;
  }

  public getResourcesOnCard(card: ICard): number | undefined {
    if (card.resourceCount !== undefined) {
      return card.resourceCount;
    } else return undefined;
  }

  // 获取全球参数适应调整值   如：  +-2科技
  public getRequirementsBonus(parameter: GlobalParameter): number {
    let requirementsBonus: number = 0;
    if (
      this.corpCard !== undefined &&
          this.corpCard.getRequirementBonus !== undefined) {
      requirementsBonus += this.corpCard.getRequirementBonus(this, parameter);
    }
    if (
      this.corpCard2 !== undefined &&
          this.corpCard2.getRequirementBonus !== undefined) {
      requirementsBonus += this.corpCard2.getRequirementBonus(this, parameter);
    }

    for (const playedCard of this.playedCards) {
      if (playedCard.getRequirementBonus !== undefined &&
          playedCard.getRequirementBonus(this, parameter)) {
        requirementsBonus += playedCard.getRequirementBonus(this, parameter);
      }
    }

    // PoliticalAgendas Scientists P2 hook
    if (PartyHooks.shouldApplyPolicy(this.game, PartyName.SCIENTISTS, TurmoilPolicy.SCIENTISTS_POLICY_2)) {
      requirementsBonus += 2;
    }

    return requirementsBonus;
  }
  private generateId(): string {
    let id = Math.floor(Math.random() * Math.pow(16, 12)).toString(16);
    while (id.length < 12) {
      id = Math.floor(Math.random() * Math.pow(16, 12)).toString(16);
    }
    return id;
  }
  public removeResourceFrom(card: ICard, count: number = 1, game? : Game, removingPlayer? : Player, shouldLogAction: boolean = true): void {
    if (card.resourceCount) {
      card.resourceCount = Math.max(card.resourceCount - count, 0);
      // Mons Insurance hook
      if (game !== undefined && removingPlayer !== undefined) {
        if (removingPlayer !== this) this.resolveMonsInsurance();

        if (shouldLogAction) {
          game.log('${0} removed ${1} resource(s) from ${2}\'s ${3}', (b) =>
            b.player(removingPlayer)
              .number(count)
              .player(this)
              .card(card));
        }
      }
      // Lawsuit hook
      if (removingPlayer !== undefined && removingPlayer !== this && this.removingPlayers.includes(removingPlayer.id) === false) {
        this.removingPlayers.push(removingPlayer.id);
      }
    }
  }

  public addResourceTo(card: IResourceCard & ICard, options: number | {qty?: number, log?: boolean} = 1): void {
    const count = typeof(options) === 'number' ? options : (options.qty ?? 1);

    if (card.resourceCount !== undefined) {
      card.resourceCount += count;
    }

    // Topsoil contract hook
    if (card.resourceType === ResourceType.MICROBE && this.playedCards.map((card) => card.name).includes(CardName.TOPSOIL_CONTRACT)) {
      this.megaCredits += count;
    }

    // Meat industry hook
    if (card.resourceType === ResourceType.ANIMAL && this.playedCards.map((card) => card.name).includes(CardName.MEAT_INDUSTRY)) {
      this.megaCredits += count * 2;
    }
    // _Celestic_ hook
    if (card.resourceType === ResourceType.FLOATER && this.isCorporation(CardName._CELESTIC_)) {
      this.megaCredits += count;
    }
    // _Arklight_ hook
    if (card.resourceType === ResourceType.ANIMAL && this.isCorporation(CardName._ARKLIGHT_)) {
      this.megaCredits += count;
    }
    if (typeof(options) !== 'number' && options.log === true) {
      LogHelper.logAddResource(this, card, count);
    }
  }
  public getCardsWithResources(resource?: ResourceType): Array<ICard & IResourceCard> {
    let result: Array<ICard & IResourceCard> = this.playedCards.filter((card) => card.resourceType !== undefined && card.resourceCount && card.resourceCount > 0);
    if (this.corpCard !== undefined &&
          this.corpCard.resourceType !== undefined &&
          this.corpCard.resourceCount !== undefined &&
          this.corpCard.resourceCount > 0) {
      result.push(this.corpCard);
    }
    if (this.corpCard2 !== undefined &&
          this.corpCard2.resourceType !== undefined &&
          this.corpCard2.resourceCount !== undefined &&
          this.corpCard2.resourceCount > 0) {
      result.push(this.corpCard2);
    }

    if (resource !== undefined) {
      result = result.filter((card) => card.resourceType === resource);
    }

    return result;
  }

  public getResourceCards(resource: ResourceType | undefined): Array<ICard> {
    let result: Array<ICard> = this.playedCards.filter((card) => card.resourceType !== undefined);

    if (this.corpCard !== undefined && this.corpCard.resourceType !== undefined) {
      result.push(this.corpCard);
    }
    if (this.corpCard2 !== undefined && this.corpCard2.resourceType !== undefined) {
      result.push(this.corpCard2);
    }

    if (resource !== undefined) {
      result = result.filter((card) => card.resourceType === resource);
    }

    return result;
  }

  public getResourceCount(resource: ResourceType): number {
    let count: number = 0;
    this.getCardsWithResources(resource).forEach((card) => {
      count += this.getResourcesOnCard(card)!;
    });
    return count;
  }

  public getCardsByCardType(cardType: CardType) {
    return this.playedCards.filter((card) => card.cardType === cardType);
  }

  // 各种标志的数量
  public getAllTags(): Array<ITagCount> {
    return [
      {tag: Tags.BUILDING, count: this.getTagCount(Tags.BUILDING, false, false)},
      {tag: Tags.CITY, count: this.getTagCount(Tags.CITY, false, false)},
      {tag: Tags.EARTH, count: this.getTagCount(Tags.EARTH, false, false)},
      {tag: Tags.ENERGY, count: this.getTagCount(Tags.ENERGY, false, false)},
      {tag: Tags.JOVIAN, count: this.getTagCount(Tags.JOVIAN, false, false)},
      {tag: Tags.MICROBE, count: this.getTagCount(Tags.MICROBE, false, false)},
      {tag: Tags.MOON, count: this.getTagCount(Tags.MOON, false, false)},
      {tag: Tags.PLANT, count: this.getTagCount(Tags.PLANT, false, false)},
      {tag: Tags.SCIENCE, count: this.getTagCount(Tags.SCIENCE, false, false)},
      {tag: Tags.SPACE, count: this.getTagCount(Tags.SPACE, false, false)},
      {tag: Tags.VENUS, count: this.getTagCount(Tags.VENUS, false, false)},
      {tag: Tags.WILDCARD, count: this.getTagCount(Tags.WILDCARD, false, false)},
      {tag: Tags.ANIMAL, count: this.getTagCount(Tags.ANIMAL, false, false)},
      {tag: Tags.EVENT, count: this.getPlayedEventsCount()},
    ].filter((tag) => tag.count > 0);
  }

  // 某种标志的数量
  public getTagCount(tag: Tags, includeEventsTags:boolean = false, includeTagSubstitutions:boolean = true): number {
    let tagCount = 0;

    this.playedCards.forEach((card: IProjectCard) => {
      if ( ! includeEventsTags && ! this.isCorporation(CardName._INTERPLANETARY_CINEMATICS_) && card.cardType === CardType.EVENT) return;
      tagCount += card.tags.filter((cardTag) => cardTag === tag).length;
    });

    if (this.corpCard !== undefined && !this.corpCard.isDisabled) {
      tagCount += this.corpCard.tags.filter(
        (cardTag) => cardTag === tag,
      ).length;
    }
    if (this.corpCard2 !== undefined && !this.corpCard2.isDisabled) {
      tagCount += this.corpCard2.tags.filter(
        (cardTag) => cardTag === tag,
      ).length;
    }

    // Leavitt Station hook
    if (tag === Tags.SCIENCE && this.scienceTagCount > 0) {
      tagCount += this.scienceTagCount;
    }

    if (includeTagSubstitutions) {
      // Earth Embassy hook
      if (tag === Tags.EARTH && this.playedCards.some((c) => c.name === CardName.EARTH_EMBASSY)) {
        tagCount += this.getTagCount(Tags.MOON, includeEventsTags, false);
      }
      if (tag !== Tags.WILDCARD) {
        tagCount += this.getTagCount(Tags.WILDCARD, includeEventsTags, false);
      }
    } else {
    }
    return tagCount;
  }

  // Return the total number of tags assocaited with these types.
  // Wild tags are included.
  public getMultipleTagCount(tags: Array<Tags>): number {
    let tagCount = 0;
    tags.forEach((tag) => {
      tagCount += this.getTagCount(tag, false, false);
    });
    return tagCount + this.getTagCount(Tags.WILDCARD);
  }

  // TODO(kberg): Describe this function.
  /**
   *
   * @param {boolean} countWild  是否计算问号
   * @param {Tags} extraTag 额外加一个标志， 星际贸易加一个钛标
   * @return {number} 标志种类总和，用以多元化里程碑等
   */
  public getDistinctTagCount(countWild: boolean, extraTag?: Tags): number {
    const allTags: Tags[] = [];
    let wildcardCount: number = 0;
    let eventCount: number = 0;
    if (extraTag !== undefined) {
      allTags.push(extraTag);
    }
    const uniqueTags: Set<Tags> = new Set();
    if (this.corpCard !== undefined && this.corpCard.tags.length > 0 && !this.corpCard.isDisabled) {
      this.corpCard.tags.forEach((tag) => allTags.push(tag));
    }
    if (this.corpCard2 !== undefined && this.corpCard2.tags.length > 0 && !this.corpCard2.isDisabled) {
      this.corpCard2.tags.forEach((tag) => allTags.push(tag));
    }
    this.playedCards.forEach((card) => {
      if (card.cardType === CardType.EVENT) {
        return;
      }
      card.tags.forEach((tag) => {
        allTags.push(tag);
      });
    });
    if (this.isCorporation(CardName._INTERPLANETARY_CINEMATICS_) && this.playedCards.filter((card) => card.cardType === CardType.EVENT).length > 0) {
      eventCount++;
      this.playedCards.filter((card) => card.cardType === CardType.EVENT)
        .forEach((card) => {
          card.tags.forEach((tag) => {
            allTags.push(tag);
          });
        });
    }
    for (const tags of allTags) {
      if (tags === Tags.WILDCARD) {
        wildcardCount++;
      } else {
        uniqueTags.add(tags);
      }
    }
    // Leavitt Station hook
    if (this.scienceTagCount > 0) {
      uniqueTags.add(Tags.SCIENCE);
    }
    if (countWild) {
      return uniqueTags.size + wildcardCount + eventCount;
    } else {
      return uniqueTags.size + eventCount;
    }
  }

  // Return true if this player has all the tags in `tags` showing.
  public checkMultipleTagPresence(tags: Array<Tags>): boolean {
    let distinctCount = 0;
    tags.forEach((tag) => {
      if (this.getTagCount(tag, false, false) > 0) {
        distinctCount++;
      }
    });
    if (distinctCount + this.getTagCount(Tags.WILDCARD) >= tags.length) {
      return true;
    }
    return false;
  }

  private runInputCb(result: PlayerInput | undefined): void {
    if (result !== undefined) {
      this.game.defer(new DeferredAction(this, () => result));
    }
  }

  private checkInputLength(input: ReadonlyArray<ReadonlyArray<string>>, length: number, firstOptionLength?: number) {
    if (input.length !== length) {
      throw new Error('Incorrect options provided');
    }
    if (firstOptionLength !== undefined && input[0].length !== firstOptionLength) {
      throw new Error('Incorrect options provided (nested)');
    }
  }

  private parseHowToPayJSON(json: string): HowToPay {
    const defaults: HowToPay = {
      steel: 0,
      heat: 0,
      titanium: 0,
      megaCredits: 0,
      microbes: 0,
      floaters: 0,
    };
    try {
      const howToPay: HowToPay = JSON.parse(json);
      if (Object.keys(howToPay).every((key) => key in defaults) === false) {
        throw new Error('Input contains unauthorized keys');
      }
      return howToPay;
    } catch (err) {
      throw new Error('Unable to parse HowToPay input ' + err);
    }
  }

  protected runInput(input: ReadonlyArray<ReadonlyArray<string>>, pi: PlayerInput): void {
    if (pi instanceof AndOptions) {
      this.checkInputLength(input, pi.options.length);
      for (let i = 0; i < input.length; i++) {
        this.runInput([input[i]], pi.options[i]);
      }
      this.runInputCb(pi.cb());
    } else if (pi instanceof SelectAmount) {
      this.checkInputLength(input, 1, 1);
      const amount: number = parseInt(input[0][0]);
      if (isNaN(amount)) {
        throw new Error('Number not provided for amount');
      }
      if (amount > pi.max) {
        throw new Error('Amount provided too high (max ' + String(pi.max) + ')');
      }
      if (amount < pi.min) {
        throw new Error('Amount provided too low (min ' + String(pi.min) + ')');
      }
      this.runInputCb(pi.cb(amount));
    } else if (pi instanceof SelectOption) {
      this.runInputCb(pi.cb());
    } else if (pi instanceof SelectColony) {
      this.checkInputLength(input, 1, 1);
      const colony: ColonyName = (input[0][0]) as ColonyName;
      if (colony === undefined) {
        throw new Error('No colony selected');
      }
      this.runInputCb(pi.cb(colony));
    } else if (pi instanceof OrOptions) {
      // input length is variable, can't test it with checkInputLength
      if (input.length === 0 || input[0].length !== 1) {
        throw new Error('Incorrect options provided');
      }
      const optionIndex = parseInt(input[0][0]);
      const selectedOptionInput = input.slice(1);
      this.runInput(selectedOptionInput, pi.options[optionIndex]);
      this.runInputCb(pi.cb());
    } else if (pi instanceof SelectHowToPayForProjectCard) {
      this.checkInputLength(input, 1, 2);
      const cardName = input[0][0];
      const _data = PlayerInput.getCard(pi.cards, cardName);
      const foundCard: IProjectCard = _data.card;
      const howToPay: HowToPay = this.parseHowToPayJSON(input[0][1]);
      const reserveUnits = pi.reserveUnits[_data.idx];
      if (reserveUnits.steel + howToPay.steel > this.steel) {
        throw new Error(`${reserveUnits.steel} units of steel must be reserved for ${cardName}`);
      }
      if (reserveUnits.titanium + howToPay.titanium > this.titanium) {
        throw new Error(`${reserveUnits.titanium} units of titanium must be reserved for ${cardName}`);
      }
      this.runInputCb(pi.cb(foundCard, howToPay));
    } else if (pi instanceof SelectCard) {
      this.checkInputLength(input, 1);
      if (input[0].length < pi.minCardsToSelect) {
        throw new Error('Not enough cards selected');
      }
      if (input[0].length > pi.maxCardsToSelect) {
        throw new Error('Too many cards selected');
      }
      const mappedCards: Array<ICard> = [];
      for (const cardName of input[0]) {
        const cardIndex = PlayerInput.getCard(pi.cards, cardName);
        mappedCards.push(cardIndex.card);
        if (pi.enabled?.[cardIndex.idx] === false) {
          throw new Error('Selected unavailable card');
        }
      }
      this.runInputCb(pi.cb(mappedCards));
      this.checkInputLength(input, 1);
    } else if (pi instanceof SelectGlobalCard) {
      if (input[0].length < pi.minCardsToSelect) {
        throw new Error('Not enough cards selected');
      }
      if (input[0].length > pi.maxCardsToSelect) {
        throw new Error('Too many cards selected');
      }
      const mappedCards: Array<IGlobalEvent> = [];
      for (const cardName of input[0]) {
        mappedCards.push(PlayerInput.getCard(pi.cards, cardName).card);
      }
      this.runInputCb(pi.cb(mappedCards));
    } else if (pi instanceof SelectAmount) {
      this.checkInputLength(input, 1, 1);
      const amount = parseInt(input[0][0]);
      if (isNaN(amount)) {
        throw new Error('Amount is not a number');
      }
      this.runInputCb(pi.cb(amount));
    } else if (pi instanceof SelectSpace) {
      this.checkInputLength(input, 1, 1);
      const foundSpace = pi.availableSpaces.find(
        (space) => space.id === input[0][0],
      );
      if (foundSpace === undefined) {
        throw new Error('Space not available');
      }
      this.runInputCb(pi.cb(foundSpace));
    } else if (pi instanceof SelectPlayer) {
      this.checkInputLength(input, 1, 1);
      const foundPlayer = pi.players.find(
        (player) => player.color === input[0][0] || player.id === input[0][0],
      );
      if (foundPlayer === undefined) {
        throw new Error('Player not available');
      }
      this.runInputCb(pi.cb(foundPlayer));
    } else if (pi instanceof SelectDelegate) {
      this.checkInputLength(input, 1, 1);
      const foundPlayer = pi.players.find((player) =>
        player === input[0][0] ||
        (player instanceof Player && (player.id === input[0][0] || player.color === input[0][0])),
      );
      if (foundPlayer === undefined) {
        throw new Error('Player not available');
      }
      this.runInputCb(pi.cb(foundPlayer));
    } else if (pi instanceof SelectHowToPay) {
      this.checkInputLength(input, 1, 1);
      const howToPay: HowToPay = this.parseHowToPayJSON(input[0][0]);
      this.runInputCb(pi.cb(howToPay));
    } else if (pi instanceof SelectProductionToLose) {
      // TODO(kberg): I'm sure there's some input validation required.
      const units: Units = JSON.parse(input[0][0]);
      pi.cb(units);
    } else if (pi instanceof ShiftAresGlobalParameters) {
      // TODO(kberg): I'm sure there's some input validation required.
      const response: IAresGlobalParametersResponse = JSON.parse(input[0][0]);
      pi.cb(response);
    } else if (pi instanceof SelectPartyToSendDelegate) {
      this.checkInputLength(input, 1, 1);
      const party: PartyName = (input[0][0]) as PartyName;
      if (party === undefined) {
        throw new Error('No party selected');
      }
      this.runInputCb(pi.cb(party));
    } else {
      throw new Error('Unsupported waitingFor');
    }
  }

  public getAvailableBlueActionCount(): number {
    return this.getPlayableActionCards().length;
  }

  private getPlayableActionCards(): Array<ICard> {
    const result: Array<ICard> = [];
    if (
      this.corpCard !== undefined &&
          !this.actionsThisGeneration.has(this.corpCard.name) &&
          this.corpCard.action !== undefined &&
          this.corpCard.canAct !== undefined &&
          this.corpCard.canAct(this)) {
      result.push(this.corpCard);
    }
    if (
      this.corpCard2 !== undefined &&
          !this.actionsThisGeneration.has(this.corpCard2.name) &&
          this.corpCard2.action !== undefined &&
          this.corpCard2.canAct !== undefined &&
          this.corpCard2.canAct(this)) {
      result.push(this.corpCard2);
    }
    for (const playedCard of this.playedCards) {
      if (
        playedCard.action !== undefined &&
              playedCard.canAct !== undefined &&
              !this.actionsThisGeneration.has(playedCard.name) &&
              playedCard.canAct(this)) {
        result.push(playedCard);
      }
    }

    return result;
  }

  public runProductionPhase(): void {
    this.actionsThisGeneration.clear();
    this.removingPlayers = [];
    // Syndicate Pirate Raids hook. If it is in effect, then only the syndicate pirate raider will
    // retrieve their fleets.
    // See Colony.ts for the other half of this effect, and Game.ts which disables it.
    if (this.game.syndicatePirateRaider === undefined) {
      this.tradesThisGeneration = 0;
    } else if (this.game.syndicatePirateRaider === this.id) {
      this.tradesThisGeneration = 0;
    }

    this.turmoilPolicyActionUsed = false;
    this.politicalAgendasActionUsedCount = 0;
    this.megaCredits += this.megaCreditProduction + this.terraformRating;
    this.heat += this.energy;
    this.heat += this.heatProduction;
    this.energy = this.energyProduction;
    this.titanium += this.titaniumProduction;
    this.steel += this.steelProduction;
    this.plants += this.plantProduction;

    if (this.corpCard !== undefined && this.corpCard.onProductionPhase !== undefined) {
      this.corpCard.onProductionPhase(this);
    }
    if (this.corpCard2 !== undefined && this.corpCard2.onProductionPhase !== undefined) {
      this.corpCard2.onProductionPhase(this);
    }
  }

  private doneWorldGovernmentTerraforming(): void {
    this.game.deferredActions.runAll(() => this.game.doneWorldGovernmentTerraforming());
  }

  public worldGovernmentTerraforming(): void {
    const action: OrOptions = new OrOptions();
    action.title = 'Select action for World Government Terraforming';
    action.buttonLabel = 'Confirm';
    const game = this.game;
    if (game.getTemperature() < constants.MAX_TEMPERATURE) {
      action.options.push(
        new SelectOption('Increase temperature', 'Increase', () => {
          game.increaseTemperature(this, 1);
          game.log('${0} acted as World Government and increased temperature', (b) => b.player(this));
          return undefined;
        }),
      );
    }
    if (game.getOxygenLevel() < constants.MAX_OXYGEN_LEVEL) {
      action.options.push(
        new SelectOption('Increase oxygen', 'Increase', () => {
          game.increaseOxygenLevel(this, 1);
          game.log('${0} acted as World Government and increased oxygen level', (b) => b.player(this));
          return undefined;
        }),
      );
    }
    if (game.board.getOceansOnBoard() < constants.MAX_OCEAN_TILES) {
      action.options.push(
        new SelectSpace(
          'Add an ocean',
          game.board.getAvailableSpacesForOcean(this), (space) => {
            game.addOceanTile(this, space.id, SpaceType.OCEAN);
            game.log('${0} acted as World Government and placed an ocean', (b) => b.player(this));
            return undefined;
          },
        ),
      );
    }
    if (game.getVenusScaleLevel() < constants.MAX_VENUS_SCALE && game.gameOptions.venusNextExtension) {
      action.options.push(
        new SelectOption('Increase Venus scale', 'Increase', () => {
          game.increaseVenusScaleLevel(this, 1);
          game.log('${0} acted as World Government and increased Venus scale', (b) => b.player(this));
          return undefined;
        }),
      );
    }

    MoonExpansion.ifMoon(game, (moonData) => {
      if (1===1) {
        // 月球扩不配提世界政府
        return;
      }
      if (moonData.colonyRate < constants.MAXIMUM_COLONY_RATE) {
        action.options.push(
          new SelectOption('Place a colony tile on the Moon', 'Increase', () => {
            game.defer(new PlaceMoonColonyTile(this));
            return undefined;
          }),
        );
      }

      if (moonData.miningRate < constants.MAXIMUM_MINING_RATE) {
        action.options.push(
          new SelectOption('Place a mine tile on the Moon', 'Increase', () => {
            game.defer(new PlaceMoonMineTile(this));
            return undefined;
          }),
        );
      }

      if (moonData.logisticRate < constants.MAXIMUM_LOGISTICS_RATE) {
        action.options.push(
          new SelectOption('Place a road tile on the Moon', 'Increase', () => {
            game.defer(new PlaceMoonRoadTile(this));
            return undefined;
          }),
        );
      }
    });

    this.setWaitingFor(action, () => {
      this.doneWorldGovernmentTerraforming();
    });
  }

  public dealCards(quantity: number, cards: Array<IProjectCard>): void {
    for (let i = 0; i < quantity; i++) {
      cards.push(this.game.dealer.dealCard(this.game, true));
    }
  }

  /*
   * @param initialDraft when true, this is part of the first generation draft.
   * @param playerName  The player _this_ player passes remaining cards to.
   * @param passedCards The cards received from the draw, or from the prior player. If empty, it's the first
   *   step in the draft, and cards have to be dealt.
   */
  public runDraftPhase(initialDraft: boolean, playerName: string, passedCards?: Array<IProjectCard>): void {
    let cardsToKeep = 1;

    let cards: Array<IProjectCard> = [];
    if (passedCards === undefined) {
      if (!initialDraft) {
        let cardsToDraw = 4;
        if (LunaProjectOffice.isActive(this) || this.isCorporation(CardName._TERRALABS_RESEARCH_)) {
          cardsToDraw = 5;
          cardsToKeep = 2;
        }

        this.dealCards(cardsToDraw, cards);
      } else {
        this.dealCards(5, cards);
      }
    } else {
      cards = passedCards;
    }
    const message = cardsToKeep === 1 ?
      'Select a card to keep and pass the rest to ${0}' :
      'Select two cards to keep and pass the rest to ${0}';
    this.setWaitingFor(
      new SelectCard({
        message: message,
        data: [{
          type: LogMessageDataType.RAW_STRING,
          value: playerName,
        }],
      },
      'Keep',
      cards,
      (foundCards: Array<IProjectCard>) => {
        this.draftedCards.push(foundCards[0]);
        cards = cards.filter((card) => card !== foundCards[0]);
        if (cardsToKeep === 2) {
          this.draftedCards.push(foundCards[1]);
          cards = cards.filter((card) => card !== foundCards[1]);
        }
        this.game.playerIsFinishedWithDraftingPhase(initialDraft, this, cards);
        return undefined;
      }, cardsToKeep, cardsToKeep,
      false, undefined, false,
      ),
    );
  }

  /**
   * @return {number} the number of avaialble megacredits. Which is just a shorthand for megacredits,
   * plus any units of heat available thanks to Helion.
   */
  public spendableMegacredits(): number {
    return (this.canUseHeatAsMegaCredits) ? (this.heat + this.megaCredits) : this.megaCredits;
  }

  public runResearchPhase(draftVariant: boolean): void {
    let dealtCards: Array<IProjectCard> = [];
    if (!draftVariant) {
      if (this.isCorporation(CardName._TERRALABS_RESEARCH_)) this.dealCards( 5, dealtCards);
      else this.dealCards(LunaProjectOffice.isActive(this) ? 5 : 4, dealtCards);
    } else {
      dealtCards = this.draftedCards;
      this.draftedCards = [];
    }

    const action = DrawCards.choose(this, dealtCards, {paying: true});
    this.setWaitingFor(action, () => this.game.playerIsFinishedWithResearchPhase(this));
  }

  public getCardCost(card: IProjectCard): number {
    let cost: number = card.cost;
    cost -= this.cardDiscount;

    this.playedCards.forEach((playedCard) => {
      if (playedCard.getCardDiscount !== undefined) {
        cost -= playedCard.getCardDiscount(this, card);
      }
    });

    // Check corporation too
    if (this.corpCard !== undefined && this.corpCard.getCardDiscount !== undefined) {
      cost -= this.corpCard.getCardDiscount(this, card);
    }
    if (this.corpCard2 !== undefined && this.corpCard2.getCardDiscount !== undefined) {
      cost -= this.corpCard2.getCardDiscount(this, card);
    }

    // Playwrights hook
    this.removedFromPlayCards.forEach((removedFromPlayCard) => {
      if (removedFromPlayCard.getCardDiscount !== undefined) {
        cost -= removedFromPlayCard.getCardDiscount(this, card);
      }
    });

    // PoliticalAgendas Unity P4 hook
    if (card.tags.includes(Tags.SPACE) && PartyHooks.shouldApplyPolicy(this.game, PartyName.UNITY, TurmoilPolicy.UNITY_POLICY_4)) {
      cost -= 2;
    }

    return Math.max(cost, 0);
  }

  private canUseSteel(card: ICard): boolean {
    return card.tags.includes(Tags.BUILDING);
  }

  private canUseTitanium(card: ICard): boolean {
    return card.tags.includes(Tags.SPACE);
  }

  private canUseMicrobes(card: ICard): boolean {
    return card.tags.includes(Tags.PLANT);
  }

  private canUseFloaters(card: ICard): boolean {
    return card.tags.includes(Tags.VENUS);
  }

  private getMcTradeCost(): number {
    return MC_TRADE_COST - this.colonyTradeDiscount;
  }

  private getEnergyTradeCost(): number {
    return ENERGY_TRADE_COST - this.colonyTradeDiscount;
  }

  private getTitaniumTradeCost(): number {
    return TITANIUM_TRADE_COST - this.colonyTradeDiscount;
  }

  private playPreludeCard(): PlayerInput {
    return new SelectCard(
      'Select prelude card to play',
      'Play',
      this.getPlayablePreludeCards(),
      (foundCards: Array<IProjectCard>) => {
        return this.playCard(foundCards[0]);
      },
    );
  }

  public checkHowToPayAndPlayCard(selectedCard: IProjectCard, howToPay: HowToPay) {
    const cardCost: number = this.getCardCost(selectedCard);
    let totalToPay: number = 0;

    const canUseSteel: boolean = this.canUseSteel(selectedCard);
    const canUseTitanium: boolean = this.canUseTitanium(selectedCard);

    if (canUseSteel && howToPay.steel > 0) {
      if (howToPay.steel > this.steel) {
        throw new Error('Do not have enough steel');
      }
      totalToPay += howToPay.steel * this.getSteelValue();
    }

    if (canUseTitanium && howToPay.titanium > 0) {
      if (howToPay.titanium > this.titanium) {
        throw new Error('Do not have enough titanium');
      }
      totalToPay += howToPay.titanium * this.getTitaniumValue();
    }

    if (this.canUseHeatAsMegaCredits && howToPay.heat !== undefined) {
      totalToPay += howToPay.heat;
    }

    if (howToPay.microbes !== undefined) {
      totalToPay += howToPay.microbes * DEFAULT_MICROBES_VALUE;
    }

    if (howToPay.floaters !== undefined && howToPay.floaters > 0) {
      if (selectedCard.name === CardName.STRATOSPHERIC_BIRDS && howToPay.floaters === this.getFloatersCanSpend()) {
        const cardsWithFloater = this.getCardsWithResources(ResourceType.FLOATER);
        if (cardsWithFloater.length === 1) {
          throw new Error('Cannot spend all floaters to play Stratospheric Birds');
        }
      }
      totalToPay += howToPay.floaters * DEFAULT_FLOATERS_VALUE;
    }

    if (howToPay.megaCredits > this.megaCredits) {
      throw new Error('Do not have enough M€');
    }

    totalToPay += howToPay.megaCredits;

    if (totalToPay < cardCost) {
      throw new Error('Did not spend enough to pay for card');
    }
    return this.playCard(selectedCard, howToPay);
  }

  public playProjectCard(): PlayerInput {
    return new SelectHowToPayForProjectCard(
      this,
      this.getPlayableCards(),
      (selectedCard, howToPay) => this.checkHowToPayAndPlayCard(selectedCard, howToPay),
    );
  }

  public getMicrobesCanSpend(): number {
    const psychrophiles = this.playedCards.find((card) => card.name === CardName.PSYCHROPHILES);
    if (psychrophiles !== undefined) return this.getResourcesOnCard(psychrophiles)!;

    return 0;
  }

  public getFloatersCanSpend(): number {
    const dirigibles = this.playedCards.find((card) => card.name === CardName.DIRIGIBLES);
    if (dirigibles !== undefined) return this.getResourcesOnCard(dirigibles)!;

    return 0;
  }

  public playCard(selectedCard: IProjectCard, howToPay?: HowToPay, addToPlayedCards: boolean = true): undefined {
    // Pay for card
    if (howToPay !== undefined) {
      this.deductResource(Resources.STEEL, howToPay.steel);
      this.deductResource(Resources.TITANIUM, howToPay.titanium);
      this.deductResource(Resources.MEGACREDITS, howToPay.megaCredits);
      this.deductResource(Resources.HEAT, howToPay.heat);

      for (const playedCard of this.playedCards) {
        if (playedCard.name === CardName.PSYCHROPHILES) {
          this.removeResourceFrom(playedCard, howToPay.microbes);
        }

        if (playedCard.name === CardName.DIRIGIBLES) {
          this.removeResourceFrom(playedCard, howToPay.floaters);
        }
      }
    }

    // Activate some colonies
    if (this.game.gameOptions.coloniesExtension && selectedCard.resourceType !== undefined) {
      this.game.colonies.forEach((colony) => {
        if (colony.resourceType !== undefined && colony.resourceType === selectedCard.resourceType) {
          colony.isActive = true;
        }
      });

      // Check for Venus colony
      if (selectedCard.tags.includes(Tags.VENUS)) {
        const venusColony = this.game.colonies.find((colony) => colony.name === ColonyName.VENUS);
        if (venusColony) venusColony.isActive = true;
      }
    }

    if (selectedCard.cardType !== CardType.PROXY) {
      this.lastCardPlayed = selectedCard;
      this.game.log('${0} played ${1}', (b) => b.player(this).card(selectedCard));
    }

    // Play the card
    const action = selectedCard.play(this);
    if (action !== undefined) {
      this.game.defer(new DeferredAction(
        this,
        () => action,
      ));
    }

    // Remove card from hand
    const projectCardIndex = this.cardsInHand.findIndex((card) => card.name === selectedCard.name);
    const preludeCardIndex = this.preludeCardsInHand.findIndex((card) => card.name === selectedCard.name);
    if (projectCardIndex !== -1) {
      this.cardsInHand.splice(projectCardIndex, 1);
    } else if (preludeCardIndex !== -1) {
      this.preludeCardsInHand.splice(preludeCardIndex, 1);
    }

    // Remove card from Self Replicating Robots
    const card = this.playedCards.find((card) => card.name === CardName.SELF_REPLICATING_ROBOTS);
    if (card instanceof SelfReplicatingRobots) {
      for (const targetCard of card.targetCards) {
        if (targetCard.card.name === selectedCard.name) {
          const index = card.targetCards.indexOf(targetCard);
          card.targetCards.splice(index, 1);
        }
      }
    }

    if (addToPlayedCards && selectedCard.name !== CardName.LAW_SUIT) {
      this.playedCards.push(selectedCard);
    }

    for (const playedCard of this.playedCards) {
      if (playedCard.onCardPlayed !== undefined) {
        const actionFromPlayedCard: OrOptions | void = playedCard.onCardPlayed(this, selectedCard);
        if (actionFromPlayedCard !== undefined) {
          this.game.defer(new DeferredAction(
            this,
            () => actionFromPlayedCard,
          ));
        }
      }
    }

    TurmoilHandler.applyOnCardPlayedEffect(this, selectedCard);

    for (const somePlayer of this.game.getPlayers()) {
      if (somePlayer.corpCard !== undefined && somePlayer.corpCard.onCardPlayed !== undefined) {
        const actionFromPlayedCard: OrOptions | void = somePlayer.corpCard.onCardPlayed(this, selectedCard);
        if (actionFromPlayedCard !== undefined) {
          this.game.defer(new DeferredAction(
            this,
            () => actionFromPlayedCard,
          ));
        }
      }
      if (somePlayer.corpCard2 !== undefined && somePlayer.corpCard2.onCardPlayed !== undefined) {
        const actionFromPlayedCard: OrOptions | void = somePlayer.corpCard2.onCardPlayed(this, selectedCard);
        if (actionFromPlayedCard !== undefined) {
          this.game.defer(new DeferredAction(
            this,
            () => actionFromPlayedCard,
          ));
        }
      }
    }

    return undefined;
  }

  private playActionCard(): PlayerInput {
    return new SelectCard(
      'Perform an action from a played card',
      'Take action',
      this.getPlayableActionCards(),
      (foundCards: Array<ICard>) => {
        const foundCard = foundCards[0];
        this.game.log('${0} used ${1} action', (b) => b.player(this).card(foundCard));
        const action = foundCard.action!(this);
        if (action !== undefined) {
          this.game.defer(new DeferredAction(
            this,
            () => action,
          ));
        }
        this.actionsThisGeneration.add(foundCard.name);
        return undefined;
      }, 1, 1, true,
    );
  }

  public drawCard(count?: number, options?: DrawCards.DrawOptions): undefined {
    return DrawCards.keepAll(this, count, options).execute();
  }

  public drawCardKeepSome(count: number, options: DrawCards.AllOptions): SelectCard<IProjectCard> {
    return DrawCards.keepSome(this, count, options).execute();
  }

  public get availableHeat(): number {
    let resourceOnStorm = 0;
    if (this.corpCard !== undefined && (this.corpCard.name === CardName.STORMCRAFT_INCORPORATED || this.corpCard.name === CardName._STORMCRAFT_INCORPORATED_ )) {
      resourceOnStorm = this.corpCard.resourceCount || 0;
    }
    if (this.corpCard2 !== undefined && (this.corpCard2.name === CardName.STORMCRAFT_INCORPORATED || this.corpCard2.name === CardName._STORMCRAFT_INCORPORATED_ )) {
      resourceOnStorm = this.corpCard2.resourceCount || 0;
    }
    return this.heat + resourceOnStorm * 2;
  }

  public spendHeat(amount: number, cb: () => (undefined | PlayerInput) = () => undefined) : PlayerInput | undefined {
    if (this.corpCard !== undefined && (this.corpCard.name === CardName.STORMCRAFT_INCORPORATED || this.corpCard.name === CardName._STORMCRAFT_INCORPORATED_ ) &&
      this.corpCard.resourceCount! > 0) {
      return (<StormCraftIncorporated> this.corpCard).spendHeat(this, amount, cb);
    }
    if (this.corpCard2 !== undefined && (this.corpCard2.name === CardName.STORMCRAFT_INCORPORATED || this.corpCard2.name === CardName._STORMCRAFT_INCORPORATED_ ) &&
      this.corpCard2.resourceCount! > 0) {
      return (<StormCraftIncorporated> this.corpCard2).spendHeat(this, amount, cb);
    }
    this.deductResource(Resources.HEAT, amount);
    return cb();
  }

  private tradeWithColony(openColonies: Array<Colony>): PlayerInput {
    const opts: Array<OrOptions | SelectColony> = [];
    let payWith: Resources | ResourceType | undefined = undefined;
    const coloniesModel: Array<ColonyModel> = this.game.getColoniesModel(openColonies);
    const titanFloatingLaunchPad = this.playedCards.find((card) => card.name === CardName.TITAN_FLOATING_LAUNCHPAD);
    const mcTradeAmount: number = this.getMcTradeCost();
    const energyTradeAmount: number = this.getEnergyTradeCost();
    const titaniumTradeAmount: number = this.getTitaniumTradeCost();

    const selectColony = new SelectColony('Select colony tile for trade', 'trade', coloniesModel, (colonyName: ColonyName) => {
      openColonies.forEach((colony) => {
        if (colony.name === colonyName) {
          if (payWith === Resources.MEGACREDITS) {
            this.game.defer(new SelectHowToPayDeferred(
              this,
              mcTradeAmount,
              {
                title: 'Select how to pay ' + mcTradeAmount + ' for colony trade',
                afterPay: () => {
                  this.game.log('${0} spent ${1} M€ to trade with ${2}', (b) => b.player(this).number(mcTradeAmount).colony(colony));
                  colony.trade(this);
                },
              },
            ));
          } else if (payWith === Resources.ENERGY) {
            this.deductResource(Resources.ENERGY, energyTradeAmount);
            this.game.log('${0} spent ${1} energy to trade with ${2}', (b) => b.player(this).number(energyTradeAmount).colony(colony));
            colony.trade(this);
          } else if (payWith === Resources.TITANIUM) {
            this.deductResource(Resources.TITANIUM, titaniumTradeAmount);
            this.game.log('${0} spent ${1} titanium to trade with ${2}', (b) => b.player(this).number(titaniumTradeAmount).colony(colony));
            colony.trade(this);
          } else if (payWith === Resources.STEEL) {
            this.steel -= (4 - this.colonyTradeDiscount);
            colony.trade(this);
          } else if (payWith === ResourceType.FLOATER && titanFloatingLaunchPad !== undefined && titanFloatingLaunchPad.resourceCount) {
            titanFloatingLaunchPad.resourceCount--;
            this.actionsThisGeneration.add(titanFloatingLaunchPad.name);
            this.game.log('${0} spent 1 floater to trade with ${1}', (b) => b.player(this).colony(colony));
            colony.trade(this);
          }
          return undefined;
        }
        return undefined;
      });
      return undefined;
    });

    const howToPayForTrade = new OrOptions();
    howToPayForTrade.title = 'Pay trade fee';
    howToPayForTrade.buttonLabel = 'Pay';

    const payWithMC = new SelectOption('Pay ' + mcTradeAmount +' M€', '', () => {
      payWith = Resources.MEGACREDITS;
      return undefined;
    });


    const payWithEnergy = new SelectOption('Pay ' + energyTradeAmount +' Energy', '', () => {
      payWith = Resources.ENERGY;
      return undefined;
    });
    const payWithTitanium = new SelectOption('Pay ' + titaniumTradeAmount +' Titanium', '', () => {
      payWith = Resources.TITANIUM;
      return undefined;
    });


    /* 矿业公司突破：可以4铁贸易*/
    const payWithSteel = new SelectOption('Pay ' + (4 - this.colonyTradeDiscount) +' Steel', '', () => {
      payWith = Resources.STEEL;
      return undefined;
    });
    if (this.isCorporation(CardName._MINING_GUILD_) && this.steel >= (4 - this.colonyTradeDiscount)) {
      howToPayForTrade.options.push(payWithSteel);
    }
    if (titanFloatingLaunchPad !== undefined &&
      titanFloatingLaunchPad.resourceCount !== undefined &&
      titanFloatingLaunchPad.resourceCount > 0 &&
      !this.actionsThisGeneration.has(titanFloatingLaunchPad.name)) {
      howToPayForTrade.options.push(new SelectOption('Pay 1 Floater (use Titan Floating Launch-pad action)', '', () => {
        payWith = ResourceType.FLOATER;
        return undefined;
      }));
    }

    if (this.energy >= energyTradeAmount) howToPayForTrade.options.push(payWithEnergy);
    if (this.titanium >= titaniumTradeAmount) howToPayForTrade.options.push(payWithTitanium);
    if (this.canAfford(mcTradeAmount)) howToPayForTrade.options.push(payWithMC);

    opts.push(howToPayForTrade);
    opts.push(selectColony);

    const trade = new AndOptions(
      () => {
        return undefined;
      },
      ...opts,
    );

    trade.title = 'Trade with a colony tile';
    trade.buttonLabel = 'Trade';

    return trade;
  }

  private claimMilestone(milestone: IMilestone): SelectOption {
    return new SelectOption(milestone.name, 'Claim - ' + '('+ milestone.name + ')', () => {
      this.game.claimedMilestones.push({
        player: this,
        milestone: milestone,
      });
      this.game.defer(new SelectHowToPayDeferred(this, MILESTONE_COST, {title: 'Select how to pay for milestone'}));
      this.game.log('${0} claimed ${1} milestone', (b) => b.player(this).milestone(milestone));
      return undefined;
    });
  }

  private fundAward(award: IAward): PlayerInput {
    return new SelectOption(award.name, 'Fund - ' + '(' + award.name + ')', () => {
      this.game.defer(new SelectHowToPayDeferred(this, this.game.getAwardFundingCost(), {title: 'Select how to pay for award'}));
      this.game.fundAward(this, award);
      return undefined;
    });
  }

  private giveAwards(vpb: VictoryPointsBreakdown): void {
    this.game.fundedAwards.forEach((fundedAward) => {
      // Awards are disabled for 1 player games
      if (this.game.isSoloMode() || this.game.getPlayers().length === 1) return;

      const players: Array<Player> = this.game.getPlayers().slice();
      players.sort(
        (p1, p2) => fundedAward.award.getScore(p2) - fundedAward.award.getScore(p1),
      );

      // We have one rank 1 player
      if (fundedAward.award.getScore(players[0]) > fundedAward.award.getScore(players[1])) {
        if (players[0].id === this.id) vpb.setVictoryPoints('awards', 5, '1st place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
        players.shift();

        if (players.length > 1) {
          // We have one rank 2 player
          if (fundedAward.award.getScore(players[0]) > fundedAward.award.getScore(players[1])) {
            if (players[0].id === this.id) vpb.setVictoryPoints('awards', 2, '2nd place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');

          // We have at least two rank 2 players
          } else {
            const score = fundedAward.award.getScore(players[0]);
            while (players.length > 0 && fundedAward.award.getScore(players[0]) === score) {
              if (players[0].id === this.id) vpb.setVictoryPoints('awards', 2, '2nd place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
              players.shift();
            }
          }
        }

      // We have at least two rank 1 players
      } else {
        const score = fundedAward.award.getScore(players[0]);
        while (players.length > 0 && fundedAward.award.getScore(players[0]) === score) {
          if (players[0].id === this.id) vpb.setVictoryPoints('awards', 5, '1st place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
          players.shift();
        }
      }
    });
  }

  private endTurnOption(): PlayerInput {
    return new SelectOption('End Turn', 'End', () => {
      this.actionsTakenThisRound = 2;
      this.game.log('${0} ended turn', (b) => b.player(this));
      return undefined;
    });
  }

  // Exposed for tests
  public pass(): void {
    this.game.playerHasPassed(this);
    this.lastCardPlayed = undefined;
  }

  private passOption(): PlayerInput {
    return new SelectOption('Pass for this generation', 'Pass', () => {
      this.pass();
      this.game.log('${0} passed', (b) => b.player(this));
      return undefined;
    });
  }

  // Propose a new action to undo last action
  private undoTurnOption(): PlayerInput {
    return new SelectOption('Undo last action', 'Undo', () => {
      try {
        this.undoing = true;// To prevent going back into takeAction()
        Database.getInstance().restoreGame(this.game.id, this.game.lastSaveId, this.game, this.id);
        this.game.undoCount ++;
      } catch (error) {
        console.log(error);
      }
      return undefined;
    });
  }
  public takeActionForFinalGreenery(): void {
    // Resolve any deferredAction before placing the next greenery
    // Otherwise if two tiles are placed next to Philares, only the last benefit is triggered
    // if Philares does not accept the first bonus before the second tile is down
    if (this.game.deferredActions.length > 0) {
      this.resolveFinalGreeneryDeferredActions();
      return;
    }

    if (this.game.canPlaceGreenery(this)) {
      const action: OrOptions = new OrOptions();
      action.title = 'Place any final greenery from plants';
      action.buttonLabel = 'Confirm';
      action.options.push(
        new SelectSpace(
          'Select space for greenery',
          this.game.board.getAvailableSpacesForGreenery(this), (space) => {
            // Do not raise oxygen or award TR for final greenery placements
            this.game.addGreenery(this, space.id, SpaceType.LAND, false);
            this.deductResource(Resources.PLANTS, this.plantsNeededForGreenery);

            this.takeActionForFinalGreenery();

            // Resolve Philares deferred actions
            if (this.game.deferredActions.length > 0) this.resolveFinalGreeneryDeferredActions();

            return undefined;
          },
        ),
      );
      action.options.push(
        new SelectOption('Don\'t place a greenery', 'Confirm', () => {
          this.game.playerIsDoneWithGame(this);
          return undefined;
        }),
      );
      this.setWaitingFor(action);
      return;
    }

    if (this.game.deferredActions.length > 0) {
      this.resolveFinalGreeneryDeferredActions();
    } else {
      this.game.playerIsDoneWithGame(this);
    }
  }

  private resolveFinalGreeneryDeferredActions() {
    this.game.deferredActions.runAll(() => this.takeActionForFinalGreenery());
  }

  private getPlayablePreludeCards(): Array<IProjectCard> {
    return this.preludeCardsInHand.filter((card) => card.canPlay === undefined || card.canPlay(this));
  }

  public getPlayableCards(): Array<IProjectCard> {
    const candidateCards: Array<IProjectCard> = [...this.cardsInHand];
    // Self Replicating robots check
    const card = this.playedCards.find((card) => card.name === CardName.SELF_REPLICATING_ROBOTS);
    if (card instanceof SelfReplicatingRobots) {
      for (const targetCard of card.targetCards) {
        candidateCards.push(targetCard.card);
      }
    }

    return candidateCards.filter((card) => this.canPlay(card));
  }

  public canPlay(card: IProjectCard): boolean {
    const canAfford = this.canAfford(
      this.getCardCost(card),
      {
        steel: this.canUseSteel(card),
        titanium: this.canUseTitanium(card),
        floaters: this.canUseFloaters(card),
        microbes: this.canUseMicrobes(card),
        reserveUnits: MoonExpansion.adjustedReserveCosts(this, card),
      });

    return canAfford && (card.canPlay === undefined || card.canPlay(this));
  }

  // Checks if the player can afford to pay `cost` mc (possibly replaceable with steel, titanium etc.)
  // and additionally pay the reserveUnits (no replaces here)
  public canAfford(cost: number, options?: {
    steel?: boolean,
    titanium?: boolean,
    floaters?: boolean,
    microbes?: boolean,
    reserveUnits?: Units
  }) {
    const reserveUnits = options?.reserveUnits ?? Units.EMPTY;
    if (!this.hasUnits(reserveUnits)) {
      return false;
    }

    const canUseSteel: boolean = options?.steel ?? false;
    const canUseTitanium: boolean = options?.titanium ?? false;
    const canUseFloaters: boolean = options?.floaters ?? false;
    const canUseMicrobes: boolean = options?.microbes ?? false;

    return cost <=
      this.megaCredits - reserveUnits.megacredits +
      (this.canUseHeatAsMegaCredits ? this.heat - reserveUnits.heat : 0) +
      (canUseSteel ? (this.steel - reserveUnits.steel) * this.getSteelValue() : 0) +
      (canUseTitanium ? (this.titanium - reserveUnits.titanium) * this.getTitaniumValue() : 0) +
      (canUseFloaters ? this.getFloatersCanSpend() * 3 : 0) +
      (canUseMicrobes ? this.getMicrobesCanSpend() * 2 : 0);
  }

  private getStandardProjects(): Array<StandardProjectCard> {
    return new CardLoader(this.game.gameOptions)
      .getStandardProjects()
      .filter((card) => {
        // sell patents is not displayed as a card
        if (card.name === CardName.SELL_PATENTS_STANDARD_PROJECT) {
          return false;
        }
        // For buffer gas, show ONLY IF in solo AND 63TR mode
        if (card.name === CardName.BUFFER_GAS_STANDARD_PROJECT) {
          return (this.game.isSoloMode() && this.game.gameOptions.soloTR);
        }
        return true;
      })
      .sort((a, b) => a.cost - b.cost);
  }

  protected getStandardProjectOption(): SelectCard<StandardProjectCard> {
    const standardProjects: Array<StandardProjectCard> = this.getStandardProjects();

    return new SelectCard(
      'Standard projects',
      'Confirm',
      standardProjects,
      (card) => card[0].action(this),
      1, 1, false,
      standardProjects.map((card) => card.canAct(this)),
    );
  }

  // 返回玩家可选的行动
  public takeAction(): void {
    const game = this.game;

    if (game.deferredActions.length > 0) {
      this.canExit = false;
      game.deferredActions.runAll(() => this.takeAction());
      return;
    }

    // undoing 参数不能入库
    if (this.undoing) {
      this.waitingFor = undefined;
      return;
    }


    // Prelude cards have to be played first
    if (this.preludeCardsInHand.length > 0) {
      game.phase = Phase.PRELUDES;

      // If no playable prelude card in hand, end player turn
      if (this.getPlayablePreludeCards().length === 0) {
        this.preludeCardsInHand = [];
        game.playerIsFinishedTakingActions();
        return;
      }

      this.setWaitingFor(this.playPreludeCard(), () => {
        if (this.preludeCardsInHand.length === 1) {
          this.takeAction();
        } else {
          game.playerIsFinishedTakingActions();
        }
      });
      return;
    } else if (game.phase === Phase.PRELUDES) {
      game.phase = Phase.ACTION;
    }

    if (this.corpInitAction()) {
      return;
    }

    if (game.hasPassedThisActionPhase(this) || this.actionsTakenThisRound >= 3 || (this.actionsTakenThisRound >= 2 && game.getPlayers().length === 1 )) {
      this.actionsTakenThisRound = 0;
      this.canExit = false;
      this.undoing = false;
      game.playerIsFinishedTakingActions();
      return;
    }
    this.canExit = true;

    this.setWaitingFor(this.getActions(), () => {
      this.actionsTakenThisRound++;
      this.takeAction();
    });
  }

  private corpInitAction() :boolean {
    // Terraforming Mars FAQ says:
    //   If for any reason you are not able to perform your mandatory first action (e.g. if
    //   all 3 Awards are claimed before starting your turn as Vitor), you can skip this and
    //   proceed with other actions instead.
    // This code just uses "must skip" instead of "can skip".
    const corpCard = this.corpCard;
    if (corpCard?.name === CardName.VITOR && this.game.allAwardsFunded()) {
      this.corpInitialActionDone = true;
    }
    const initialActionOrPass = new OrOptions();
    if (corpCard !== undefined &&
      corpCard.initialAction !== undefined &&
          this.corpInitialActionDone === false
    ) {
      const initialActionOption = new SelectOption(
        {
          message: 'Take first action of ${0} corporation',
          data: [{
            type: LogMessageDataType.RAW_STRING,
            value: corpCard.name,
          }],
        },
        corpCard.initialActionText === undefined ? 'Initial Action' : corpCard.initialActionText, () => {
          this.game.defer(new DeferredAction(this, () => {
            if (corpCard.initialAction) {
              return corpCard.initialAction(this);
            } else {
              return undefined;
            }
          }));
          this.corpInitialActionDone = true;
          return undefined;
        },
      );
      initialActionOrPass.options.push(initialActionOption);
    }

    // 公司2
    const corpCard2 = this.corpCard2;
    if (corpCard2?.name === CardName.VITOR && this.game.allAwardsFunded()) {
      this.corp2InitialActionDone = true;
    }

    if (corpCard2 !== undefined &&
      corpCard2.initialAction !== undefined &&
          this.corp2InitialActionDone === false
    ) {
      const initialActionOption = new SelectOption(
        {
          message: 'Take first action of ${0} corporation',
          data: [{
            type: LogMessageDataType.RAW_STRING,
            value: corpCard2.name,
          }],
        },
        corpCard2.initialActionText === undefined ? 'Initial Action' : corpCard2.initialActionText, () => {
          this.game.defer(new DeferredAction(this, () => {
            if (corpCard2.initialAction) {
              return corpCard2.initialAction(this);
            } else {
              return undefined;
            }
          }));
          this.corp2InitialActionDone = true;
          return undefined;
        },
      );
      initialActionOrPass.options.push(initialActionOption);
    }
    if (initialActionOrPass.options.length > 0) {
      this.setWaitingFor(initialActionOrPass, () => {
        this.actionsTakenThisRound++;
        this.takeAction();
      });
      return true;
    }
    return false;
  }

  // Return possible mid-game actions like play a card and fund an award, but no play prelude card.
  public getActions() {
    const action: OrOptions = new OrOptions();
    action.id = this.generateId();
    action.title = this.actionsTakenThisRound === 0 ?
      'Take your first action' : 'Take your next action';
    action.buttonLabel = 'Take action';

    if (this.actionsTakenThisRound >= 2 && this.game.getPlayers().length > 1 ) {
      // end turn
      if (this.actionsTakenThisRound > 0) {
        action.options.push(
          this.endTurnOption(),
        );
      }
      // undo
      if (this.game.gameOptions.undoOption && ( !this.game.cardDrew || this.game.isSoloMode())) {
        action.options.push(this.undoTurnOption());
      }
      return action;
    }

    // Chaos hook
    for (const somePlayer of this.game.getPlayers()) {
      if (somePlayer.corpName(CardName.CHAOS)) {
        const resourceArray = [Resources.MEGACREDITS, Resources.STEEL, Resources.TITANIUM, Resources.PLANTS, Resources.ENERGY, Resources.HEAT];
        let bonus = 0;
        if (this.game.isSoloMode()) {
          resourceArray.forEach((resource: Resources)=>{
            if (somePlayer.getProduction(resource) >= 1) {
              bonus ++;
            }
          });
        } else {
          resourceArray.forEach((resource: Resources)=>{
            const players = [...this.game.getAllPlayers()].sort(
              (p1, p2) => p2.getProduction(resource) - p1.getProduction(resource),
            );
            if (players[0].id === somePlayer.id && players[0].getProduction(resource) > players[1].getProduction(resource) && players[0].getProduction(resource) >= 1) {
              bonus ++;
            }
          });
        }
        const wildtags = [];
        for (let index = 0; index < bonus; index++) {
          wildtags.push(Tags.WILDCARD);
        }
        if (somePlayer.corpCard?.name === CardName.CHAOS) {
          somePlayer.corpCard.tags = wildtags;
        }
        if (somePlayer.corpCard2?.name === CardName.CHAOS) {
          somePlayer.corpCard2.tags = wildtags;
        }
      }
    }

    if (this.canAfford(MILESTONE_COST) && !this.game.allMilestonesClaimed()) {
      const remainingMilestones = new OrOptions();
      remainingMilestones.title = 'Claim a milestone';
      remainingMilestones.options = this.game.milestones
        .filter(
          (milestone: IMilestone) =>
            !this.game.milestoneClaimed(milestone) &&
            milestone.canClaim(this))
        .map(
          (milestone: IMilestone) =>
            this.claimMilestone(milestone));
      if (remainingMilestones.options.length >= 1) action.options.push(remainingMilestones);
    }

    // Convert Plants
    const convertPlants = new ConvertPlants();
    if (convertPlants.canAct(this)) {
      action.options.push(convertPlants.action(this));
    }

    // Convert Heat
    const convertHeat = new ConvertHeat();
    if (convertHeat.canAct(this)) {
      action.options.push(new SelectOption(`Convert ${this.heatForTemperature} heat into temperature`, 'Convert heat', () => {
        return convertHeat.action(this);
      }));
    }

    // 兄弟会
    // 遍历政党，通过getDelegates获得中立代表数量，delete并直接add对应代表，之后checkPartyLeader。
    if (this.corpCard !== undefined && this.corpCard.name === CardName.BROTHERHOOD_OF_MUTANTS && this.corpCard.isUsed === false ||
      this.corpCard2 !== undefined && this.corpCard2.name === CardName.BROTHERHOOD_OF_MUTANTS && this.corpCard2.isUsed === false) {
      action.options.push(
        new SelectOption('Mutant and Proud (transform all neutral delegates to your delegates)', 'Transform', () => {
          if (this.game.turmoil !== undefined) {
            const turmoil = this.game.turmoil;
            const parties = this.game.turmoil.parties;
            parties.forEach((party)=>{
              const neutral = party.getDelegates('NEUTRAL');
              for (let i=0; i<neutral; i++) {
                turmoil.removeDelegateFromParty('NEUTRAL', party.name, this.game);
                turmoil.delegateReserve.push(this);
                turmoil.sendDelegateToParty(this, party.name, this.game, 'reserve');
              }
            });
            this.game.log('${0} transforms all neutral delegates to his members.', (b) => b.player(this));
            this.corpCard!.name === CardName.BROTHERHOOD_OF_MUTANTS ? this.corpCard!.isUsed = true : this.corpCard2!.isUsed = true;
            return undefined;
          }
          return undefined;
        }),
      );
    }

    TurmoilHandler.addPlayerAction(this, action.options);

    if (this.getPlayableActionCards().length > 0) {
      action.options.push(
        this.playActionCard(),
      );
    }

    if (this.getPlayableCards().length > 0) {
      action.options.push(
        this.playProjectCard(),
      );
    }

    if (this.game.gameOptions.coloniesExtension) {
      const openColonies = this.game.colonies.filter((colony) => colony.isActive && colony.visitor === undefined);
      if (openColonies.length > 0 &&
        this.fleetSize > this.tradesThisGeneration &&
        (this.canAfford(this.getMcTradeCost()) ||
          this.energy >= this.getEnergyTradeCost() ||
          this.titanium >= (3 - this.colonyTradeDiscount) ||
          ( this.isCorporation(CardName._MINING_GUILD_) && this.steel >= (4 - this.colonyTradeDiscount)))
      ) {
        action.options.push(
          this.tradeWithColony(openColonies),
        );
      }
    }

    // If you can pay to add a delegate to a party.
    if (this.game.gameOptions.turmoilExtension && this.game.turmoil !== undefined) {
      let sendDelegate;
      if (this.game.turmoil?.lobby.has(this.id)) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (from lobby)');
      } else if (this.isCorporation(CardName.INCITE) && this.canAfford(3) && this.game.turmoil.getDelegatesInReserve(this) > 0) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (3 M€)', {cost: 3});
      } else if (this.canAfford(5) && this.game.turmoil.getDelegatesInReserve(this) > 0) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (5 M€)', {cost: 5});
      }
      if (sendDelegate) {
        const input = sendDelegate.execute();
        if (input !== undefined) {
          action.options.push(input);
        }
      }
    }

    if (this.game.getPlayers().length > 1 &&
      this.actionsTakenThisRound > 0 &&
      !this.game.gameOptions.fastModeOption &&
      this.allOtherPlayersHavePassed() === false) {
      action.options.push(
        this.endTurnOption(),
      );
    }

    if (this.canAfford(this.game.getAwardFundingCost()) && !this.game.allAwardsFunded()) {
      const remainingAwards = new OrOptions();
      remainingAwards.title = 'Fund an award';
      remainingAwards.buttonLabel = 'Confirm';
      remainingAwards.options = this.game.awards
        .filter((award: IAward) => this.game.hasBeenFunded(award) === false)
        .map((award: IAward) => this.fundAward(award));
      action.options.push(remainingAwards);
    }

    action.options.push(this.getStandardProjectOption());

    action.options.push(this.passOption());

    // Sell patents
    const sellPatents = new SellPatentsStandardProject();
    if (sellPatents.canAct(this)) {
      action.options.push(sellPatents.action(this));
    }

    // Propose undo action only if you have done one action this turn
    if (this.actionsTakenThisRound > 0 && this.game.gameOptions.undoOption && !this.game.cardDrew) {
      action.options.push(this.undoTurnOption());
    }
    return action;
  }

  private allOtherPlayersHavePassed(): boolean {
    const game = this.game;
    if (game.isSoloMode()) return true;
    const players = game.getPlayers();
    const passedPlayers = game.getPassedPlayers();
    return passedPlayers.length === players.length - 1 && passedPlayers.includes(this.color) === false;
  }


  public process(input: any): void {
    if (this.waitingFor === undefined || this.waitingForCb === undefined) {
      throw new Error('Not waiting for anything');
    }
    if (input.id && this.waitingFor instanceof OrOptions && this.waitingFor.id ) {
      if (input.id !== this.waitingFor.id) {
        throw new Error('Not Exact Id');
      }
    }
    let input2: Array<Array<string>> = input.input;
    if (input2 === undefined ) {
      input2 = input;
    }

    const waitingFor = this.waitingFor;
    const waitingForCb = this.waitingForCb;
    this.waitingFor = undefined;
    this.waitingForCb = undefined;
    try {
      this.timer.stop();
      this.runInput(input2, waitingFor);
      waitingForCb();
    } catch (err) {
      this.setWaitingFor(waitingFor, waitingForCb);
      throw err;
    }
  }

  public getWaitingFor(): PlayerInput | undefined {
    return this.waitingFor;
  }
  public setWaitingFor(input: PlayerInput | undefined, cb: (() => void) | undefined = () => {}): void {
    if (this.game.phase !== Phase.END) {
      this.timer.start();
    }
    this.waitingFor = input;
    this.waitingForCb = cb;
  }

  public canExitFun(game:Game):boolean {
    return this.canExit && game.phase === Phase.ACTION && game.activePlayer === this && game.getPlayers().length > 1;
  }

  private serializePlayedCards(): Array<SerializedCard> {
    return this.playedCards.map((c) => {
      const result: SerializedCard = {
        name: c.name,
      };
      if (c.bonusResource !== undefined) {
        result.bonusResource = c.bonusResource;
      }
      if (c.resourceCount !== undefined) {
        result.resourceCount = c.resourceCount;
      }
      if (c instanceof SelfReplicatingRobots) {
        (result as any).targetCards = c.targetCards.map((t) => {
          return {
            card: {name: t.card.name},
            resourceCount: t.resourceCount,
          };
        });
      }
      return result;
    });
  }

  public serialize(): SerializedPlayer {
    const result: SerializedPlayer = {
      id: this.id,
      // corporationCard: this.corporationCard,
      corpCard: this.corpCard,
      corpCard2: this.corpCard2,
      // Used only during set-up
      pickedCorporationCard: this.pickedCorporationCard,
      pickedCorporationCard2: this.pickedCorporationCard2,
      // Terraforming Rating
      terraformRating: this.terraformRating,
      hasIncreasedTerraformRatingThisGeneration: this.hasIncreasedTerraformRatingThisGeneration,
      terraformRatingAtGenerationStart: this.terraformRatingAtGenerationStart,
      // Resources
      megaCredits: this.megaCredits,
      megaCreditProduction: this.megaCreditProduction,
      steel: this.steel,
      steelProduction: this.steelProduction,
      titanium: this.titanium,
      titaniumProduction: this.titaniumProduction,
      plants: this.plants,
      plantProduction: this.plantProduction,
      energy: this.energy,
      energyProduction: this.energyProduction,
      heat: this.heat,
      heatProduction: this.heatProduction,
      heatProductionStepsIncreasedThisGeneration: this.heatProductionStepsIncreasedThisGeneration,
      heatForTemperature: this.heatForTemperature,
      // Resource values
      titaniumValue: this.titaniumValue,
      steelValue: this.steelValue,
      // Helion
      canUseHeatAsMegaCredits: this.canUseHeatAsMegaCredits,
      // This generation / this round
      actionsTakenThisRound: this.actionsTakenThisRound,
      actionsThisGeneration: Array.from(this.actionsThisGeneration),
      // corporationInitialActionDone: this.corpInitialActionDone,
      // Cards
      dealtCorporationCards: this.dealtCorporationCards,
      dealtProjectCards: this.dealtProjectCards,
      dealtPreludeCards: this.dealtPreludeCards,
      cardsInHand: this.cardsInHand,
      preludeCardsInHand: this.preludeCardsInHand,
      playedCards: this.serializePlayedCards(),
      draftedCards: this.draftedCards,
      cardCost: this.cardCost,
      cardDiscount: this.cardDiscount,
      // Colonies
      fleetSize: this.fleetSize,
      tradesThisGeneration: this.tradesThisGeneration,
      colonyTradeOffset: this.colonyTradeOffset,
      colonyTradeDiscount: this.colonyTradeDiscount,
      colonyVictoryPoints: this.colonyVictoryPoints,
      // Turmoil
      turmoilPolicyActionUsed: this.turmoilPolicyActionUsed,
      politicalAgendasActionUsedCount: this.politicalAgendasActionUsedCount,
      hasTurmoilScienceTagBonus: this.hasTurmoilScienceTagBonus,
      oceanBonus: this.oceanBonus,
      // Custom cards
      // Leavitt Station.
      scienceTagCount: this.scienceTagCount,
      // Ecoline
      plantsNeededForGreenery: this.plantsNeededForGreenery,
      // Lawsuit
      removingPlayers: this.removingPlayers,
      // Playwrights
      removedFromPlayCards: this.removedFromPlayCards,
      name: this.name,
      color: this.color,
      beginner: this.beginner,
      handicap: this.handicap,
      timer: this.timer.serialize(),
      undoing: this.undoing,
      exited: this.exited,
      canExit: this.canExit,
    };
    if (this.lastCardPlayed !== undefined) {
      result.lastCardPlayed = this.lastCardPlayed;
    }
    return result;
  }

  public static deserialize(d: SerializedPlayer): Player {
    const player = new Player(d.name, d.color, d.beginner, Number(d.handicap), d.id);
    const cardFinder = new CardFinder();

    Object.assign(player, d);
    player.tradesThisGeneration = d.tradesThisGeneration === undefined ? (d as any).tradesThisTurn : d.tradesThisGeneration;

    player.lastCardPlayed = d.lastCardPlayed !== undefined ?
      cardFinder.getProjectCardByName(d.lastCardPlayed.name) :
      undefined;

    // Rebuild removed from play cards (Playwrights)
    player.removedFromPlayCards = cardFinder.cardsFromJSON(d.removedFromPlayCards);

    player.actionsThisGeneration = new Set<CardName>(d.actionsThisGeneration);

    if (d.pickedCorporationCard !== undefined) {
      player.pickedCorporationCard = cardFinder.getCorporationCardByName(d.pickedCorporationCard.name);
    }
    if (d.pickedCorporationCard2 !== undefined) {
      player.pickedCorporationCard2 = cardFinder.getCorporationCardByName(d.pickedCorporationCard2.name);
    }

    // Rebuild corporation card
    if (d.corpCard !== undefined) {
      player.corpCard = cardFinder.getCorporationCardByName(d.corpCard.name);
      if (player.corpCard !== undefined) {
        if (d.corpCard.resourceCount !== undefined) {
          player.corpCard.resourceCount = d.corpCard.resourceCount;
        }
        if ((d.corpCard as any).allTags !== undefined) {
          (player.corpCard as any).allTags = new Set((d.corpCard as any).allTags);
        }
        if ((d.corpCard as any).isDisabled !== undefined) {
          player.corpCard.isDisabled = Boolean(d.corpCard.isDisabled);
        }
        if ((d.corpCard as any).isUsed !== undefined) {
          (player.corpCard as any).isUsed = Boolean((d.corpCard as any).isUsed);
        }
      }
    } else {
      player.corpCard = undefined;
    }
    if (d.corpCard2 !== undefined) {
      player.corpCard2 = cardFinder.getCorporationCardByName(d.corpCard2.name);
      if (player.corpCard2 !== undefined) {
        if (d.corpCard2.resourceCount !== undefined) {
          player.corpCard2.resourceCount = d.corpCard2.resourceCount;
        }
        if ((d.corpCard2 as any).allTags !== undefined) {
          (player.corpCard2 as any).allTags = new Set((d.corpCard2 as any).allTags);
        }
        if ((d.corpCard2 as any).isDisabled !== undefined) {
          player.corpCard2.isDisabled = Boolean(d.corpCard2.isDisabled);
        }
        if ((d.corpCard2 as any).isUsed !== undefined) {
          (player.corpCard2 as any).isUsed = Boolean((d.corpCard2 as any).isUsed);
        }
      }
    } else {
      player.corpCard2 = undefined;
    }

    // Rebuild dealt corporation array
    if (d.dealtCorporationCards !== undefined ) {
      player.dealtCorporationCards = cardFinder.corporationCardsFromJSON(d.dealtCorporationCards);
    }

    // Rebuild dealt prelude array
    if (d.dealtPreludeCards !== undefined ) {
      player.dealtPreludeCards = cardFinder.cardsFromJSON(d.dealtPreludeCards);
    }

    // Rebuild dealt cards array
    if (d.dealtProjectCards !== undefined ) {
      player.dealtProjectCards = cardFinder.cardsFromJSON(d.dealtProjectCards);
    }

    // Rebuild each cards in hand
    if (d.cardsInHand !== undefined ) {
      player.cardsInHand = cardFinder.cardsFromJSON(d.cardsInHand);
    }
    // Rebuild each prelude in hand
    if (d.preludeCardsInHand !== undefined ) {
      player.preludeCardsInHand = cardFinder.cardsFromJSON(d.preludeCardsInHand);
    }

    // Rebuild each played card
    if (d.playedCards !== undefined) {
      player.playedCards = d.playedCards.map((element: SerializedCard) => {
        const card = cardFinder.getProjectCardByName(element.name)!;
        if (element.resourceCount !== undefined) {
          card.resourceCount = element.resourceCount;
        }
        if (card instanceof SelfReplicatingRobots) {
          const targetCards = (element as SelfReplicatingRobots).targetCards;
          if (targetCards !== undefined) {
            card.targetCards = targetCards;
            card.targetCards.forEach((targetCard) => {
              const foundTargetCard = cardFinder.getProjectCardByName(targetCard.card.name);
              if (foundTargetCard !== undefined) {
                targetCard.card = foundTargetCard;
              } else {
                console.warn('did not find card for SelfReplicatingRobots', targetCard);
              }
            });
          }
        }
        if (card instanceof MiningCard && element.bonusResource !== undefined) {
          card.bonusResource = element.bonusResource;
        }
        return card;
      });
    }
    // Rebuild each drafted cards
    if (d.draftedCards !== undefined) {
      player.draftedCards = cardFinder.cardsFromJSON(d.draftedCards);
    }
    player.timer = Timer.deserialize(d.timer);

    return player;
  }

  public getFleetSize(): number {
    return this.fleetSize;
  }

  public increaseFleetSize(): void {
    if (this.fleetSize < MAX_FLEET_SIZE) this.fleetSize++;
  }

  public decreaseFleetSize(): void {
    if (this.fleetSize > 0) this.fleetSize--;
  }

  public hasAvailableColonyTileToBuildOn(): boolean {
    if (this.game.gameOptions.coloniesExtension === false) return false;

    let colonyTilesAlreadyBuiltOn: number = 0;

    this.game.colonies.forEach((colony) => {
      if (colony.colonies.includes(this)) colonyTilesAlreadyBuiltOn++;
    });

    return colonyTilesAlreadyBuiltOn < this.game.colonies.length;
  }


  // 双将公司操作
  public corpName(cardName:CardName): boolean {
    if (this.corpCard !== undefined && this.corpCard.name === cardName) {
      return true;
    }
    if (this.corpCard2 !== undefined && this.corpCard2.name === cardName) {
      return true;
    }
    return false;
  }

  public corpResourceType(resourceType: ResourceType): boolean {
    if (this.corpCard !== undefined && this.corpCard.resourceType === resourceType) {
      return true;
    }
    if (this.corpCard2 !== undefined && this.corpCard2.resourceType === resourceType) {
      return true;
    }
    return false;
  }
}
