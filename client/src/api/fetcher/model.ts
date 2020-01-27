export interface IFetcher {
  get<T>(url: string, body?: any): Promise<T>;

  post<T>(url: string, body?: any): Promise<T>;

  put<T>(url: string, body?: any): Promise<T>;

  delete<T>(url: string, body?: any): Promise<T>;
}
