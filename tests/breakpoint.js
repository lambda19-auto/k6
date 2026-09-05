import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required');
}

export const options = {
    scenarios: {
        breakpoint: {
            executor: 'ramping-arrival-rate',

            startRate: 10,
            timeUnit: '1s',

            preAllocatedVUs: 50,
            maxVUs: 1000,

            stages: [
                { duration: '1m', target: 20 },
                { duration: '2m', target: 20 },

                { duration: '1m', target: 50 },
                { duration: '2m', target: 50 },

                { duration: '1m', target: 100 },
                { duration: '2m', target: 100 },

                { duration: '1m', target: 200 },
                { duration: '2m', target: 200 },

                { duration: '1m', target: 400 },
                { duration: '2m', target: 400 },
            ],
        },
    },

    thresholds: {
        http_req_failed: [
            {
                threshold: 'rate<0.05',
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],

        http_req_duration: [
            {
                threshold: 'p(95)<1000',
                abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],
    },
};

export default function () {
    const response = http.get(`${BASE_URL}/`);

    check(response, {
        'status is successful': (r) =>
            r.status >= 200 && r.status < 400,
    });
}