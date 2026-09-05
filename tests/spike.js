import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required');
}

export const options = {
    scenarios: {
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,

            stages: [
                // normal load
                { duration: '30s', target: 50 },
                { duration: '1m', target: 50 },

                // spike
                { duration: '10s', target: 250 },
                { duration: '1m', target: 250 },

                // recovery
                { duration: '10s', target: 50 },
                { duration: '1m', target: 50 },

                // shutdown
                { duration: '30s', target: 0 },
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