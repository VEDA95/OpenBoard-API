export interface EnvLoggerItem {
    level: 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal';
    stream?: NodeJS.WritableStream;
    redact?: Array<string>;
    file?: string;
    transport?: {
        target: string;
        options: {
            translateTime?: string;
            ignore?: string;
            destination?: string | NodeJS.WritableStream | {
                dest: string | NodeJS.WritableStream | number;
                minLength?: number;
                maxLength?: number;
                sync?: boolean;
            };
            mkdir?: boolean;
            host?: string;
            colorize?: boolean;
        }
    }
}

export interface EnvLogger {
    development: EnvLoggerItem;
    production: EnvLoggerItem;
}

const envToLogger: EnvLogger = {
    development: {
        level: 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            }
        }
    },
    production: {
        level: 'error',
        transport: {
            target: 'pino/file',
            options: {
                destination: process.env.PRODUCTION_LOG_PATH ?? './logs/open_board_api.log',
                mkdir: true
            }
        }
    }
};

export default envToLogger;