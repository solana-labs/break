import fetcher from "../../api/fetcher";

export const injectPropertyFetcher = (target: Object, propertyKey: string): void => {
    (target as any)[propertyKey] = fetcher;
};
