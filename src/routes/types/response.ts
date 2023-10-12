export interface OKResponse<T> {
    code: 200 | 201;
    count?: number;
    message?: string;
    data: T;
}

export interface ErrorResponse {
    code: number;
    error?: string;
    errors?: Array<string>;
}