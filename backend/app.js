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
import ArtworkSyncService from "./src/Services/ArtworkSyncService.js";

const init = async () => {
    //DB Instanciation
    await DatabaseFactory.createDb()
        .then(async () => {
            Logger.success("Database Started");
            await Models.initModels();

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

    // Sync artworks from Wikidata into SQLite in the background.
    // Already-populated themes are skipped; first boot fills the DB (~75s total).
    new ArtworkSyncService().syncAll()
        .then(() => Logger.success('Artwork DB sync complete'))
        .catch(e  => Logger.warning('Artwork DB sync failed: ' + e.message));
}

const initController = (app) => {
    new DefaultController(app);
    new AuthController(app);
    new RoomController(app);
    new ProfileController(app);
}

init();