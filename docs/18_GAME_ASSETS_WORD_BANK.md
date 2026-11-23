# 18 — Original assets, curated word bank and licensing

## Brand, artwork and licensing

Do not copy Skribbl.io's logo, mascot, UI art, proprietary word list or source. Use ORIGINAL SVG/CSS icons, original avatars, sticker shapes and licensed fonts. Maintain `app/public/ASSET_LICENSES.md`: each nontrivial visual/sound/font lists filename, author/source, license, modification permission and attribution obligations. Avoid remote hotlinks and unreviewed copyrighted meme/character stickers.

## English word bank baseline

Start with ≥300 original or appropriately licensed common drawing nouns/phrases, grouped into Everyday, Food, Animals, Nature, Places, Objects, Sports, Science, Fantasy (generic), India-specific culture (carefully reviewed). Every entry has: `id`, `locale`, `canonical`, `acceptedVariants[]`, `category[]`, `difficulty`, `sensitive:false`, `drawable:true`, `hintPattern`, `source/license`. Prefer concrete, drawable nouns over technical trivia; avoid slurs, self-harm, sexual content, named real people, protected brands, or ambiguous legal products in standard packs. Design for different skill levels and do not pick the same word repeatedly within a short match where possible.

## Word matching

- Unicode NFKC and controlled casefold; normalize whitespace; strip only punctuation that's defined safe for locale. Compare accepted variants but prevent trivial one-letter answers.
- Duplicate accepted variants within a pack should map unambiguously to one answer. No synonym ambiguity without explicit allowed acceptedVariants (e.g. “bike” for “bicycle” if intended).
- Multi-word masks preserve word/space/grapheme structure without revealing content. Reveal hints on deterministic server schedule; avoid choosing two candidate words which are equivalent after normalization.
- Custom words: host-only in private room, max 100 per pack, 2–40 graphemes each, moderation filters, dedupe. Decide explicitly whether private custom words are interleaved with default pack and show setting. Public rooms use curated words only until moderation.

## Non-English locales

Hindi and Kannada pack release only after review by native speakers for spelling variants, orthography, sensitive terms and accepted inflections; Unicode grapheme-aware mask and properly licensed fonts must be tested. No automatic translation from English as sole verification. Store locale tags e.g. `en-IN`, `hi-IN`, `kn-IN` and fallback text.

## Audio/visual performance

Original lightweight procedural sound effects or licensed .ogg/.mp3 with mute control; never auto-play until user gesture. SVG assets optimized; no user avatar image uploads by default; no giant bitmap downloads blocking game. Each preview must render clearly at phone DPR 3. Record asset sizes in build report.

## Testing

All entries unique by normalized canonical within locale/category rules; appropriate difficulty distribution; no zero-length/invalid Unicode/unsupported glyphs; acceptedVariants don't create collisions; candidate selection deterministic under test seed and unpredictable in production. Asset license inventory complete and no broken local asset routes in offline/online builds.
