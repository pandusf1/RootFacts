const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 8080,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    historyApiFallback: true,
  },
  plugins: [
    new WorkboxWebpackPlugin.GenerateSW({
      swDest: "sw.js",
      clientsClaim: true,
      skipWaiting: true,
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/model\//, /^\/models\//, /^https:\/\//, /\.[a-z0-9]+$/i],
      exclude: [/_redirects$/, /\.map$/],
      maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: /^\/model\/.*\.(?:json|bin)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "local-models-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [200],
            },
          },
        },
        {
          urlPattern: /huggingface\.co|hf\.co|cdn-lfs|onnxruntime/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "transformers-huggingface-cache",
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 300,
              maxAgeSeconds: 365 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [200],
            },
          },
        },
        {
          urlPattern: /jsdelivr|unpkg|googleapis|gstatic/i,
          handler: "CacheFirst",
          options: {
            cacheName: "external-cdns-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [200],
            },
          },
        },
      ],
    }),
  ],
});
