export type Logger = {
    error: (msg: string, context?: object) => void;
    log: (msg: string, context?: object) => void;
    warn: (msg: string, context?: object) => void;
    debug: (msg: string, context?: object) => void;
    info: (msg: string, context?: object) => void;
  };

  