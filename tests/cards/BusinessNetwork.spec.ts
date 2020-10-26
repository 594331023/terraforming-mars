import { expect } from "chai";
import { BusinessNetwork } from "../../src/cards/BusinessNetwork";
import { Color } from "../../src/Color";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { SelectCard } from "../../src/inputs/SelectCard";
import { Resources } from '../../src/Resources';
import { IProjectCard } from '../../src/cards/IProjectCard';

describe("BusinessNetwork", function () {
    let card : BusinessNetwork, player : Player, game : Game;

    beforeEach(function() {
        card = new BusinessNetwork();
        player = new Player("test", Color.BLUE, false);
        game = new Game("foobar", [player, player], player);
    });

    it("Should play", function () {
        expect(card.canPlay(player)).is.true;
        card.play(player);
        expect(player.getProduction(Resources.MEGACREDITS)).to.eq(-1);
    });

    it("Can't play", function () {  
        player.addProduction(Resources.MEGACREDITS,-5);
        expect(card.canPlay(player)).is.not.true;
    });

    it("Can act", function () {
        expect(card.canAct()).is.true;
    });

    it("Cannot buy card if cannot pay", function () {
        player.megaCredits = 2;
        const action = card.action(player, game);
        expect(action instanceof SelectCard).is.true;

        (action! as SelectCard<IProjectCard>).cb([(action as SelectCard<IProjectCard>).cards[0]]);
        expect(game.dealer.discarded.length).to.eq(1);
        expect(player.cardsInHand.length).to.eq(0);
        expect(player.megaCredits).to.eq(2);
    });

    it("Should action as not helion", function () {
        player.megaCredits = 3;
        const action = card.action(player, game);
        expect(action instanceof SelectCard).is.true;

        (action! as SelectCard<IProjectCard>).cb([]);
        expect(game.dealer.discarded.length).to.eq(1);
        expect(player.megaCredits).to.eq(3);

        player.megaCredits = 3;
        (action as SelectCard<IProjectCard>).cb([(action as SelectCard<IProjectCard>).cards[0]]);
        game.runDeferredAction(game.deferredActions[0], () => {});
        expect(player.megaCredits).to.eq(0);
        expect(player.cardsInHand.length).to.eq(1);
    });

});
