import data from "./word-data.json" with { type: "json" };

export interface Word {
    name: string;
    image: string;
    subcategory: string;
}

export interface Category {
    name: string;
    image: string;
    words: Word[];
}

export interface Data {
    categories: Category[];
}

export const wordsData = data as Data;
