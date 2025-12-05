import data from "./word-data.json" with { type: "json" };

const IMAGE_BASE_PATH = "/assets/images/";

export interface Image {
    file: string;
    credit: string;
}

export interface Word {
    name: string;
    hint: string;
    image: Image;
    fallBackPlayer?: boolean;
}

export interface Category {
    name: string;
    image: Image | { word: number };
    words: Word[];
}

export interface Data {
    categories: Category[];
}

export const wordsData = data as Data;

export function getImagePath(image: Image): string {
    return `${IMAGE_BASE_PATH}${image.file}`;
}

export function getCategoryImage(category: Category): Image {
    return "word" in category.image
        ? (category.words[category.image.word]?.image ?? { file: "", credit: "" })
        : category.image;
}
