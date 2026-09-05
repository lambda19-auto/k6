# k6 Load Tests

A set of load tests for evaluating application performance using [k6](https://k6.io/).

The project includes several load testing scenarios:

* Average test
* Spike test
* Stress test
* Breakpoint test
* Soak test

All tests are located in the `tests/` directory and are executed through `run.sh`.

---

## Project Structure

```text
.
├── .env
├── .env.example
├── .gitignore
├── run.sh
└── tests/
    ├── average.js
    ├── spike.js
    ├── stress.js
    ├── breakpoint.js
    └── soak.js
```

---

## Requirements

The following tools are required:

* k6
* Bash

Check the installed k6 version:

```bash
k6 version
```

---

## Environment Variables

Application configuration is stored in the `.env` file.

Example:

```dotenv
BASE_URL=https://example.com
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Then specify the URL of the application under test:

```dotenv
BASE_URL=https://your-domain.com
```

The variable is available inside k6 tests through:

```javascript
__ENV.BASE_URL
```

If `BASE_URL` is not defined, the test will terminate with an error.

---

## Security

The `.env` file should not be committed to Git because it may later contain secrets, tokens, credentials, or other environment-specific values.

Add it to `.gitignore`:

```gitignore
.env
```

The `.env.example` file can safely be stored in the repository:

```dotenv
BASE_URL=https://example.com
```

---

# Running Tests

Before the first run, make `run.sh` executable:

```bash
chmod +x run.sh
```

Tests can then be started as follows.

### Average Test

```bash
./run.sh average
```

### Spike Test

```bash
./run.sh spike
```

### Stress Test

```bash
./run.sh stress
```

### Breakpoint Test

```bash
./run.sh breakpoint
```

### Soak Test

```bash
./run.sh soak
```

---

# Test Scenarios

## Average Test

File:

```text
tests/average.js
```

The average test verifies application behavior under expected normal load.

Load profile:

```text
0 → 50 VUs     1 minute
50 VUs         5 minutes
50 → 0 VUs     30 seconds
```

Maximum load:

```text
50 VUs
```

Main goals:

* verify application behavior under normal operating conditions;
* measure request latency;
* monitor the error rate;
* establish a baseline for comparison with other tests.

Thresholds:

```text
HTTP errors < 1%
p95 response time < 500 ms
```

---

## Spike Test

File:

```text
tests/spike.js
```

The spike test verifies how the application behaves during a sudden short-term increase in traffic.

Load profile:

```text
50 VUs
  ↓
250 VUs
  ↓
50 VUs
```

Example:

```text
0 → 50 VUs       30 seconds
50 VUs           1 minute

50 → 250 VUs     10 seconds
250 VUs          1 minute

250 → 50 VUs     10 seconds
50 VUs           1 minute

50 → 0 VUs       30 seconds
```

Main goals:

* verify application behavior during sudden traffic growth;
* verify recovery after the spike;
* identify errors caused by a rapid increase in concurrent users.

Thresholds:

```text
HTTP errors < 5%
p95 response time < 1000 ms
```

---

## Stress Test

File:

```text
tests/stress.js
```

The stress test gradually increases the load beyond the expected operating level.

Load profile:

```text
50 VUs
 ↓
100 VUs
 ↓
150 VUs
 ↓
200 VUs
```

Main goals:

* determine when application performance begins to degrade;
* evaluate behavior above normal load;
* observe the relationship between latency, errors, and concurrent users;
* verify recovery after high load.

Thresholds:

```text
HTTP errors < 5%
p95 response time < 1000 ms
```

Example analysis:

```text
50 users
p95 = 120 ms
errors = 0%

100 users
p95 = 180 ms
errors = 0%

150 users
p95 = 420 ms
errors = 0.2%

200 users
p95 = 1800 ms
errors = 7%
```

In this example, noticeable application degradation begins somewhere between `150` and `200` concurrent virtual users.

---

## Breakpoint Test

File:

```text
tests/breakpoint.js
```

The breakpoint test is used to determine the maximum load the application can handle.

Unlike the other tests, the load is based on the number of started iterations per second rather than a fixed number of persistent virtual users.

Executor:

```text
ramping-arrival-rate
```

Load profile:

```text
10 req/s
 ↓
20 req/s
 ↓
50 req/s
 ↓
100 req/s
 ↓
200 req/s
 ↓
400 req/s
```

Main goals:

* determine the application's performance limit;
* identify maximum throughput;
* determine the load level where errors or latency increase significantly.

The test stops automatically when one of the following thresholds is violated:

```text
HTTP errors >= 5%
```

or:

```text
p95 response time >= 1000 ms
```

Example:

```text
20 req/s    ✓
50 req/s    ✓
100 req/s   ✓
200 req/s   ✓
400 req/s   ✗
```

In this case, the breakpoint is approximately:

```text
200–400 req/s
```

After identifying the approximate breakpoint, it is recommended to run another test with smaller increments:

```text
200
225
250
275
300
325
350
375
400 req/s
```

---

## Soak Test

File:

```text
tests/soak.js
```

The soak test verifies application stability under sustained load over a long period of time.

Steady-load duration:

```text
4 hours
```

Load profile:

```text
0 → 50 VUs     5 minutes
50 VUs         4 hours
50 → 0 VUs     5 minutes
```

Main goals:

* detect memory leaks;
* detect connection leaks;
* verify database stability;
* verify connection pool behavior;
* detect gradual latency degradation;
* detect accumulated errors;
* verify application behavior during prolonged operation.

Thresholds:

```text
HTTP errors < 1%
p95 response time < 500 ms
```

During the soak test, it is especially important to monitor server resource usage throughout the entire test duration.

---

# k6 Metrics

The main k6 metrics to monitor are:

```text
http_req_duration
http_req_failed
http_reqs
iterations
vus
vus_max
```

### http_req_duration

Measures HTTP request duration.

Percentiles are particularly useful:

```text
p(90)
p(95)
p(99)
```

For example:

```text
p(95) = 350 ms
```

means that 95% of requests completed in less than 350 milliseconds.

---

### http_req_failed

Represents the percentage of failed HTTP requests.

For example:

```text
http_req_failed = 0.02
```

means:

```text
2% of requests failed
```

---

### http_reqs

The total number of HTTP requests.

It can also be used to evaluate actual throughput:

```text
requests / second
```

---

### vus

The current number of active Virtual Users.

---

### vus_max

The maximum number of Virtual Users available during the test.

---

# VPS Monitoring

During load testing, server resource usage should be monitored in parallel.

Important metrics include:

```text
CPU
RAM
Swap
Load Average
Disk I/O
Network
Open file descriptors
Database connections
Connection pool
Application errors
```

For example, during a soak test the following behavior may occur:

```text
Start:
RAM = 1.2 GB
p95 = 180 ms

After 1 hour:
RAM = 1.5 GB
p95 = 190 ms

After 2 hours:
RAM = 2.0 GB
p95 = 240 ms

After 3 hours:
RAM = 2.8 GB
p95 = 400 ms

After 4 hours:
RAM = 3.6 GB
p95 = 900 ms
```

Even if the application does not crash, continuously increasing memory usage may indicate a memory leak or another resource management issue.

---

# Test Summary

| Test       | Load               | Purpose                                 |
| ---------- | ------------------ | --------------------------------------- |
| Average    | up to 50 VUs       | Validate normal operating load          |
| Spike      | 50 → 250 VUs       | Validate sudden traffic spikes          |
| Stress     | 50 → 200 VUs       | Observe gradual performance degradation |
| Breakpoint | up to 400 req/s    | Find the system performance limit       |
| Soak       | 50 VUs for 4 hours | Validate long-term stability            |

---

# Recommended Execution Order

It is recommended to execute the tests from the least aggressive to the most aggressive:

```text
1. Average
      ↓
2. Stress
      ↓
3. Spike
      ↓
4. Soak
      ↓
5. Breakpoint
```

The average test establishes the baseline.

The stress test shows how the application behaves as the load gradually increases.

The spike test evaluates the application's response to sudden traffic growth.

The soak test evaluates system stability over time.

The breakpoint test is executed last to determine the actual performance limit of the system.

---

# Important

Breakpoint and stress tests can generate very high load.

The breakpoint test is specifically designed to find the point where the system begins to fail and may cause:

* CPU exhaustion;
* memory exhaustion;
* connection pool exhaustion;
* large numbers of HTTP 5xx responses;
* application crashes;
* database overload.

These tests should preferably be executed against staging or dedicated testing infrastructure.

Do not run a breakpoint test against a production system if service interruption is unacceptable.
