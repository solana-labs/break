import {configuration} from "../config";

const base = (rest: string) => `${configuration.remoteApi}/${rest}`;

export default class Paths {
    static Swapi = class {
        static GetPeople = (id: number) => base(`people/${id}`);
    };
}
