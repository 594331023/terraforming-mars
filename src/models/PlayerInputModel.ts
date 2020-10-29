
import { PlayerInputTypes } from "../PlayerInputTypes";
import { CardModel } from "./CardModel";
import { ColonyModel } from "./ColonyModel";
import { IPayProductionModel } from "./IPayProductionUnitsModel";
import { IAresData } from "../ares/IAresData";

export interface PlayerInputModel {
    id: string | undefined;
    amount: number | undefined;
    availableSpaces: Array<string> | undefined;
    canUseHeat: boolean | undefined;
    canUseSteel: boolean | undefined;
    canUseTitanium: boolean | undefined;
    cards: Array<CardModel> | undefined;
    inputType: PlayerInputTypes;
    options: Array<PlayerInputModel> | undefined;
    max: number | undefined;
    maxCardsToSelect: number | undefined;
    microbes: number | undefined;
    floaters: number | undefined;
    minCardsToSelect: number | undefined;
    players: Array<string> | undefined;
    title: string;
    buttonLabel: string;
    coloniesModel : Array<ColonyModel> | undefined;
    payProduction : IPayProductionModel | undefined;
    aresData: IAresData | undefined;
}

