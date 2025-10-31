import http from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "", `http://${req.headers.host}`);
    let pathname = requestUrl.pathname;

    if (pathname === "/") {
      pathname = "/index.html";
    }

    const filePath = path.join(__dirname, pathname);
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] ?? "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("파일을 찾을 수 없습니다.");
      return;
    }

    console.error("서버 오류", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("서버 내부 오류가 발생했습니다.");
  }
});

server.listen(port, () => {
  console.log(`단어장 앱이 http://localhost:${port} 에서 실행 중입니다.`);
});
