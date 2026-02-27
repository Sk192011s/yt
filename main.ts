import { Application, Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import ytdl from "https://deno.land/x/ytdl_core@v0.1.2/mod.ts";

const app = new Application();
const router = new Router();

// Frontend HTML Interface
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deno YT Downloader</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 class="text-2xl font-bold mb-6 text-center text-red-600">YouTube Downloader</h1>
        <div class="space-y-4">
            <input id="url" type="text" placeholder="Paste YouTube Link Here" 
                class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
            <button onclick="downloadVideo()" 
                class="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition">
                Download Now
            </button>
            <p id="status" class="text-sm text-center text-gray-500 mt-2"></p>
        </div>
    </div>

    <script>
        async function downloadVideo() {
            const url = document.getElementById('url').value;
            const status = document.getElementById('status');
            if(!url) return alert("Please paste a link!");

            status.innerText = "Processing... Please wait.";
            window.location.href = \`/download?url=\${encodeURIComponent(url)}\`;
            
            setTimeout(() => { status.innerText = ""; }, 5000);
        }
    </script>
</body>
</html>
`;

// Route for Home Page
router.get("/", (ctx) => {
    ctx.response.body = html;
    ctx.response.type = "text/html";
});

// Route for Download Logic
router.get("/download", async (ctx) => {
    const videoUrl = ctx.request.url.searchParams.get("url");

    if (!videoUrl) {
        ctx.response.status = 400;
        ctx.response.body = "URL is required";
        return;
    }

    try {
        // Video info ကို အရင်ယူမယ်
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // အထူးသင်္ကေတတွေ ဖယ်ထုတ်ခြင်း

        // Header တွေ သတ်မှတ်မယ် (Browser က file အနေနဲ့ သိစေဖို့)
        ctx.response.headers.set("Content-Disposition", `attachment; filename="${title}.mp4"`);
        ctx.response.headers.set("Content-Type", "video/mp4");

        // Video ကို stream အနေနဲ့ တိုက်ရိုက်ပို့ပေးမယ်
        const stream = await ytdl(videoUrl, {
            quality: "highestvideo",
            filter: "audioandvideo" // Video ရော audio ပါပါတဲ့ format ကို ရွေးတာ (360p/720p ဝန်းကျင် ရတတ်ပါတယ်)
        });

        ctx.response.body = stream;
    } catch (err) {
        console.error(err);
        ctx.response.status = 500;
        ctx.response.body = "Error processing video. YouTube may be blocking the request.";
    }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
