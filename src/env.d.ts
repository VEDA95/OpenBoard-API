namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
        NODE_ENV: 'development' | 'production';
        PORT: number;
        HOST: string;
        DATABASE_URI: string;
        PRODUCTION_LOG_PATH?: string;
    }
}