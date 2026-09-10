import autocannon from "autocannon";

const BASE_URL = "http://localhost:4000/api";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ2YzE5ODMyLTMzMzctNDQyZS05NTYyLTJiM2YxZjE0MzhiMCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3ODkwMjE0OTgsImV4cCI6MTc4OTYyNjI5OH0.aV7XkeamTEVRRGuhzw9nTbnJ5sLa69sGWo3zeb9gREE";

const AUTH_HEADER = { Authorization: `Bearer ${TOKEN}` };

function run(label, config) {
  return new Promise((resolve) => {
    console.log(`\nRunning: ${label}`);
    const instance = autocannon({ connections: 250, duration: 15, ...config });
    autocannon.track(instance, { renderProgressBar: true });
    instance.on("done", (result) => {
      console.log(`\n ${label}`);
      console.log(`   Throughput  : ${Math.round(result.requests.average)} req/sec`);
      console.log(`   p95 Latency : ${result.latency.p95} ms`);
      console.log(`   Total Reqs  : ${result.requests.total}`);
      console.log(`   Errors      : ${result.errors + result.non2xx}`);
      resolve(result);
    });
  });
}

async function main() {
  const results = {};

  // 1. Auth - login
  results.login = await run("POST /auth/login", {
    url: `${BASE_URL}/auth/login`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "Krishna123" }),
  });

  // 2. Auth - me
  results.me = await run("GET /auth/me", {
    url: `${BASE_URL}/auth/me`,
    headers: AUTH_HEADER,
  });

  // 3. Files - list
  results.fileList = await run("GET /files", {
    url: `${BASE_URL}/files`,
    headers: AUTH_HEADER,
  });

  // 4. Files - upload-url
  results.uploadUrl = await run("POST /files/upload-url", {
    url: `${BASE_URL}/files/upload-url`,
    method: "POST",
    headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify({ filename: "test.pdf", contentType: "application/pdf", size: 160829 }),
  });

  // 5. Folders - list
  results.folderList = await run("GET /folders", {
    url: `${BASE_URL}/folders`,
    headers: AUTH_HEADER,
  });

  // --- Summary ---
  const allResults = Object.values(results);
  const totalReqs = allResults.reduce((s, r) => s + r.requests.total, 0);
  const avgThroughput = Math.round(allResults.reduce((s, r) => s + r.requests.average, 0) / allResults.length);
  const maxP95 = Math.max(...allResults.map((r) => r.latency.p95));
  const totalErrors = allResults.reduce((s, r) => s + r.errors + r.non2xx, 0);
  const errorRate = ((totalErrors / totalReqs) * 100).toFixed(2);

  console.log("\n========================================");
  console.log("📊 FINAL BENCHMARK SUMMARY");
  console.log("========================================");
  console.log(`Avg Throughput     : ~${avgThroughput} req/sec`);
  console.log(`p95 Latency (max)  : ~${maxP95} ms`);
  console.log(`Concurrent Users   : 250`);
  console.log(`Total Operations   : ${totalReqs.toLocaleString()}`);
  console.log(`Error Rate         : ${errorRate}%`);
  console.log("========================================");
}

main();