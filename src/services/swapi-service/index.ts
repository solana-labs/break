import {IFetcher} from "../../api/fetcher/model";
import Paths from "../../api/paths";
import {ISwapiService} from "./model";
import {injectPropertyFetcher} from "../../injects/injects-fetcher";

export default class SwapiService implements ISwapiService {

    @injectPropertyFetcher
    private fetcher!: IFetcher;

    getPeople = async(id: number) => {
        return await this.fetcher.get(Paths.Swapi.GetPeople(id));
    };
}
