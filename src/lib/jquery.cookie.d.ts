interface JQueryCookieOptions {
    expires?: any, // Date or number of days
    path?: string,
    domain?: string,
    secure?: boolean
}

interface JQueryStatic {
    cookie(cookie : string, value? : any, options?: JQueryCookieOptions) : string;
}