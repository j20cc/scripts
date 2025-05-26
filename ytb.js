import Innertube from 'youtubei.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';

async function getVideoDownloadUrl(videoId) {
    try {
        // 初始化 Innertube 客户端
        const innertube = await Innertube.create();

        // 获取视频信息
        const videoInfo = await innertube.getBasicInfo(videoId);
        console.log(videoInfo.streaming_data.adaptive_formats);
    } catch (error) {
        console.error('错误:', error.message);
    }
}

// 提取 m3u8 文件中的下载链接
async function extractM3u8Links(url) {
    const host = new URL(url).host;
    const response = await fetch(url);
    if (!response.ok) return [];
    const m3u8Content = await response.text();
    // 按行分割 m3u8 内容
    const lines = m3u8Content.split('\n');
    const downloadLinks = [];
    // 正则表达式匹配 URL
    for (let line of lines) {
        // 去除首尾空白
        line = line.trim();

        // 跳过空行和注释行（以 # 开头）
        if (!line || line.startsWith('#')) {
            continue;
        }

        // 匹配 URL
        if (line.startsWith('http://') || line.startsWith('https://')) {
            downloadLinks.push(line);
        } else {
            // 如果是相对路径，构建完整的 URL
            if (line.startsWith('/')) {
                line = `https://${host}${line}`;
            } else {
                line = `https://${host}/${line}`;
            }
            downloadLinks.push(line);
        }
    }

    return downloadLinks;
}

// 并行下载 .ts 文件
async function downloadTsFiles(tsUrls, outputDir = 'tmp', prefix = 'chunk', maxConcurrent = 5) {
    console.log(`准备下载 ${tsUrls.length} 个文件，最大并发数: ${maxConcurrent}, 输出目录: ${outputDir}, 前缀: ${prefix}`);
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 使用 p-limit 控制并发
    const limit = pLimit(maxConcurrent);
    const failedUrls = [];
    const total = tsUrls.length;
    let completed = 0;
    // 下载单个文件的函数
    async function downloadFile(url, index) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s 超时

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const ext = path.extname(url);
            const fileName = `${prefix}_${String(index).padStart(4, '0')}${ext}`;
            const filePath = path.join(outputDir, fileName);
            const buffer = await response.arrayBuffer();

            fs.writeFileSync(filePath, Buffer.from(buffer));
            completed++;
            console.log(`Downloaded: ${fileName}, progress: (${((completed / total) * 100).toFixed(2)}%)`);
            return filePath;
        } catch (error) {
            failedUrls.push(url);
            console.error(`Failed to download ${url}: ${error.message}`);
            return null;
        }
    }

    // 并行执行下载任务
    const start = Date.now();
    const tasks = tsUrls.map((url, index) => limit(() => downloadFile(url, index)));
    const results = await Promise.all(tasks);

    // 打印失败的 URL
    if (failedUrls.length > 0) {
        console.log('Failed URLs:');
        failedUrls.forEach(url => console.log(url));
    }

    const end = Date.now();
    console.log(`All downloads completed in ${(end - start) / 1000} seconds.`);
    return results.filter(Boolean); // 返回成功下载的文件路径
}

const url = "https://video.twimg.com/amplify_video/1923366953034633216/pl/mp4a/32000/OibJqwfGqBZ77aPc.m3u8"

const tsUrls = await extractM3u8Links(url)
const maxConcurrentDownloads = Math.ceil(tsUrls.length / 20)
const downloadedFiles = await downloadTsFiles(tsUrls, 'tmp', '1923368588255060465', maxConcurrentDownloads);
console.log('downloadedFiles:', downloadedFiles);
