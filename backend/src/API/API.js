import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

class API {

    app = null
    port = null
    static instance = null
    server = null

    constructor(port){
        if(API.instance){
            return API.instance;
        }

        this.port = port
        this.app = express()

        const corsOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:5173'];

        this.app.use(cors({
            origin: corsOrigins,
            credentials: true,
        }))

        this.app.use(cookieParser())
        this.app.use(bodyParser.json())
        this.server = this.app.listen(this.port)

        API.instance = this;
    }
}

export default API;