import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required');
}

export const options = {
    scenarios: {
        stress: {
            executor: 'ramping-vus',
            startVUs: 0,

            stages: [
                // warm-up
                { duration: '1m', target: 50 },
                { duration: '2m', target: 50 },

                // increasing load
                { duration: '1m', target: 100 },
                { duration: '2m', target: 100 },

                { duration: '1m', target: 150 },
                { duration: '2m', target: 150 },

                { duration: '1m', target: 200 },
                { duration: '2m', target: 200 },

                // recovery
                { duration: '1m', target: 50 },
                { duration: '1m', target: 0 },
            ],

            gracefulRampDown: '30s',
        },
    },

    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<1000'],
    },
};

export default function () {
    const response = http.get(`${BASE_URL}/`);

    check(response, {
        'status is successful': (r) =>
            r.status >= 200 && r.status < 400,
    });

    sleep(1);
}