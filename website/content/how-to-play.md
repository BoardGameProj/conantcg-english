---
title: "How to play"
layout: content
---

This is a card game where you, along with characters from "Detective Conan", aim to solve a case before your opponent does.
Use your very own deck to gather evidence towards your case, take action against the opponent's case, and reach for victory together with your partnered detective!

There is also an unofficial English translation of the Game Rules, which you can find <a href="https://docs.google.com/document/d/1gwbE1MYVNC2ham79NP5ECGwyTm3liRnxL_yU7tUPe6Q/edit" target="_blank">here on Google Drive</a> (thanks to [potatolanes](https://twitter.com/potatolanes)).

## Game Victory Conditions

Gather a number of "Evidence" greater than or equal to the "Case Level", then use your Partner's `[Case Closed]` ability to win the game.

## Card Types

|Case|Partner|Character|Event|
|---|---|---|---|
| ![Case card](img/card-case.jpg) | ![Partner card](img/card-partner.jpg) | ![Character card](img/card-character.jpg) | ![Event card](img/card-event.jpg) |

There are four card types:

* **Case card:** Represents the case you are trying to solve. It denotes the Case Level, or the amount of evidence you need to win the game, which depends on whether you go first or second. Use a token to denote whether it is currently the Case Phase or Resolution Phase of your case.
* **Partner card:** Acts as your partner for the game. You can use it to deduce to gain evidence, and some cards have effects that require a specific color Partner to work. It also has the special `[Assist]` and `[Case Closed]` abilities, which are what you use to win the game.
* **Character cards:** The main cards that go into your deck. They're the cards that you play onto your Scene (as in crime scene), and are what you mainly use to gain evidence.
* **Event cards:** Support cards. They feature scenes from the manga, and are discarded once you use their effects.
  * Some Events have effects that set them to a character. After resolving that effect, set the Event underneath the Character card. Remove the Event, when the Character leaves the Scene.

As a rule of thumb, you play the game with one Partner card and one Case card, along with a 40-card deck of Character and Event cards. You can only have up to 3 copies of the same card, based on the ID of the card.

### Color restriction

There is no color restriction on cards you can put in your deck. However a card can't be used from hand or through a Next Hint, if it's not the same color as your Case card. 
This doesn't apply to cards that are played through card effects, or cards that are used through `<Cut In>` or `<Spark>`.

## Playing Area

![Playing Area](img/board.jpg)

* **Scene:** Where you play Character cards onto. You can only have up to 5 Characters on the Scene at a time. If you were to play another one, you can choose to discard a Character already on the Scene to play the new one.
* **Partner:** Place your Partner card here at the start of a game.
* **Case:** Place your Case card here at the start of a game.
  * A marker denotes if the case is in "Case Phase" (at the start of the game) or in "Resolution Phase".
  * The number of evidence needed depends on whether a player goes first or second. If you go first, place the marker on the bottom right corner, and if you go second place iot on the bottom left corner.
* **Deck:** Where you place the deck that you draw cards from.
* **File Area:** Place Files here from your deck facedown, sideways. Files determine what level cards you are allowed to play.
* **Assist:** The black box in the File Area, where you place your Partner after using its `[Assist]` ability.
* **Evidence Area:** Place Evidence here from your deck facedown. You get Evidence by making deductions or actions with your Partner or Character cards.
* **Remove Area:** Where you place your Character or Event cards that are removed from game.

## Game Setup

![Game Setup](img/board2.jpg)

When you start a game, you place your Partner and Case cards onto the playing area, then shuffle your deck. Both players draw a starting hand of 5 cards, and are allowed to mulligan their hand by shuffling any cards from their hand into the deck and drawing the same number of cards.

**Note:** If your deck happens to run out of cards in the middle of a game, you shuffle all the cards in the Remove Area into your deck. If you do so, the opponent gains one Evidence.

## Turn Flow

1. **Auto Phase** (do each of these in order)
   1. Put your Partner card into Active mode. If it's in the File Area, put it back in the Partner zone.
   2. Take your Characters that are in Sleep mode but put them into Active mode.
   3. Draw 1 card from your deck and add it to your hand.
   4. Take 2 cards from the top of your deck and put them into your File Area facedown. These act as your Files, which determine what level cards you are allowed to play. (Note: for the player going first, they only add 1 File instead of 2 on their first turn.)
2. **Main Phase** (do any of these in any order)
   1. **Play a card from your hand,** namely a Character card or an Event card. You can only play cards with a Level (top left corner number) that is lower than or equal to the amount of Files that you have. By default, you can only play one card per turn. This can not be done, if a Next Hint was already used that turn.
   2. **Use a Next Hint.** Any time during the Main Phase, you can choose to use a Next Hint, in which you can add a File to your hand. Then as part of Next Hint, you can play another card from your hand, keeping in mind the newly decreased File count. You can also choose to not play any cards, but you can't play a card after the Next Hint is over.
   3. **Use a Character card's "Declare" effect.** Declare effects are effects that you can choose to activate during the Main Phase. Generally, these effects can only be used once per turn or have some sort of requirement to be used.
       * They can be used even on a Character that was played that turn.
       * They can be used even if the Character is in Sleep Mode. (Unless [Sleep] is part of the cost.)
   4. **Make a Deduction.** Select a Partner or Character card and put it into Sleep mode (turn it sideways). If you do, gain Evidence by putting cards from the top of your deck facedown into the Evidence Area. The amount of Evidence you gain is based on the LP of the card used to deduce. Note: A Character can't made a deduction the turn it is played ("Intro Mode")
   5. **Take an action.** You can take an action with a Character card by sleeping it. Like deductions, a Character can't take action the turn it is played. When you take action, you can either target the opposing case, or an opposing Character that's in Sleep or Stun mode. The opponent can choose to guard the action by sleeping a Character they control.  
       * **Action (Case):**  If the opponent does not guard when you take action on their case, the opponent discards an Evidence and you gain an Evidence.
         * Note: The case must have 1 or more Evidence to target. 
       * **Action (Character):** If the opponent does not guard when you take action on their character, **Contact** starts.
         * The players can then use one card with `[Cut In]` from their hand to increase the AP of their Character. The player with the lower AP character (or the defending player if AP is equal) decides first, whether he wants to use a Cut In. Then, the other player decides.
         * Compare the two Characters' AP, and remove the defending Character if the Character making the action has equal or higher AP. If the defending character has higher AP, nothing happens.
         * Note: If a Character is removed in the middle of a Contact (e.g. by effects), the Contact ends.
   7. **Use your Partner's abilities.** A Partner card has two abilities: `[Assist]` and `[Case Closed]`.  
      * **For Assist**, sleep the Partner card and put it into your File Area. This increases the number of cards in your File Area, thus increasing the Level threshold of what cards you can play. In addition, after using `[Assist]`, if the number of cards in your File Area are 7 or higher, the case changes from Case Phase to Resolution Phase. (Denote this status with a token or marker)  
      * **For Case Closed**, activate only if the case is in Resolution Phase. By sleeping the Partner, if your Evidence count is greater than or equal to your Case Level, you win the game. Using this ability is the primary way in which you win the game.  
     * Note that both abilities require you to Sleep the Partner, which means you can't use these abilities the same turn you deduce with the Partner, nor can you use both in one turn.
4. End Phase
   * Your turn ends, and the game is passed onto the opponent. Any effects that end or activate when your turn ends occur now.

## General flow of the game

1. Accumulate Files throughout the game, using them to play Character or Event cards.
2. Make deductions with your Characters or Partner to gain Evidence. Take actions with your Characters to disrupt the opponent by removing their Evidence or Characters.
3. When you reach 7 Files (including the Partner card), use your Partner's `[Assist]` to turn your case into Resolution Phase.
4. Reach enough Evidence to match your Case Level, then use your Partner's `[Case Closed]` to win the game.

## Keywords

### Actions

* **Deduction**: Put the card to Sleep and gain Evidence based on its LP
* **Guard**: A Character on the Scene can be put to Sleep in order to defend against an Action.
* **Cut In**: You may use this during Contact by removing this card from your hand and boost your Character by the amount on the card.
* **Investigate X**: Your opponent reveals the top X card(s) of their deck and places it at the bottom of their deck in any order.
* **Mislead X**: You may put a character with this ability to Sleep when your opponent's card uses Deduction, in order to make that card lose X LP during this Deduction.
* **Haste**: Characters with "Haste" ability can immediately perform Deductions or Actions during the turn it is played.
* **Rush**: Characters with "Rush" ability can immediately perform Actions during the turn it is played.
* **Bullet**: The opponent cannot Guard against Actions by characters with "Bullet" ability.

### States

* **Sleep**: Sleeping characters cannot perform Actions and they can be targeted for Contact.
* **Stun**: When a character is stunned, it is turned upside down for the next turn. When it would be set to Active, it is put to Sleep instead (sideways).
