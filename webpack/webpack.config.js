const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
var ZipPlugin = require('zip-webpack-plugin');
var webpack = require("webpack");

var pjson = require('../package.json');

module.exports = {
   mode: "production",
   entry: {
      content: path.resolve(__dirname, "..", "src", "content.ts"),
      popup: path.resolve(__dirname, "..", "src", "popup.ts"),
      fieldfinder: path.resolve(__dirname, "..", "src", "fieldfinder.ts"),
      manifest: path.resolve(__dirname, "..", "src", "manifest.json"),
   },
   resolveLoader: {
      modules: [path.resolve(__dirname, "..", 'src', 'modules'), 'node_modules']
   },
   output: {
      path: path.join(__dirname, "../dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
         {
            test: /manifest\.json$/,
            use: [
              "manifest-loader",
            ]
          }
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [{from: ".", to: ".", context: "public"}]
      }),
      new webpack.DefinePlugin({
         fieldFinderVersion: pjson.version,
      }),
      new ZipPlugin({
         path: '../versions',
         filename: `fieldfinder_${pjson.version.replace('.','_')}.zip`,
         pathPrefix: 'relative/path',
         fileOptions: {
           mtime: new Date(),
           mode: 0o100664,
           compress: true,
           forceZip64Format: false,
         },
         zipOptions: {
           forceZip64Format: false,
         },
       })
   ],
   optimization: {
      minimize: true,
      moduleIds: 'named'
   },
};