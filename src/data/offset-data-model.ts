import data from "./offset-data.json" with { type: "json" };

export interface AudioSegment {
    start: number;
    end: number;
}

export const offsetsData: Record<string, AudioSegment> = data;
