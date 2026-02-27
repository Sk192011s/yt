import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import ytdl from "https://deno.land/x/ytdl_core@v0.1.2/mod.ts";

const app = new Application();
const router = new Router();

// HTML Interface
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deno YT Downloader Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center h-screen p-4">
    <div class="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <h1 class="text-3xl font-extrabold mb-2 text-center text-red-500">YT Downloader</h1>
        <p class="text-slate-400 text-center mb-8 text-sm">Fast & Secure Deno Powered</p>
        
        <div class="space-y-4">
            <input id="url" type="text" placeholder="Paste YouTube Link Here" 
                class="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition text-white">
            
            <button onclick="downloadVideo()" id="btn"
                class="w-full bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-900/20">
                Download MP4
            </button>
            
            <div id="loader" class="hidden flex justify-center py-2">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
            <p id="status" class="text-xs text-center text-slate-500"></p>
        </div>
    </div>

    <script>
        function downloadVideo() {
            const url = document.getElementById('url').value;
            const status = document.getElementById('status');
            const btn = document.getElementById('btn');
            const loader = document.getElementById('loader');

            if(!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                return alert("Please enter a valid YouTube link!");
            }

            btn.classList.add('hidden');
            loader.classList.remove('hidden');
            status.innerText = "Connecting to YouTube servers...";

            // Redirect to download endpoint
            window.location.href = \`/download?url=\${encodeURIComponent(url)}\`;
            
            setTimeout(() => {
                btn.classList.remove('hidden');
                loader.classList.add('hidden');
                status.innerText = "";
            }, 10000);
        }
    </script>
</body>
</html>
`;

router.get("/", (ctx) => {
    ctx.response.body = html;
    ctx.response.type = "text/html";
});

router.get("/download", async (ctx) => {
    const videoUrl = ctx.request.url.searchParams.get("url");

    if (!videoUrl) {
        ctx.response.status = 400;
        ctx.response.body = "Missing URL";
        return;
    }

    try {
        // YouTube ကို လှည့်စားဖို့ Header များ
        const requestOptions = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Connection": "keep-alive",
            }
        };

        const info = await ytdl.getInfo(videoUrl, { requestOptions });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        ctx.response.headers.set("Content-Disposition", `attachment; filename="${title}.mp4"`);
        ctx.response.headers.set("Content-Type", "video/mp4");

        // Progressive stream (Video + Audio) ကို ရွေးချယ်ခြင်း
        const stream = await ytdl(videoUrl, {
            quality: "highest",
            filter: "audioandvideo",
            requestOptions
        });

        ctx.response.body = stream;

    } catch (err) {
        console.error("YTDL Error:", err);
        ctx.response.status = 500;
        ctx.response.body = `Error: ${err.message}. YouTube might be throttling requests from cloud IPs.`;
    }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server live at http://localhost:8000");
await app.listen({ port: 8000 });
