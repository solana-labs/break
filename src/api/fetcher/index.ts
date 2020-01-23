import axios, {AxiosInstance} from 'axios';
import {IFetcher} from "./model";

class Fetcher implements IFetcher{
    private axios: AxiosInstance;

    constructor() {
        this.axios = axios.create({
            withCredentials: false,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            responseType: 'json'
        })
    }

    public get = async(url: string, body: any = {}): Promise<any> => {
        const result = await this.axios.get(url, body);

        return result.data;
    };

    public post = async(url: string, body: any = {}): Promise<any> => {
        const result = await this.axios.post(url, body);

        return result.data;
    };

    public put = async(url: string, body: any = {}): Promise<any> => {
        const result = await this.axios.put(url, body);

        return result.data;
    };

    public delete = async(url: string, body: any = {}): Promise<any> => {
        const result = await this.axios.delete(url, body);

        return result.data;
    };
}

const fetcher = new Fetcher();

export default fetcher;
