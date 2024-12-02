export * from './consts';

export enum PAGE_SIZE {
    S3 = 3,
    S5 = 5,
    S6 = 6,
    S9 = 9,
    SM = 10,
    MD = 15,
    BG = 20,
    S25 = 25,
    S50 = 50,
    S100 = 100,
}

export const ID_MESSAGE_FAKE_ID = 999999;
export const TIME_MESSAGE_DEFAULT_ID = 9999999;
export const SESSION_MESSAGE_DEFAULT_ID = 99999999;

export const pageSizeOptions = [PAGE_SIZE.SM, PAGE_SIZE.MD, PAGE_SIZE.BG];

export const pageSizeOptionSmalls = [PAGE_SIZE.S3, PAGE_SIZE.S6, PAGE_SIZE.S9];

export const TOKEN_HEADER_KEY = 'Authorization';
export const CLIENT_ID_KEY = 'client-id';
export const REFRESH_TOKEN_KEY = `u-s-r`;

export const domainPattern =
    '[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9].(vnptmedia.vn)$';
