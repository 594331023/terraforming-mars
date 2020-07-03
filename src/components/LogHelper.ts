import { Game } from "../Game";
import { Player } from "../Player";
import { ICard } from "../cards/ICard";
import { LogMessageType } from "../LogMessageType";
import { LogMessageData } from "../LogMessageData";
import { LogMessageDataType } from "../LogMessageDataType";

export class LogHelper {
    static logAddResource(game: Game, player: Player, card: ICard, qty: number = 1): void {
        let resourceType = "resource(s)"

        if (card.resourceType) {
            resourceType = card.resourceType.toLowerCase() + "(s)";
        }

        game.log(
            LogMessageType.DEFAULT,
            "${0} added ${1} ${2} to ${3}",
            new LogMessageData(LogMessageDataType.PLAYER, player.id),
            new LogMessageData(LogMessageDataType.STRING, qty.toString()),
            new LogMessageData(LogMessageDataType.STRING, resourceType),
            new LogMessageData(LogMessageDataType.CARD, card.name)
        );
    }

    static logRemoveResource(game: Game, player: Player, card: ICard, qty: number = 1, effect: string): void {
        let resourceType = "resource(s)"

        if (card.resourceType) {
            resourceType = card.resourceType.toLowerCase() + "(s)";
        }

        game.log(
            LogMessageType.DEFAULT,
            "${0} removed ${1} ${2} from ${3} to ${4}",
            new LogMessageData(LogMessageDataType.PLAYER, player.id),
            new LogMessageData(LogMessageDataType.STRING, qty.toString()),
            new LogMessageData(LogMessageDataType.STRING, resourceType),
            new LogMessageData(LogMessageDataType.CARD, card.name),
            new LogMessageData(LogMessageDataType.STRING, effect)
        );
    }

    static logGainPlants(game: Game, player: Player, qty: number = 1) {
        game.log(
            LogMessageType.DEFAULT,
            "${0} gained ${1} plant(s)",
            new LogMessageData(LogMessageDataType.PLAYER, player.id),
            new LogMessageData(LogMessageDataType.STRING, qty.toString())
        )
    }
}