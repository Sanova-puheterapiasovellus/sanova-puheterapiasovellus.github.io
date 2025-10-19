export const VOWELS = ["a", "e", "i", "o", "u", "y", "å", "ä", "ö"];

export const CONSONANTS = [
    "b",
    "c",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "m",
    "n",
    "p",
    "q",
    "r",
    "s",
    "t",
    "v",
    "w",
    "x",
    "z",
];

export const DIPHTHONGS_AND_LONG_VOWELS = [
    "ai",
    "ei",
    "oi",
    "ui",
    "yi",
    "åi",
    "äi",
    "öi",
    "ey",
    "iy",
    "äy",
    "öy",
    "au",
    "eu",
    "iu",
    "ou",
    "ie",
    "uo",
    "yö",
    "aa",
    "ee",
    "ii",
    "oo",
    "uu",
    "yy",
    "åå",
    "ää",
    "öö",
];

// These examples have been generated on 19/10/2025 with Microsoft Copilot Chat due to difficulty
// of determining edge cases without deeper understanding of Finnish phonology.
export const TEST_EXAMPLES = {
    omena: "o-me-na", // vokaalien välinen tavutus
    kirkko: "kirk-ko", // kaksoiskonsonantti jakaa tavun
    koulu: "kou-lu", // diftongi + konsonantti
    syksy: "syk-sy", // konsonanttiyhdistelmä tavun rajalla
    työmaa: "työ-maa", // diftongi + yhdyssana
    hiihtäjä: "hiih-tä-jä", // pitkä vokaali + konsonantti + johdin
    sähköposti: "säh-kö-pos-ti", // yhdyssana + vierasperäinen kirjain
    banaani: "ba-naa-ni", // vierasperäinen alkukirjain + pitkä vokaali
    metsästys: "met-säs-tys", // konsonanttiyhdistelmä + johdin
    yleisö: "y-lei-sö", // diftongi + loppuvokaali
    lentokone: "len-to-ko-ne", // yhdyssana, selkeä tavuraja
    käsikirjoitus: "kä-si-kir-joi-tus", // moniosainen yhdyssana
    tietokone: "tie-to-ko-ne", // diftongi + yhdyssana
    arkkitehti: "ark-ki-teh-ti", // kaksoiskonsonantti + vierasperäinen johdin
};
