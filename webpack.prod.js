const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  devtool: false,
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new WorkboxWebpackPlugin.GenerateSW({
      swDest: "sw.js",
      maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|ico|json|bin)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "models-and-assets",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/(?:cdn-lfs|huggingface\.co|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/i,
          handler: "CacheFirst",
          options: {
            cacheName: "external-resources-cache",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    }),
  ],
});
