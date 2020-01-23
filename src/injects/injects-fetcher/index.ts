import fetcher from "../../api/fetcher";

export const injectPropertyFetcher = (target: Record<string, any>, propertyKey: string) => {
    (target as any)[propertyKey] = fetcher;
};
