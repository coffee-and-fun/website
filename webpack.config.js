const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;

const paths = [

  '/404/',
  '/'
];

module.exports = {
  mode: 'production',
  context: __dirname + '/app/',
  entry: {
    app: './assets/js/index.js',
  },
  plugins: [

    // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new HtmlWebpackPlugin({
      filename: '404.html',
      template: 'templates/404.pug',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      },
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'templates/index.pug',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      },
    }),
    new HTMLInlineCSSWebpackPlugin(),
    new CopyPlugin([{
        from: 'assets/setup/',
        to: ''
      },

      {
        from: 'assets/images/',
        to: 'assets/images/'
      }, {
        from: '../node_modules/@fortawesome/fontawesome-free/svgs/solid/',
        to: 'assets/svgs'
      }, {
        from: '../node_modules/@fortawesome/fontawesome-free/svgs/brands/',
        to: 'assets/svgs'
      }, {
        from: '../node_modules/@fortawesome/fontawesome-free/svgs/regular/',
        to: 'assets/svgs'
      }
    ]),

    new SitemapPlugin('https://www.coffeeandfun.com', paths),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around



      exclude: [/(?:cname|CNAME|app.css|robots.txt|.DS_Store)$/],
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.mp4$/,
        use: 'file-loader?name=videos/[name].[ext]',
 },
      {
        test: /\.pug$/,
        use: 'pug-loader'
      },
      
      
      {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader"
      ]
    }, {
      test: /\.(png|jpe?g|gif|xml|ico|svg|webmanifest)$/i,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
        outputPath: './docs'
      }
    }
  ],
  },
  output: {
    publicPath: '/',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'docs'),
  },
};