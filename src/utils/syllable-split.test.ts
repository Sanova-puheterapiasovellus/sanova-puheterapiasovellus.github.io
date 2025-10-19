import { strictEqual } from "node:assert/strict";
import { suite, test } from "node:test";
import { TEST_EXAMPLES } from "../data/syllable-split-phonology.ts";
import { splitToSyllables } from "./syllable-split.ts";

suite("check syllable splitting with known test examples", () => {
    for (const [word, expected] of Object.entries(TEST_EXAMPLES)) {
        test(word, () => strictEqual(splitToSyllables(word), expected));
    }
});
