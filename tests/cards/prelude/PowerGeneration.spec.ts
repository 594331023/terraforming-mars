
import { expect } from "chai";
import { PowerGeneration } from "../../../src/cards/prelude/PowerGeneration";
import { Color } from "../../../src/Color";
import { Player } from "../../../src/Player";
import { Resources } from "../../../src/Resources";

describe("PowerGeneration", function () {
    it("Should play", function () {
        const card = new PowerGeneration();
        const player = new Player("test", Color.BLUE, false);
        const action = card.play(player);
        expect(action).is.undefined;
        expect(player.getProduction(Resources.ENERGY)).to.eq(3);
    });
});
