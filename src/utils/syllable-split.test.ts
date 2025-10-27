import { strictEqual } from "node:assert/strict";
import { suite, test } from "node:test";
import { TEST_EXAMPLES } from "../data/syllable-split-phonology.ts";
import { splitToSyllables } from "./syllable-split.ts";

suite("check syllable splitting with known test examples", () => {
    test("all test cases", () => {
        for (const [word, expected] of Object.entries(TEST_EXAMPLES)) {
        }
    });
});
