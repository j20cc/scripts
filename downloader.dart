import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:pool/pool.dart';

class Downloader {
  final Dio dio = Dio();
  final String url;
  final String savePath;
  final int chunkSize;
  final int concurrency;

  Downloader({
    required this.url,
    required this.savePath,
    this.chunkSize = 10 * 1024 * 1024, // 10MB
    this.concurrency = 3,
  });

  double lastProgress = -1;
  bool progressCompleted = false;

  Future<void> download({
    void Function(double progress)? onProgress,
  }) async {
    final total = await _getContentLength();
    if (total == null) throw Exception('无法获取文件大小');

    final file = File(savePath);
    if (!file.existsSync()) {
      await file.writeAsBytes(List.filled(total, 0));
    }

    final chunkCount = (total / chunkSize).ceil();
    final chunks = List.generate(chunkCount, (i) {
      final start = i * chunkSize;
      final end = ((i + 1) * chunkSize - 1).clamp(0, total - 1);
      return (start, end);
    });
    print('分片数量: $chunkCount, 每片大小: $chunkSize 字节');
    print('总大小: $total 字节');

    final pool = Pool(concurrency);
    final lock = Object();
    int receivedTotal = 0;

    final futures = chunks.map((chunk) async {
      final (start, end) = chunk;
      await pool.withResource(() async {
        await _downloadChunk(
          start: start,
          end: end,
          onChunkData: (bytes) {
            synchronized(lock, () {
              receivedTotal += bytes;
              final progress = receivedTotal / total;

              // 回调进度：100% 只触发一次
              if (!progressCompleted && progress >= 1.0) {
                progressCompleted = true;
                onProgress?.call(1.0);
              } else if ((progress - lastProgress).abs() >= 0.0001) {
                lastProgress = progress;
                onProgress?.call(progress);
              }
            });
          },
        );
      });
    });

    await Future.wait(futures);
  }

  Future<int?> _getContentLength() async {
    final response = await dio.head(url);
    final lengthStr = response.headers.value(HttpHeaders.contentLengthHeader);
    return lengthStr != null ? int.tryParse(lengthStr) : null;
  }

  Future<void> _downloadChunk({
    required int start,
    required int end,
    required void Function(int bytes) onChunkData,
  }) async {
    final response = await dio.get<ResponseBody>(
      url,
      options: Options(
        responseType: ResponseType.stream,
        headers: {'Range': 'bytes=$start-$end'},
      ),
    );

    final file = File(savePath);
    final raf = await file.open(mode: FileMode.write);
    await raf.setPosition(start);

    await response.data!.stream.listen(
      (chunk) {
        raf.writeFromSync(chunk);
        onChunkData(chunk.length);
      },
      onError: (e) => throw Exception('分片下载失败: $e'),
      cancelOnError: true,
    ).asFuture();

    await raf.close();
  }

  void synchronized(Object lock, void Function() action) {
    // 简化锁：Dart 单线程事件队列环境，这样即可
    action();
  }
}
