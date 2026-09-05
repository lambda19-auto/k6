import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required');
}

export const options = {
    scenarios: {
        average_load: {
            executor: 'ramping-vus',
            startVUs: 0,

            stages: [
                { duration: '1m', target: 50 },
                { duration: '5m', target: 50 },
                { duration: '30s', target: 0 },
            ],

            gracefulRampDown: '30s',
        },
    },

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
    },
};

export default function () {
    const response = http.get(`${BASE_URL}/`);

    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}