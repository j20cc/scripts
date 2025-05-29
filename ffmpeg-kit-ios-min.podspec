require "json"

Pod::Spec.new do |s|
  s.name         = "ffmpeg-kit-ios-min"
  s.version      = "6.0.LTS"
  s.summary      = "FFmpeg Kit iOS Https Shared Framework"
  s.description  = "Includes FFmpeg with gmp and gnutls libraries enabled."
  s.homepage     = "https://github.com/j20cc/ffmpeg-kit"
  s.license      = { :type => "LGPL-3.0", :file => "ffmpeg-kit-ios-min/ffmpegkit.xcframework/ios-arm64/ffmpegkit.framework/LICENSE" }
  s.authors      = "your-username"

  s.platform          = :ios
  s.ios.deployment_target = "12.1"
  s.requires_arc      = true
  s.static_framework  = true

  s.source        = { :http => 'file:' + __dir__ + '/../ffmpeg-kit-ios-min.zip' }

  s.vendored_frameworks = [
    "ffmpeg-kit-ios-min/ffmpegkit.xcframework",
    "ffmpeg-kit-ios-min/libavcodec.xcframework",
    "ffmpeg-kit-ios-min/libavdevice.xcframework",
    "ffmpeg-kit-ios-min/libavfilter.xcframework",
    "ffmpeg-kit-ios-min/libavformat.xcframework",
    "ffmpeg-kit-ios-min/libavutil.xcframework",
    "ffmpeg-kit-ios-min/libswresample.xcframework",
    "ffmpeg-kit-ios-min/libswscale.xcframework",
  ]
end
