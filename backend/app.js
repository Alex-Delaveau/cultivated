import APIManager from "./src/API/ApiFactory.js";
import Logger from "./src/Logger/Logger.js"
import DatabaseFactory from "./src/Database/DatabaseFactory.js";
import { Models } from "./src/Model/Models.js";
import API from "./src/API/API.js";


import DefaultController from "./src/Controller/DefaultController.js";
import AuthController from "./src/Controller/AuthController.js";
import RoomController from "./src/Controller/RoomController.js";
import ProfileController from "./src/Controller/ProfileController.js";

import SocketManager from "./src/sockets/SocketManager.js";
import ArtApiService from "./src/Services/ArtApiService.js";

const init = async () => {
    //DB Instanciation
    await DatabaseFactory.createDb()
        .then(() => {
            Logger.success("Database Started");
            Models.initModels();
            
        })
        .catch((e) => {
            Logger.error("Database Failed to start");
            throw e;
        });


    // API Instanciation
    APIManager.createApi().then(() => {
        let api = API.instance;
        Logger.success("API Started on port " + api.port);
        initController(api.app);
    }).catch((e) => {
        Logger.error("API Failed to start" + e);
        throw e;
    });

    let socketManager = new SocketManager(API.instance.server);

    // Pre-warm the art provider cache in the background so the first player
    // never has to wait for the SPARQL query (cached for 12 hours after this).
    ArtApiService.selectArtworkForRound(0, null, 'global')
        .then(() => Logger.success("Art provider cache warmed up (theme: global)"))
        .catch(e  => Logger.warning("Art provider warmup failed: " + e.message));
}

const initController = (app) => {
    new DefaultController(app);
    new AuthController(app);
    new RoomController(app);
    new ProfileController(app);
}

init();