import {ICard} from './ICard';
import { Player } from "../Player";
import { Game } from "../Game";
import { IProjectCard } from "./IProjectCard";
import { Tags } from "./Tags";
import { CardType } from "./CardType";
import { OrOptions } from "../inputs/OrOptions";
import { SelectCard } from "../inputs/SelectCard";
import { SelectOption } from "../inputs/SelectOption";
import { PlayerInput } from "../PlayerInput";
import { ResourceType } from '../ResourceType';
import { CardName } from '../CardName';
import { LogHelper } from '../components/LogHelper';

export class LargeConvoy implements IProjectCard {
    public cost: number = 36;
    public tags: Array<Tags> = [Tags.EARTH, Tags.SPACE];
    public name: CardName = CardName.LARGE_CONVOY;
    public cardType: CardType = CardType.EVENT;

    public play(player: Player, game: Game): PlayerInput | undefined {
        player.cardsInHand.push(game.dealer.dealCard(), game.dealer.dealCard());

        const animalCards = player.getResourceCards(ResourceType.ANIMAL);

        const gainPlants = function() {
            player.plants += 5;
            LogHelper.logGainPlants(game, player, 5);
            game.addOceanInterrupt(player);
            return undefined;
        }

        if (animalCards.length === 0 ) return gainPlants();

        let availableActions = new Array<SelectOption | SelectCard<ICard>>();

        const gainPlantsOption = new SelectOption("Gain 5 plants", gainPlants);
        availableActions.push(gainPlantsOption);

        if (animalCards.length === 1) {
            const targetAnimalCard = animalCards[0];
            availableActions.push(new SelectOption("Add 4 animals to " + targetAnimalCard.name, () => {
                player.addResourceTo(targetAnimalCard, 4);
                LogHelper.logAddResource(game, player, targetAnimalCard, 4);
                game.addOceanInterrupt(player);
                return undefined;
            }))
        } else {
            availableActions.push(
                new SelectCard(
                    "Select card to add 4 animals", 
                    animalCards, 
                    (foundCards: Array<ICard>) => { 
                        player.addResourceTo(foundCards[0], 4);
                        LogHelper.logAddResource(game, player, foundCards[0], 4);
                        game.addOceanInterrupt(player);
                        return undefined;
                    }
                )
            )
        }

        return new OrOptions(...availableActions);
    }
    public getVictoryPoints() {
        return 2;
    }
}
