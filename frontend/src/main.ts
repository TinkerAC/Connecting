// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import '../tailwind.css'
import router from './router';
import store from './store';

const app = createApp(App);

// 尝试从 localStorage 恢复登录状态
const storedUser = localStorage.getItem('currentUser');
if (storedUser) {
    try {
        const user = JSON.parse(storedUser);
        store.commit('setCurrentUser', user);
    } catch (err) {
        console.error('Failed to parse stored user:', err);
    }
}

app.use(router);
app.use(store);
app.mount('#app');