# Translation guidelines

## File structure

The original texts are stored with the card data in [`cards_ja,json`](../cards_ja.json).
The translations are stored separately by type in `cards.en.json`, `categories.en.json`, `colors.en.json`, `products.en.json`, `types.en.json`.

## Translating cards

For cards, we only need to translate the name and effect of card.
Translations for cards are stored in `cards.en.json` with the card number.

Example:
```json
{
  "cards.D01001.title": "Conan Edogawa",
  "cards.D01001.feature": "[Resolution Phase][Case Closed][Sleep]: If your evidence is equal to or greater than the Evidence Level of your Case card, you win the game.\n\n[Assist][Sleep]: Move this card into the FILE area. If you have 7 or more cards in your FILE area, your case becomes Solved."
}
```

### Names

As general rule, we want to keep the names as close to the Manga as possible.
Especially case names should use the same translation as the English manga or anime suggests.

However, we will not use Funimation names:
* Use "Shinichi Kudo" instead of "Jimmy Kudo"
* Use "Detective Boys" instead of "Junior Detective League"

### Keywords

The card's keywords must always be translated the same way.
Once keywords are explained, we can remove the additional explanations in brackets.

#### Conditions

* `【パートナー#COLOR#】` => `[Partner: #COLOR#]`
* `【ターン1】` => `[Once per Turn]`
* `【登場時】` => `[On Play]`
* `【自分ターン中】` => `[Your Turn]`
* `【相手ターン中】` => `[Opponent's Turn]`
* `【現場リムーブ時】` => `[Removed from Scene]`
* `【宣言】` => `Statement`
* `【解決編】` => `[Resolution Phase]`
* `【事件解決】` => `[Case Closed]`
* `【アシスト】` => `[Assist]`
* `【スリープ】` => `[Sleep]`
* `【カットイン】` => `[Cut-In]`
* `ヒラメキ` => `[Insight]`

#### States

* Stun (when Stunned characters are Active, they are put to Sleep instead.)

#### Abilities

* `〚迅速〛（登場したターンからすぐに推理かアクションできる）` => `{Swift} (This card can use its Deduction or Action during the turn it is played.)`
* `〚ミスリード1〛（相手の推理に対し、スリープさせることでLP－1する）` => `{Mislead 1} (When your opponent's card uses Deduction, you may Sleep this card to make that card lose 1 LP during this Deduction.)`
* `〚突撃〛` => `{Charge} (This card can use its Action during the turn it is played.)`
  * Note: This may be restricted to [Character] or [Case]
* `〚ブレット〛（このキャラのアクションはガードできない）` => `{Bullet} (When this Characters performs its Action, your opponent cannot Guard.)`
* `〚捜査〛` => `{Investigation 1} (Your opponent reveals 1 card from the top of their deck and places it at the bottom of the deck in any order.)`