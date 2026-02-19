import axios from 'axios';


class AuthAPI {

    api = null;
    store = null;

    constructor(store) {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
            timeout: 1000,
            withCredentials: true, // send/receive HttpOnly cookie
        });
        this.store = store;
    }

    async login(username, password) {
        try {
            const response = await this.api.post('/login', {
                username,
                password,
            });

            if (response.status !== 200) {
                throw new Error('Error logging in');
            }

            const user = {
                userId: response.data.userId,
                username: username,
            };

            this.store.dispatch('login', { user: user, roomCode: response.data.currentRoomInfo.code });
        } catch (error) {
            throw error;
        }
    }

    async signup(username, password) {
        try {
            const response = await this.api.post('/signup', {
                username,
                password,
            });

            if (response.status !== 201) {
                throw new Error('Error signing up');
            }

            const user = {
                userId: response.data.userId,
                username: username,
            };

            this.store.dispatch('login', { user: user, roomCode: response.data.currentRoomCode });
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await this.api.post('/logout');
        } catch (e) {
            // ignore — cookie will expire on its own
        }
    }
}

export default AuthAPI;
