import SwapiService from "./swapi-service";
import {IService} from "./model";

class Service implements IService {
    public swapiService = new SwapiService();
}

const service = new Service();

export default service;
