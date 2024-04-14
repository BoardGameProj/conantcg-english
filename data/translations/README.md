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
  "cards.D01001.feature": "[While Case is Solved][Case Closed][Sleep]: If your evidence is equal to or greater than the case level, you win the game.\n\n[Assist][Sleep]: Move this card into the FILE area. If you have 7 or more cards in your FILE area, your case becomes Solved."
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
* `【自分ターン中】` => `[During your Turn]`
* `【相手ターン中】` => `[During opponents Turn]`
* `【現場リムーブ時】` => `[When removed from the Scene]`
* `【宣言】` => `Statement`
* `【解決編】` => `[While Case is Solved]`
* `【事件解決】` => `[Case Closed]`
* `【アシスト】` => `[Assist]`
* `【スリープ】` => `[Sleep]`
* `【カットイン】` => `[Cut-In]`
* `ヒラメキ` => `[Insight]`

#### Abilities

* `〚迅速〛（登場したターンからすぐに推理かアクションできる）` => `<Swift> (This card can use its Deduction or Action during the turn it is played.)`
* `〚ミスリード1〛（相手の推理に対し、スリープさせることでLP－1する）` => `<Mislead 1> (When your opponent's card uses Deduction, you may Sleep this card to make that card lose 1 LP during this Deduction.)`
* `〚突撃〛` => `<Charge>`
* `〚ブレット〛（このキャラのアクションはガードできない）` => `Bullet (When this Characters performs its Action, your opponent cannot Guard.)`
