import ConfigManager from "../Config/ConfigManager.js";
import jwt from "jsonwebtoken";

export default class AuthMiddleware {
    static async verifyToken(req, res, next) {
        const token = req.cookies?.token;

        if (!token) return res.status(403).send('Token not provided.');

        jwt.verify(token, ConfigManager.instance.jwtSecret, (err, decoded) => {
            if (err) {
                return res.status(401).send('Token verification failed.');
            }

            req.userId = decoded.id;
            next();
        });
    }

    static async verifyUserFromBody(req, res, next) {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(403).send('Token not provided.');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, ConfigManager.instance.jwtSecret);
        } catch (err) {
            return res.status(401).send('Token verification failed.');
        }

        req.user = decoded;

        const usernameFromToken = decoded.username;
        const { username } = req.body;

        if (usernameFromToken !== username) {
            return res.status(403).send("Username does not match token infos.");
        }

        return next();
    }
}
