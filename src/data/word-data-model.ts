import data from "./word-data.json" with { type: "json" };

const IMAGE_BASE_PATH = "/assets/images/";

export interface Word {
    name: string;
    image: string;
    image_credit: string;
    hint: string;
    fallBackPlayer?: boolean;
}

export interface Category {
    name: string;
    image: string;
    image_credit: string;
    words: Word[];
}

export interface Data {
    categories: Category[];
}

export const wordsData = data as Data;

export function getImagePath(image: string) {
    return `${IMAGE_BASE_PATH}${image}`;
}
