import BaseController from "./BaseController.js";
import GameHistoryRepository from "../Repository/GameHistoryRepository.js";
import Route from "../Route/Route.js";
import AuthMiddleware from "../Middlewares/AuthMiddleware.js";

class ProfileController extends BaseController {

    gameHistoryRepository = null;
    static prefix = "/profile";

    defineRoutes() {
        return [
            new Route(ProfileController.prefix, "get", this.getProfile.bind(this), AuthMiddleware.verifyToken),
            new Route("/leaderboard", "get", this.getLeaderboard.bind(this), AuthMiddleware.verifyToken),
        ];
    }

    constructor(app) {
        super(app);
        this.gameHistoryRepository = new GameHistoryRepository();
    }

    async getProfile(req, res) {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const stats = await this.gameHistoryRepository.getByUserId(userId);
        if (!stats) {
            return res.status(200).json({
                message: "Profile found",
                stats: { gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestStreak: 0 }
            });
        }

        res.status(200).json({
            message: "Profile found",
            stats: {
                gamesPlayed: stats.gamesPlayed,
                gamesWon: stats.gamesWon,
                totalScore: stats.totalScore,
                bestStreak: stats.bestStreak
            }
        });
    }

    async getLeaderboard(req, res) {
        const players = await this.gameHistoryRepository.getTopPlayers(10);
        const leaderboard = players.map((p, index) => ({
            rank: index + 1,
            username: p.username,
            totalScore: p.totalScore,
            gamesWon: p.gamesWon,
            gamesPlayed: p.gamesPlayed,
        }));

        res.status(200).json({ message: "Leaderboard found", leaderboard });
    }
}

export default ProfileController;
